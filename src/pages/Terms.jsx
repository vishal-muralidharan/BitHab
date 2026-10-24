export default function TermsPage() {
  return (
    <article className="legal-document">
      <title>Terms of Service - BitHab</title>
      <meta name="description" content="Read the Terms of Service for BitHab, your personal habit tracker and productivity workspace." />
      
      <header className="legal-page-header">
        <h1 className="legal-page-title">Terms of Service</h1>
        <p className="legal-page-meta">Last Updated: [TODO: Insert Last Updated date]</p>
      </header>

      <div className="legal-document-body">
        <section className="legal-page-section">
          <h2>1. Description of Service</h2>
          <p>
            BitHab is a personal habit tracking, productivity management, and focus timer web application designed to help individuals build positive routines, monitor daily habits, log reflections, and structure distraction-free work blocks.
          </p>
          <p>
            The service is provided via modern web browsers and mobile interfaces. Features include custom activity tracking, milestone goals, time-based reminders, daily notes, customizable lists, and full-screen deep focus sessions.
          </p>
        </section>

        <section className="legal-page-section">
          <h2>2. Your Content and Ownership</h2>
          <p>
            You retain 100% full ownership, title, and intellectual property rights in and to any data, text, notes, habit names, logs, or other material you submit, post, or store within BitHab ("Your Content").
          </p>
          <p>
            By using BitHab, you grant us solely a non-exclusive, worldwide, royalty-free, limited license to host, store, display, cache, and transmit Your Content strictly for the purpose of operating, maintaining, and delivering the service back to you across your authorized devices. We do not sell, rent, or commercialize your personal content.
          </p>
        </section>

        <section className="legal-page-section">
          <h2>3. Acceptable Use</h2>
          <p>You agree to use BitHab solely for lawful personal productivity purposes. You agree not to:</p>
          <ul>
            <li>Abuse, disrupt, probe, or compromise the integrity, security, or availability of BitHab's infrastructure, databases, or client applications.</li>
            <li>Use automated scripts, bots, spiders, or scrapers to extract data from BitHab without prior written permission.</li>
            <li>Reverse engineer, decompile, disassemble, or derive source code from any portion of the service, except where permitted by applicable mandatory law.</li>
            <li>Circumvent or attempt to bypass authentication mechanisms, authorization checks, or Firestore security rules.</li>
            <li>Store or transmit unlawful, infringing, fraudulent, defamatory, or harmful code or material.</li>
          </ul>
        </section>

        <section className="legal-page-section">
          <h2>4. Not Medical or Professional Advice</h2>
          <p>
            BitHab and its constituent features—including habit streaks, reminders, productivity metrics, reflection journals, and focus timers—are intended exclusively for personal lifestyle organization and time management.
          </p>
          <p>
            BitHab does not provide medical, psychiatric, physiological, mental health, dietary, or healthcare advice or diagnosis. The service should never be used as a substitute for professional medical consultation, treatment, or clinical intervention. If you are experiencing physical or mental health difficulties, please consult a qualified healthcare professional.
          </p>
        </section>

        <section className="legal-page-section">
          <h2>5. Account Responsibilities</h2>
          <p>
            When creating an account on BitHab, you must provide accurate and verifiable credentials. You are responsible for safeguarding your login credentials (password or third-party OAuth access) and for any activity executed under your account.
          </p>
          <p>
            You agree to notify BitHab immediately upon discovering any unauthorized use of your account, breach of security, or suspected compromise. BitHab will not be liable for any loss or damage arising from your failure to maintain credential confidentiality.
          </p>
        </section>

        <section className="legal-page-section">
          <h2>6. Data Backup and Export</h2>
          <p>
            While BitHab employs industry-standard cloud database persistence (via Google Cloud Firestore), network outages, hardware failures, software updates, or user errors may occur.
          </p>
          <p>
            You are strongly encouraged to maintain independent backups of your personal reflections and logs by using the "Download My Data" export feature located on the Manage My Data page (/dpdp). BitHab does not warrant uninterrupted data availability and is not liable for data loss or corruption resulting from unforeseen technical faults.
          </p>
        </section>

        <section className="legal-page-section">
          <h2>7. Disclaimer of Warranties</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, BITHAB IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE.
          </p>
          <p>
            WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, ACCURACY, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE FROM HARMFUL COMPONENTS.
          </p>
        </section>

        <section className="legal-page-section">
          <h2>8. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL BITHAB, ITS DIRECTORS, EMPLOYEES, AFFILIATES, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING DAMAGES FOR LOSS OF PROFITS, DATA, GOODWILL, WORK STOPPAGE, OR COMPUTER MALFUNCTION, ARISING OUT OF OR IN CONNECTION WITH YOUR ACCESS TO OR USE OF (OR INABILITY TO USE) THE SERVICE.
          </p>
          <p>
            IN ALL CIRCUMSTANCES, OUR AGGREGATE LIABILITY ARISING FROM OR RELATED TO THESE TERMS OR THE SERVICE SHALL BE STRICTLY LIMITED TO [CONFIRM: liability cap, e.g. amount paid in last 12 months or INR 1,000].
          </p>
        </section>
      </div>
    </article>
  );
}
