import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const ScheduleContext = createContext();

export function useSchedule() {
  return useContext(ScheduleContext);
}

/**
 * Formats a Date instance into local YYYY-MM-DD without UTC offset drift.
 */
export function formatLocalDateStr(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDateStr(dateStr) {
  if (typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return null;
  const [year, month, day] = parts;
  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function sanitizeDateMap(rawMap) {
  if (!rawMap || typeof rawMap !== 'object' || Array.isArray(rawMap)) return {};
  const cleaned = {};
  Object.entries(rawMap).forEach(([dateStr, ids]) => {
    if (!dateStr || !Array.isArray(ids)) return;
    const unique = Array.from(new Set(ids.filter(id => typeof id === 'string' && id.trim().length > 0)));
    if (unique.length > 0) {
      cleaned[dateStr] = unique;
    }
  });
  return cleaned;
}

function sanitizePatternEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const validTypes = ['weekly', 'monthly', 'interval'];
  const type = validTypes.includes(raw.type) ? raw.type : 'weekly';
  const startDate = typeof raw.startDate === 'string' && parseLocalDateStr(raw.startDate) ? raw.startDate : formatLocalDateStr();
  const endDate = typeof raw.endDate === 'string' && parseLocalDateStr(raw.endDate) ? raw.endDate : startDate;
  const weekdays = Array.isArray(raw.weekdays)
    ? Array.from(new Set(raw.weekdays.filter(d => Number.isInteger(d) && d >= 0 && d <= 6))).sort((a, b) => a - b)
    : [];
  const monthDays = Array.isArray(raw.monthDays)
    ? Array.from(new Set(raw.monthDays.filter(d => Number.isInteger(d) && d >= 1 && d <= 31))).sort((a, b) => a - b)
    : [];
  const everyDays = Number.isInteger(raw.everyDays) && raw.everyDays >= 1 ? raw.everyDays : Math.max(1, parseInt(raw.everyDays, 10) || 1);

  return {
    type,
    weekdays,
    monthDays,
    everyDays,
    startDate,
    endDate,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now()
  };
}

function sanitizePatternsMap(rawPatterns) {
  if (!rawPatterns || typeof rawPatterns !== 'object' || Array.isArray(rawPatterns)) return {};
  const cleaned = {};
  Object.entries(rawPatterns).forEach(([targetId, pattern]) => {
    if (!targetId || typeof targetId !== 'string') return;
    const entry = sanitizePatternEntry(pattern);
    if (entry) cleaned[targetId] = entry;
  });
  return cleaned;
}

/**
 * Expands a recurring pattern config into local YYYY-MM-DD strings bounded cleanly to <= 731 days.
 */
export function generatePatternDates(pattern) {
  const clean = sanitizePatternEntry(pattern);
  if (!clean) return [];
  const start = parseLocalDateStr(clean.startDate);
  const end = parseLocalDateStr(clean.endDate);
  if (!start || !end || end < start) return [];

  const maxDays = 731;
  const result = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  let diffDays = 0;

  while (cursor <= end && diffDays <= maxDays) {
    let matches = false;
    if (clean.type === 'weekly') {
      matches = clean.weekdays.includes(cursor.getDay());
    } else if (clean.type === 'monthly') {
      matches = clean.monthDays.includes(cursor.getDate());
    } else if (clean.type === 'interval') {
      matches = diffDays % clean.everyDays === 0;
    }

    if (matches) {
      result.push(formatLocalDateStr(cursor));
    }

    cursor.setDate(cursor.getDate() + 1);
    diffDays += 1;
  }

  return result;
}

/**
 * Evaluates schedule progress and completion rate without penalizing future or skipped days.
 * When inspecting a parent activity with sub-activities, logging any sub-activity satisfies completion.
 */
export function computeActivityProgress({
  activity,
  selectedSubActivityId = null,
  schedules = {},
  logs = {},
  skipped = {},
  todayStr = formatLocalDateStr()
}) {
  const effectiveId = selectedSubActivityId || activity?.id || null;
  if (!effectiveId) {
    return {
      effectiveId: null,
      totalScheduled: 0,
      totalCompleted: 0,
      totalSkipped: 0,
      totalMissed: 0,
      evaluatedCount: 0,
      completionRate: 0,
      isScheduledOnDate: () => false,
      isCompletedOnDate: () => false,
      isSkippedOnDate: () => false
    };
  }

  const subIds = !selectedSubActivityId && Array.isArray(activity?.subActivities)
    ? activity.subActivities.map(sub => sub.id)
    : [];

  const isScheduledOnDate = (dateStr) => (schedules[dateStr] || []).includes(effectiveId);
  const isCompletedOnDate = (dateStr) => {
    const dayLogs = logs[dateStr] || [];
    if (dayLogs.includes(effectiveId)) return true;
    return subIds.some(subId => dayLogs.includes(subId));
  };
  const isSkippedOnDate = (dateStr) => (skipped[dateStr] || []).includes(effectiveId);

  let totalScheduled = 0;
  let totalCompleted = 0;
  let totalSkipped = 0;
  let totalMissed = 0;
  let evaluatedCount = 0;

  Object.entries(schedules).forEach(([dateStr, scheduledIds]) => {
    if (!Array.isArray(scheduledIds) || !scheduledIds.includes(effectiveId)) return;
    totalScheduled += 1;

    const completed = isCompletedOnDate(dateStr);
    const daySkipped = isSkippedOnDate(dateStr);

    if (completed) {
      totalCompleted += 1;
      evaluatedCount += 1;
    } else if (daySkipped) {
      totalSkipped += 1;
    } else if (dateStr < todayStr) {
      totalMissed += 1;
      evaluatedCount += 1;
    }
  });

  const completionRate = evaluatedCount > 0 ? Math.round((totalCompleted / evaluatedCount) * 100) : 0;

  return {
    effectiveId,
    totalScheduled,
    totalCompleted,
    totalSkipped,
    totalMissed,
    evaluatedCount,
    completionRate,
    isScheduledOnDate,
    isCompletedOnDate,
    isSkippedOnDate
  };
}

export function ScheduleProvider({ children }) {
  const { currentUser } = useAuth();

  // schedules maps dateStr (YYYY-MM-DD) -> array of activityIds
  const [schedules, setSchedules] = useState({});
  // logs maps dateStr (YYYY-MM-DD) -> array of activityIds that were completed
  const [logs, setLogs] = useState({});
  // skipped maps dateStr (YYYY-MM-DD) -> array of activityIds explicitly skipped
  const [skipped, setSkipped] = useState({});
  // patterns maps targetId -> recurring pattern config
  const [patterns, setPatterns] = useState({});
  const [loading, setLoading] = useState(true);

  const schedulesRef = useRef({});
  const logsRef = useRef({});
  const skippedRef = useRef({});
  const patternsRef = useRef({});
  const writeChainRef = useRef(Promise.resolve());
  const mutationSeqRef = useRef(0);
  const pendingWritesRef = useRef(0);

  const applyLocalState = (next) => {
    schedulesRef.current = next.schedules;
    logsRef.current = next.logs;
    skippedRef.current = next.skipped;
    patternsRef.current = next.patterns;
    setSchedules(next.schedules);
    setLogs(next.logs);
    setSkipped(next.skipped);
    setPatterns(next.patterns);
  };

  useEffect(() => {
    if (!currentUser) {
      applyLocalState({ schedules: {}, logs: {}, skipped: {}, patterns: {} });
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    let isMounted = true;

    async function initialFetch() {
      try {
        const docSnap = await getDoc(userDocRef);
        if (isMounted && docSnap && docSnap.exists() && pendingWritesRef.current === 0) {
          const data = docSnap.data() || {};
          const nextSchedules = sanitizeDateMap(data.schedules);
          let nextLogs = sanitizeDateMap(data.logs);
          const nextSkipped = sanitizeDateMap(data.scheduleSkipped);
          const nextPatterns = sanitizePatternsMap(data.schedulePatterns);

          // Legacy subcollection fallback if top-level logs is empty
          if (Object.keys(nextLogs).length === 0) {
            try {
              const logsCol = collection(db, 'users', currentUser.uid, 'logs');
              const subSnap = await getDocs(logsCol);
              if (subSnap && !subSnap.empty) {
                const subLogs = {};
                subSnap.forEach(subDoc => {
                  const subData = subDoc.data();
                  if (Array.isArray(subData.loggedSubActivityIds)) {
                    subLogs[subDoc.id] = subData.loggedSubActivityIds;
                  }
                });
                const cleanedSubLogs = sanitizeDateMap(subLogs);
                if (Object.keys(cleanedSubLogs).length > 0) {
                  nextLogs = cleanedSubLogs;
                  await setDoc(userDocRef, { logs: cleanedSubLogs }, { merge: true });
                }
              }
            } catch (err) {
              console.warn('Subcollection logs fallback check error:', err);
            }
          }

          if (isMounted && pendingWritesRef.current === 0) {
            applyLocalState({
              schedules: nextSchedules,
              logs: nextLogs,
              skipped: nextSkipped,
              patterns: nextPatterns
            });
          }
        }
      } catch (error) {
        console.error('Error loading schedule data initial fetch:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    initialFetch();

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (isMounted && docSnap && docSnap.exists() && pendingWritesRef.current === 0) {
        const data = docSnap.data() || {};
        const nextSchedules = sanitizeDateMap(data.schedules);
        const nextLogs = sanitizeDateMap(data.logs);
        const nextSkipped = sanitizeDateMap(data.scheduleSkipped);
        const nextPatterns = sanitizePatternsMap(data.schedulePatterns);

        if (JSON.stringify(schedulesRef.current) !== JSON.stringify(nextSchedules)) {
          schedulesRef.current = nextSchedules;
          setSchedules(nextSchedules);
        }
        if (JSON.stringify(logsRef.current) !== JSON.stringify(nextLogs)) {
          logsRef.current = nextLogs;
          setLogs(nextLogs);
        }
        if (JSON.stringify(skippedRef.current) !== JSON.stringify(nextSkipped)) {
          skippedRef.current = nextSkipped;
          setSkipped(nextSkipped);
        }
        if (JSON.stringify(patternsRef.current) !== JSON.stringify(nextPatterns)) {
          patternsRef.current = nextPatterns;
          setPatterns(nextPatterns);
        }
      }
      if (isMounted) setLoading(false);
    }, (error) => {
      console.error('Error in ScheduleContext onSnapshot listener:', error);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser]);

  function commitScheduleUpdate(updater, touchedLogDates = []) {
    const prevState = {
      schedules: schedulesRef.current,
      logs: logsRef.current,
      skipped: skippedRef.current,
      patterns: patternsRef.current
    };

    const rawNext = updater(prevState);
    const nextState = {
      schedules: sanitizeDateMap(rawNext.schedules ?? prevState.schedules),
      logs: sanitizeDateMap(rawNext.logs ?? prevState.logs),
      skipped: sanitizeDateMap(rawNext.skipped ?? prevState.skipped),
      patterns: sanitizePatternsMap(rawNext.patterns ?? prevState.patterns)
    };

    const seq = ++mutationSeqRef.current;
    applyLocalState(nextState);

    if (!currentUser) {
      return Promise.resolve();
    }

    pendingWritesRef.current += 1;

    const writePromise = writeChainRef.current
      .catch(() => undefined)
      .then(async () => {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, {
          schedules: nextState.schedules,
          logs: nextState.logs,
          scheduleSkipped: nextState.skipped,
          schedulePatterns: nextState.patterns,
          lastUpdated: Date.now()
        }, {
          mergeFields: ['schedules', 'logs', 'scheduleSkipped', 'schedulePatterns', 'lastUpdated']
        });

        for (const dateStr of touchedLogDates) {
          if (!dateStr) continue;
          try {
            const subLogRef = doc(db, 'users', currentUser.uid, 'logs', dateStr);
            await setDoc(subLogRef, {
              loggedSubActivityIds: nextState.logs[dateStr] || [],
              lastUpdated: Date.now()
            }, { merge: true });
          } catch {
            // Gracefully continue
          }
        }
      })
      .catch((error) => {
        if (mutationSeqRef.current === seq) {
          applyLocalState(prevState);
        }
        console.error('Error saving schedule data:', error);
        throw error;
      })
      .finally(() => {
        pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
      });

    writeChainRef.current = writePromise;
    return writePromise;
  }

  function addIdToDate(map, dateStr, id) {
    const dayIds = map[dateStr] || [];
    if (dayIds.includes(id)) return map;
    return { ...map, [dateStr]: [...dayIds, id] };
  }

  function removeIdFromDate(map, dateStr, id) {
    const dayIds = map[dateStr] || [];
    if (!dayIds.includes(id)) return map;
    const remaining = dayIds.filter(existing => existing !== id);
    const next = { ...map };
    if (remaining.length > 0) {
      next[dateStr] = remaining;
    } else {
      delete next[dateStr];
    }
    return next;
  }

  // Add an activity to a specific date
  function scheduleActivity(activityId, dateStr) {
    if (!activityId || !dateStr) return Promise.resolve();
    const currentDaySchedules = schedulesRef.current[dateStr] || [];
    const currentDaySkipped = skippedRef.current[dateStr] || [];
    if (currentDaySchedules.includes(activityId) && !currentDaySkipped.includes(activityId)) {
      return Promise.resolve();
    }

    return commitScheduleUpdate(prev => ({
      schedules: addIdToDate(prev.schedules, dateStr, activityId),
      skipped: removeIdFromDate(prev.skipped, dateStr, activityId)
    }));
  }

  // Remove an activity from a specific date
  function unscheduleActivity(activityId, dateStr) {
    if (!activityId || !dateStr) return Promise.resolve();
    const currentDaySchedules = schedulesRef.current[dateStr] || [];
    const currentDaySkipped = skippedRef.current[dateStr] || [];
    if (!currentDaySchedules.includes(activityId) && !currentDaySkipped.includes(activityId)) {
      return Promise.resolve();
    }

    return commitScheduleUpdate(prev => ({
      schedules: removeIdFromDate(prev.schedules, dateStr, activityId),
      skipped: removeIdFromDate(prev.skipped, dateStr, activityId)
    }));
  }

  // Explicitly set a date's status: 'planned' | 'completed' | 'skipped' | 'none'
  function setDateStatus(activityId, dateStr, status) {
    if (!activityId || !dateStr) return Promise.resolve();
    const touchedLogDates = status === 'completed' || (logsRef.current[dateStr] || []).includes(activityId)
      ? [dateStr]
      : [];

    return commitScheduleUpdate(prev => {
      if (status === 'planned') {
        return {
          schedules: addIdToDate(prev.schedules, dateStr, activityId),
          logs: removeIdFromDate(prev.logs, dateStr, activityId),
          skipped: removeIdFromDate(prev.skipped, dateStr, activityId)
        };
      }
      if (status === 'completed') {
        return {
          schedules: addIdToDate(prev.schedules, dateStr, activityId),
          logs: addIdToDate(prev.logs, dateStr, activityId),
          skipped: removeIdFromDate(prev.skipped, dateStr, activityId)
        };
      }
      if (status === 'skipped') {
        return {
          schedules: addIdToDate(prev.schedules, dateStr, activityId),
          logs: removeIdFromDate(prev.logs, dateStr, activityId),
          skipped: addIdToDate(prev.skipped, dateStr, activityId)
        };
      }
      // 'none' - remove schedule & skipped marker for this date (keep logs unless cleared explicitly? Clear scheduled + skipped)
      return {
        schedules: removeIdFromDate(prev.schedules, dateStr, activityId),
        skipped: removeIdFromDate(prev.skipped, dateStr, activityId)
      };
    }, touchedLogDates);
  }

  // Apply or edit a recurring schedule pattern for an activity/sub-activity
  function applySchedulePattern(activityId, rawPattern) {
    if (!activityId) return Promise.resolve();
    const cleanPattern = sanitizePatternEntry(rawPattern);
    if (!cleanPattern) return Promise.resolve();

    const targetDates = new Set(generatePatternDates(cleanPattern));
    const prevPattern = patternsRef.current[activityId];
    const prevDates = prevPattern ? new Set(generatePatternDates(prevPattern)) : new Set();

    return commitScheduleUpdate(prev => {
      let nextSchedules = { ...prev.schedules };
      let nextSkipped = { ...prev.skipped };

      // Remove uncompleted occurrences from prior pattern inside the previous pattern's dates
      prevDates.forEach(dateStr => {
        const isLogged = (prev.logs[dateStr] || []).includes(activityId);
        if (!targetDates.has(dateStr) && !isLogged) {
          nextSchedules = removeIdFromDate(nextSchedules, dateStr, activityId);
          nextSkipped = removeIdFromDate(nextSkipped, dateStr, activityId);
        }
      });

      // Add all generated pattern dates
      targetDates.forEach(dateStr => {
        nextSchedules = addIdToDate(nextSchedules, dateStr, activityId);
      });

      return {
        schedules: nextSchedules,
        skipped: nextSkipped,
        patterns: {
          ...prev.patterns,
          [activityId]: cleanPattern
        }
      };
    });
  }

  // Clear saved pattern and remove future/unlogged scheduled occurrences
  function clearSchedulePattern(activityId) {
    if (!activityId) return Promise.resolve();
    const todayStr = formatLocalDateStr();
    const prevPattern = patternsRef.current[activityId];
    const prevDates = prevPattern ? new Set(generatePatternDates(prevPattern)) : null;

    return commitScheduleUpdate(prev => {
      let nextSchedules = { ...prev.schedules };
      let nextSkipped = { ...prev.skipped };

      Object.keys(nextSchedules).forEach(dateStr => {
        const isUpcomingOrPattern = dateStr >= todayStr || (prevDates ? prevDates.has(dateStr) : false);
        const isLogged = (prev.logs[dateStr] || []).includes(activityId);
        if (isUpcomingOrPattern && !isLogged) {
          nextSchedules = removeIdFromDate(nextSchedules, dateStr, activityId);
          nextSkipped = removeIdFromDate(nextSkipped, dateStr, activityId);
        }
      });

      const nextPatterns = { ...prev.patterns };
      delete nextPatterns[activityId];

      return {
        schedules: nextSchedules,
        skipped: nextSkipped,
        patterns: nextPatterns
      };
    });
  }

  // Toggle activity completion for a date
  function toggleActivityLog(activityId, dateStr) {
    if (!activityId || !dateStr) return Promise.resolve();
    const currentDayLogs = logsRef.current[dateStr] || [];
    const isCompleted = currentDayLogs.includes(activityId);

    return commitScheduleUpdate(prev => ({
      logs: isCompleted
        ? removeIdFromDate(prev.logs, dateStr, activityId)
        : addIdToDate(prev.logs, dateStr, activityId),
      skipped: !isCompleted
        ? removeIdFromDate(prev.skipped, dateStr, activityId)
        : prev.skipped
    }), [dateStr]);
  }

  const value = {
    schedules,
    logs,
    skipped,
    patterns,
    loading,
    scheduleActivity,
    unscheduleActivity,
    setDateStatus,
    applySchedulePattern,
    clearSchedulePattern,
    toggleActivityLog
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
}
