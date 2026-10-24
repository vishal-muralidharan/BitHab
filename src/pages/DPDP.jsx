import { useState } from 'react';
import { Link } from 'react-router-dom';
import { exportUserData } from '../api/user';

export default function DPDPPage() {
  const [downloadStatus, setDownloadStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);

  async function handleDownloadData() {
    try {
      setDownloadStatus('loading');
      setErrorMessage(null);

      const data = await exportUserData();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = url;
      link.download = `bithab-data-export-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadStatus('success');
      setTimeout(() => setDownloadStatus('idle'), 4000);
    } catch (err) {
      console.error('Data export error:', err);
      setErrorMessage(err.message || 'Failed to export your data. Please try again.');
      setDownloadStatus('error');
    }
  }

  return (
    <div className="dpdp-page">
      <Link to="/settings" className="dpdp-back-link" id="dpdp-back-to-settings">
        <i className="fas fa-arrow-left" aria-hidden="true"></i>
        <span>Back to Settings</span>
      </Link>

      <header className="settings-header">
        <h1 className="settings-title">
          <i className="fas fa-user-shield" aria-hidden="true"></i>
          <span>Manage My Data (DPDP)</span>
        </h1>
        <p className="settings-subtitle">
          Your personal data rights and governance under India's Digital Personal Data Protection (DPDP) Act, 2023.
        </p>
      </header>

      {/* Section 1: Data We Process */}
      <section className="settings-section" aria-labelledby="dpdp-data-title">
        <h2 id="dpdp-data-title" className="settings-section-title">
          <i className="fas fa-database" aria-hidden="true"></i>
          <span>1. Data We Process</span>
        </h2>
        <p className="settings-contact-text">
          BitHab processes only the minimum data required to deliver personal productivity, habit tracking, and timer features. We never sell your personal data or share your information with third-party advertisers.
        </p>

        <div className="dpdp-data-grid">
          <div className="dpdp-data-card">
            <h3 className="dpdp-data-card-title">
              <i className="fas fa-id-card" aria-hidden="true"></i>
              <span>Account & Profile</span>
            </h3>
            <p className="dpdp-data-card-desc">
              Your email address, authentication user identifier (UID), account creation timestamp, and terms consent history.
            </p>
          </div>

          <div className="dpdp-data-card">
            <h3 className="dpdp-data-card-title">
              <i className="fas fa-tasks" aria-hidden="true"></i>
              <span>Habits & Activities</span>
            </h3>
            <p className="dpdp-data-card-desc">
              Habit names, subactivities, visual theme colors, scheduled time blocks, and completion check-in histories.
            </p>
          </div>

          <div className="dpdp-data-card">
            <h3 className="dpdp-data-card-title">
              <i className="fas fa-bullseye" aria-hidden="true"></i>
              <span>Goals & Milestones</span>
            </h3>
            <p className="dpdp-data-card-desc">
              Target goals, metric increments, milestone progress records, and goal completion statuses.
            </p>
          </div>

          <div className="dpdp-data-card">
            <h3 className="dpdp-data-card-title">
              <i className="fas fa-bell" aria-hidden="true"></i>
              <span>Reminders & Alerts</span>
            </h3>
            <p className="dpdp-data-card-desc">
              In-app habit reminders, target times, and recurrence frequencies (executed strictly in-browser without third-party push services).
            </p>
          </div>

          <div className="dpdp-data-card">
            <h3 className="dpdp-data-card-title">
              <i className="fas fa-book-open" aria-hidden="true"></i>
              <span>Notes & Reflections</span>
            </h3>
            <p className="dpdp-data-card-desc">
              Daily reflection notes, general scratchpads, pinned items, and private habit journals.
            </p>
          </div>

          <div className="dpdp-data-card">
            <h3 className="dpdp-data-card-title">
              <i className="fas fa-stopwatch" aria-hidden="true"></i>
              <span>Focus & Productivity</span>
            </h3>
            <p className="dpdp-data-card-desc">
              Timer session logs, duration tallies, mode presets (Pomodoro, Short Break, Long Break), and focus completion analytics.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Your Rights under the DPDP Act, 2023 */}
      <section className="settings-section" aria-labelledby="dpdp-rights-title">
        <h2 id="dpdp-rights-title" className="settings-section-title">
          <i className="fas fa-scale-balanced" aria-hidden="true"></i>
          <span>2. Your Rights under the DPDP Act, 2023</span>
        </h2>
        <p className="settings-contact-text">
          As a Data Principal, the Digital Personal Data Protection Act, 2023 guarantees you specific statutory rights regarding how your personal information is stored and processed:
        </p>

        <div className="dpdp-rights-list">
          <div className="dpdp-right-item">
            <h3 className="dpdp-right-name">
              <i className="fas fa-file-export" aria-hidden="true"></i>
              <span>Right to Access</span>
            </h3>
            <p className="dpdp-right-desc">
              You have the right to obtain a summary of your personal data being processed by BitHab, along with identities of data fiduciaries and processors involved. You can download a complete JSON export below at any time.
            </p>
          </div>

          <div className="dpdp-right-item">
            <h3 className="dpdp-right-name">
              <i className="fas fa-pen-to-square" aria-hidden="true"></i>
              <span>Right to Correction and Erasure</span>
            </h3>
            <p className="dpdp-right-desc">
              You have the right to rectify inaccurate or misleading personal data, complete incomplete records, and request full erasure of your personal data when it is no longer necessary for the purposes of processing.
            </p>
          </div>

          <div className="dpdp-right-item">
            <h3 className="dpdp-right-name">
              <i className="fas fa-ban" aria-hidden="true"></i>
              <span>Right to Withdraw Consent</span>
            </h3>
            <p className="dpdp-right-desc">
              You may withdraw your consent for data processing at any point. Withdrawal is made as easy as giving consent: deleting your account permanently removes all personal records from our databases.
            </p>
          </div>

          <div className="dpdp-right-item">
            <h3 className="dpdp-right-name">
              <i className="fas fa-headset" aria-hidden="true"></i>
              <span>Right to Grievance Redressal</span>
            </h3>
            <p className="dpdp-right-desc">
              You have the right to readily available means of grievance redressal with BitHab regarding any act or omission of the data fiduciary. See our Grievance Officer contact details below.
            </p>
          </div>

          <div className="dpdp-right-item">
            <h3 className="dpdp-right-name">
              <i className="fas fa-user-plus" aria-hidden="true"></i>
              <span>Right to Nominate</span>
            </h3>
            <p className="dpdp-right-desc">
              You have the right to nominate any other individual who shall, in the event of your death or incapacity, exercise your data protection rights on your behalf.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Data Management Tools */}
      <section className="settings-section" aria-labelledby="dpdp-tools-title">
        <h2 id="dpdp-tools-title" className="settings-section-title">
          <i className="fas fa-toolbox" aria-hidden="true"></i>
          <span>3. Data Management Tools</span>
        </h2>
        <p className="settings-contact-text">
          Exercise your statutory rights directly using our automated self-service privacy controls:
        </p>

        <div className="dpdp-tools-actions">
          <button 
            type="button" 
            className="dpdp-download-btn"
            id="download-data-btn"
            onClick={handleDownloadData}
            disabled={downloadStatus === 'loading'}
          >
            <i className={`fas ${downloadStatus === 'loading' ? 'fa-spinner fa-spin' : 'fa-download'}`} aria-hidden="true"></i>
            <span>{downloadStatus === 'loading' ? 'Exporting Data...' : 'Download My Data (.json)'}</span>
          </button>

          <Link to="/settings" className="dpdp-danger-link" id="dpdp-erase-data-link">
            <i className="fas fa-trash-alt" aria-hidden="true"></i>
            <span>Request Account Deletion (Danger Zone)</span>
          </Link>
        </div>

        {downloadStatus === 'success' && (
          <p style={{ color: 'var(--success-color)', marginTop: '0.75rem', fontSize: '0.9rem', fontWeight: 500 }}>
            <i className="fas fa-check-circle" aria-hidden="true" style={{ marginRight: '0.4rem' }}></i>
            Data export successfully generated and downloaded.
          </p>
        )}

        {downloadStatus === 'error' && (
          <p style={{ color: 'var(--error-color)', marginTop: '0.75rem', fontSize: '0.9rem', fontWeight: 500 }}>
            <i className="fas fa-exclamation-circle" aria-hidden="true" style={{ marginRight: '0.4rem' }}></i>
            {errorMessage}
          </p>
        )}
      </section>

      {/* Section 4: Grievance Redressal */}
      <section className="settings-section" aria-labelledby="dpdp-grievance-title">
        <h2 id="dpdp-grievance-title" className="settings-section-title">
          <i className="fas fa-envelope-open-text" aria-hidden="true"></i>
          <span>4. Grievance Redressal</span>
        </h2>
        <p className="settings-contact-text">
          For questions, unresolved privacy concerns, or exercising formal statutory requests under the DPDP Act, contact our designated Grievance Officer:
        </p>

        <div className="dpdp-grievance-box">
          <div className="dpdp-grievance-item">
            <span className="dpdp-grievance-label">Grievance Officer Name</span>
            <span className="dpdp-grievance-val">[TODO: Insert Grievance Officer Name]</span>
          </div>

          <div className="dpdp-grievance-item">
            <span className="dpdp-grievance-label">Designation</span>
            <span className="dpdp-grievance-val">[TODO: Insert Designation, e.g. Data Protection Officer]</span>
          </div>

          <div className="dpdp-grievance-item">
            <span className="dpdp-grievance-label">Contact Email</span>
            <span className="dpdp-grievance-val">
              <a href="mailto:[TODO: Insert Contact Email, e.g. privacy@bithab.com]" style={{ color: 'var(--primary-color)' }}>
                [TODO: Insert Contact Email, e.g. privacy@bithab.com]
              </a>
            </span>
          </div>

          <div className="dpdp-grievance-item">
            <span className="dpdp-grievance-label">Registered Office Address</span>
            <span className="dpdp-grievance-val">[TODO: Insert Registered Address]</span>
          </div>

          <div className="dpdp-grievance-item">
            <span className="dpdp-grievance-label">Statutory Response Timeframe</span>
            <span className="dpdp-grievance-val">[CONFIRM: 30 days response timeframe pursuant to DPDP Act, 2023]</span>
          </div>
        </div>
      </section>
    </div>
  );
}
