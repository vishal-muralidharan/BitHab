export default function TermsAndConditionsPage() {
  return (
    <article className="legal-document">
      <title>Terms and Conditions - BitHab</title>
      <meta name="description" content="General Terms and Conditions for accessing and using the BitHab web application." />

      <header className="legal-page-header">
        <h1 className="legal-page-title">Terms and Conditions</h1>
        <p className="legal-page-meta">Last Updated: [TODO: Insert Last Updated date]</p>
      </header>

      <div className="legal-document-body">
        <section className="legal-page-section">
          <h2>1. Eligibility</h2>
          <p>
            By accessing or using BitHab, you represent and warrant that you are of legal age to form a binding contract under applicable law: [TODO: confirm minimum age, e.g. 18 or parental consent].
          </p>
          <p>
            If you are accessing or using BitHab on behalf of a company, organization, or legal entity, you represent and warrant that you possess the requisite authority to bind such entity to these Terms and Conditions.
          </p>
        </section>

        <section className="legal-page-section">
          <h2>2. Modifications to the Service and Terms</h2>
          <p>
            BitHab reserves the right, at its sole discretion, to modify, update, replace, or discontinue features of the application or these Terms and Conditions at any time.
          </p>
          <p>
            When material changes are made to these terms, we will provide notice through the application (such as by presenting an updated terms confirmation dialog upon login) and update the "Last Updated" date at the top of this page. Your continued use of BitHab following notice of modifications constitutes full and binding acceptance of the revised terms.
          </p>
        </section>

        <section className="legal-page-section">
          <h2>3. Third-Party Links and External Services</h2>
          <p>
            The BitHab application may contain links or integrations to third-party websites, documentation, or services (including authentication via Google Identity).
          </p>
          <p>
            BitHab has no control over, and assumes no responsibility for, the content, accuracy, privacy policies, or practices of any third-party websites or services. You acknowledge and agree that BitHab shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such third-party content or services.
          </p>
        </section>

        <section className="legal-page-section">
          <h2>4. Governing Law and Jurisdiction</h2>
          <p>
            These Terms and Conditions, and any dispute, controversy, or claim arising out of or related to your use of BitHab or these terms, shall be governed by and construed in accordance with the laws of [TODO: specify governing jurisdiction, e.g. Courts of Bengaluru, Karnataka, India], without regard to conflict of law principles.
          </p>
          <p>
            You agree to submit to the exclusive personal jurisdiction of the competent courts located in [TODO: specify governing jurisdiction, e.g. Courts of Bengaluru, Karnataka, India] for the resolution of any legal proceedings arising hereunder.
          </p>
        </section>

        <section className="legal-page-section">
          <h2>5. Severability</h2>
          <p>
            If any provision of these Terms and Conditions is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be enforced to the maximum extent permissible so as to effect the intent of the parties, and the remaining provisions of these Terms and Conditions shall remain in full force and effect.
          </p>
        </section>

        <section className="legal-page-section">
          <h2>6. Entire Agreement</h2>
          <p>
            These Terms and Conditions, together with the <a href="/terms" style={{ color: 'var(--primary-color)' }}>Terms of Service</a>, <a href="/privacy" style={{ color: 'var(--primary-color)' }}>Privacy Policy</a>, and any explicit notices posted in the application, constitute the sole and entire agreement between you and BitHab with respect to the subject matter hereof, superseding all prior or contemporaneous understandings, representations, agreements, or warranties, whether written or oral.
          </p>
        </section>
      </div>
    </article>
  );
}
