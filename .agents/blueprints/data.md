# Data Blueprint

Extracted database schemas, models, schemas, and storage keys.

## Generated facts

- **Storage Key: bithab-theme-preferences**
  - Evidence: `src/context/ThemeContext.jsx:178` (confidence: high)
    - `Constant STORAGE_KEY resolves to 'bithab-theme-preferences'`
- **Storage Key: bithab-theme-preferences**
  - Evidence: `src/context/ThemeContext.jsx:193` (confidence: high)
    - `Constant STORAGE_KEY resolves to 'bithab-theme-preferences'`
- **Storage Key: bithab-theme-preferences**
  - Evidence: `src/context/ThemeContext.jsx:287` (confidence: high)
    - `Constant STORAGE_KEY resolves to 'bithab-theme-preferences'`
- **Storage Key: bithab-theme-preferences**
  - Evidence: `tests/context/ThemeContext.test.jsx:58` (confidence: high)
    - `const stored = JSON.parse(localStorage.getItem('bithab-theme-preferences'));`
- **Storage Key: bithab-theme-preferences**
  - Evidence: `tests/context/ThemeContext.test.jsx:78` (confidence: high)
    - `const stored = JSON.parse(localStorage.getItem('bithab-theme-preferences'));`
- **Storage Key: bithab_theme_prefs**
  - Evidence: `src/pages/Settings.jsx:62` (confidence: high)
    - `window.localStorage.removeItem('bithab_theme_prefs');`

## Signals (evidence only, not facts)

- Time serialization signal: `src/api/user.js:88` (`exported_at: new Date().toISOString(),`)
- Time serialization signal: `src/context/ActivityContext.jsx:107` (`lastUpdated: Date.now()`)
- Time serialization signal: `src/context/ActivityContext.jsx:119` (`id: 'activity-' + Date.now(),`)
- Time serialization signal: `src/context/ActivityContext.jsx:122` (`createdAt: Date.now()`)
- Time serialization signal: `src/context/ActivityContext.jsx:142` (`id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,`)
- Time serialization signal: `src/context/ActivityContext.jsx:80` (`lastUpdated: Date.now()`)
- Time serialization signal: `src/context/ActivityContext.jsx:95` (`id: `focus-${Date.now()}`,`)
- Time serialization signal: `src/context/ActivityContext.jsx:98` (`timestamp: Date.now()`)
- Time serialization signal: `src/context/GoalContext.jsx:136` (`id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,`)
- Time serialization signal: `src/context/GoalContext.jsx:139` (`createdAt: Date.now()`)
- Time serialization signal: `src/context/GoalContext.jsx:80` (`lastUpdated: Date.now(),`)
- Time serialization signal: `src/context/GoalContext.jsx:93` (`id: 'goal_' + Date.now(),`)
- Time serialization signal: `src/context/GoalContext.jsx:98` (`createdAt: Date.now()`)
- Time serialization signal: `src/context/ListContext.jsx:117` (`id: `item-${Date.now()}`,`)
- Time serialization signal: `src/context/ListContext.jsx:77` (`lastUpdated: Date.now()`)
- Time serialization signal: `src/context/ListContext.jsx:89` (`id: `list-${Date.now()}`,`)
- Time serialization signal: `src/context/ListContext.jsx:93` (`createdAt: Date.now()`)
- Time serialization signal: `src/context/NoteContext.jsx:14` (`const dateStr = n.date || (/^\d{4}-\d{2}-\d{2}$/.test(n.id) ? n.id : (isDaily ? new Date().toISOStri`)
- Time serialization signal: `src/context/NoteContext.jsx:15` (`const id = n.id || (dateStr ? `note_${dateStr}` : `note_${Date.now()}_${Math.random().toString(36).s`)
- Time serialization signal: `src/context/NoteContext.jsx:182` (`id: n.id || String(Date.now()),`)
- Time serialization signal: `src/context/NoteContext.jsx:189` (`createdAt: n.createdAt || Date.now(),`)
- Time serialization signal: `src/context/NoteContext.jsx:190` (`updatedAt: Date.now()`)
- Time serialization signal: `src/context/NoteContext.jsx:194` (`lastUpdated: Date.now(),`)
- Time serialization signal: `src/context/NoteContext.jsx:245` (`id: n.id || String(Date.now()),`)
- Time serialization signal: `src/context/NoteContext.jsx:252` (`createdAt: n.createdAt || Date.now(),`)
- Time serialization signal: `src/context/NoteContext.jsx:253` (`updatedAt: Date.now()`)
- Time serialization signal: `src/context/NoteContext.jsx:260` (`lastUpdated: Date.now(),`)
- Time serialization signal: `src/context/NoteContext.jsx:277` (`updatedAt: Date.now()`)
- Time serialization signal: `src/context/NoteContext.jsx:28` (`createdAt: n.createdAt || Date.now(),`)
- Time serialization signal: `src/context/NoteContext.jsx:29` (`updatedAt: n.updatedAt || Date.now()`)
- Time serialization signal: `src/context/NoteContext.jsx:291` (`updatedAt: Date.now()`)
- Time serialization signal: `src/context/NoteContext.jsx:305` (`const todayStr = new Date().toISOString().split('T')[0];`)
- Time serialization signal: `src/context/NoteContext.jsx:307` (`id: 'note_' + Date.now(),`)
- Time serialization signal: `src/context/NoteContext.jsx:314` (`createdAt: Date.now(),`)
- Time serialization signal: `src/context/NoteContext.jsx:315` (`updatedAt: Date.now()`)
- Time serialization signal: `src/context/NoteContext.jsx:329` (`updatedAt: Date.now()`)
- Time serialization signal: `src/context/NoteContext.jsx:341` (`return { ...n, favorite: nextFav, isFavorite: nextFav, updatedAt: Date.now() };`)
- Time serialization signal: `src/context/ReminderContext.jsx:101` (`createdAt: Date.now()`)
- Time serialization signal: `src/context/ReminderContext.jsx:19` (`const todayStr = new Date().toISOString().split('T')[0];`)
- Time serialization signal: `src/context/ReminderContext.jsx:79` (`lastUpdated: Date.now(),`)
- Time serialization signal: `src/context/ReminderContext.jsx:92` (`const defaultDate = date || today.toISOString().split('T')[0];`)
- Time serialization signal: `src/context/ReminderContext.jsx:96` (`id: 'reminder_' + Date.now(),`)
- Time serialization signal: `src/context/ScheduleContext.jsx:105` (`lastUpdated: Date.now()`)
- Time serialization signal: `src/context/ScheduleContext.jsx:114` (`lastUpdated: Date.now()`)
- Time serialization signal: `src/context/ThemeContext.jsx:290` (`updatedAt: Date.now()`)
- Time serialization signal: `src/context/ThemeContext.jsx:301` (`lastUpdated: Date.now()`)
- Time serialization signal: `src/pages/Analytics.jsx:104` (`const checkStr = checkDate.toISOString().split('T')[0];`)
- Time serialization signal: `src/pages/Analytics.jsx:59` (`const dateStr = d.toISOString().split('T')[0];`)
- Time serialization signal: `src/pages/Analytics.jsx:95` (`const todayStr = now.toISOString().split('T')[0];`)
- Time serialization signal: `src/pages/Analytics.jsx:98` (`const yesterdayStr = yesterday.toISOString().split('T')[0];`)
- Time serialization signal: `src/pages/DPDP.jsx:19` (`const dateStr = new Date().toISOString().split('T')[0];`)
- Time serialization signal: `src/pages/DeepFocus.jsx:126` (`const todayStr = new Date().toISOString().split('T')[0];`)
- Time serialization signal: `src/pages/DeepFocus.jsx:133` (`startTime: new Date(Date.now() - durationMs).toISOString(),`)
- Time serialization signal: `src/pages/DeepFocus.jsx:134` (`endTime: new Date().toISOString(),`)
- Time serialization signal: `src/pages/DeepFocus.jsx:142` (`createdAt: new Date().toISOString()`)
- Time serialization signal: `src/pages/DeepFocus.jsx:156` (`finalDuration = Date.now() - sessionStartRef.current;`)
- Time serialization signal: `src/pages/DeepFocus.jsx:178` (`pausedAtRef.current = Date.now();`)
- Time serialization signal: `src/pages/DeepFocus.jsx:192` (`sessionStartRef.current = Date.now();`)
- Time serialization signal: `src/pages/DeepFocus.jsx:196` (`const pauseDuration = Date.now() - pausedAtRef.current;`)
- Time serialization signal: `src/pages/DeepFocus.jsx:203` (`const nowMs = Date.now();`)
- Time serialization signal: `src/pages/Focus.jsx:80` (`lastUpdated: Date.now()`)
- Time serialization signal: `src/pages/Goals.jsx:92` (`id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,`)
- Time serialization signal: `src/pages/Goals.jsx:95` (`createdAt: Date.now()`)
- Time serialization signal: `src/pages/Notes.jsx:17` (`const todayStr = new Date().toISOString().split('T')[0];`)
- Time serialization signal: `src/pages/Reminders.jsx:13` (`return d.toISOString().split('T')[0];`)
- Time serialization signal: `src/pages/Reminders.jsx:69` (`setDate(tomorrow.toISOString().split('T')[0]);`)
- Time serialization signal: `src/pages/Reminders.jsx:88` (`const dateValue = targetDate.toISOString().split('T')[0];`)
- Time serialization signal: `tests/pages/Analytics.test.jsx:15` (`const todayStr = new Date().toISOString().split('T')[0];`)

<!-- BEGIN CUSTOM: contracts -->
<!-- END CUSTOM: contracts -->
