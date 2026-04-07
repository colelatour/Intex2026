import Footer from '../components/layout/Footer';
import '../styles/PrivacyPolicy.css';

export default function PrivacyPolicy() {
  return (
    <>
      <main className="privacy">
        <div className="privacy__container">
          <h1>Privacy Policy</h1>
          <p className="privacy__updated">Last updated: April 7, 2026</p>

          <section>
            <h2>1. Who We Are</h2>
            <p>
              SafeHaven is a registered 501(c)(3) nonprofit organization dedicated to providing safe housing,
              education, and support services for at-risk girls in the Philippines. This privacy policy explains
              how we collect, use, store, and protect your personal data when you use our website.
            </p>
            <p>
              <strong>Contact for data inquiries:</strong> privacy@safehaven.org
            </p>
          </section>

          <section>
            <h2>2. What Data We Collect</h2>
            <p>We collect the following categories of personal data:</p>
            <ul>
              <li><strong>Account information:</strong> email address and password (encrypted) when you create an account.</li>
              <li><strong>Donation information:</strong> donation amounts, dates, and allocation preferences when you make a contribution.</li>
              <li><strong>Usage data:</strong> pages visited, browser type, and session duration via essential cookies.</li>
              <li><strong>Communication data:</strong> any information you voluntarily provide through contact forms.</li>
            </ul>
          </section>

          <section>
            <h2>3. Why We Collect Your Data (Legal Basis)</h2>
            <p>We process your personal data based on the following legal grounds under GDPR Article 6:</p>
            <ul>
              <li><strong>Consent:</strong> for non-essential cookies and analytics (you may withdraw consent at any time via Cookie Settings).</li>
              <li><strong>Contract:</strong> to process your donations and maintain your donor account.</li>
              <li><strong>Legitimate interest:</strong> to improve our website, prevent fraud, and ensure security.</li>
              <li><strong>Legal obligation:</strong> to maintain financial records as required for nonprofit reporting.</li>
            </ul>
          </section>

          <section>
            <h2>4. How We Use Your Data</h2>
            <ul>
              <li>To create and manage your user account.</li>
              <li>To process and track donations.</li>
              <li>To provide you with information about the impact of your contributions.</li>
              <li>To improve our website functionality and user experience.</li>
              <li>To comply with legal and regulatory requirements.</li>
            </ul>
          </section>

          <section>
            <h2>5. Cookies</h2>
            <p>Our site uses the following types of cookies:</p>
            <ul>
              <li>
                <strong>Essential cookies:</strong> required for authentication and site functionality.
                These cannot be disabled as the site would not function without them.
              </li>
              <li>
                <strong>Functional cookies:</strong> remember your preferences such as cookie consent choices.
              </li>
              <li>
                <strong>Analytics cookies:</strong> help us understand how visitors interact with the site
                so we can improve it. These are only activated with your consent.
              </li>
            </ul>
            <p>
              You can manage your cookie preferences at any time by clicking "Cookie Settings" in the
              footer of any page.
            </p>
          </section>

          <section>
            <h2>6. Data Sharing</h2>
            <p>
              We do not sell your personal data. We may share data with the following categories of
              third parties only as necessary:
            </p>
            <ul>
              <li><strong>Cloud hosting providers</strong> (Microsoft Azure) for website infrastructure.</li>
              <li><strong>Payment processors</strong> for secure donation handling.</li>
              <li><strong>Legal authorities</strong> when required by law.</li>
            </ul>
          </section>

          <section>
            <h2>7. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. Donation records are
              retained for 7 years to comply with nonprofit financial reporting requirements. You may
              request deletion of your account at any time (see Your Rights below).
            </p>
          </section>

          <section>
            <h2>8. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your data, including:
            </p>
            <ul>
              <li>HTTPS encryption for all connections.</li>
              <li>Passwords are hashed and never stored in plain text.</li>
              <li>Role-based access controls for administrative functions.</li>
              <li>Content Security Policy headers to prevent cross-site scripting attacks.</li>
            </ul>
          </section>

          <section>
            <h2>9. Your Rights Under GDPR</h2>
            <p>If you are in the European Economic Area, you have the following rights:</p>
            <ul>
              <li><strong>Right of access:</strong> request a copy of the personal data we hold about you.</li>
              <li><strong>Right to rectification:</strong> request correction of inaccurate data.</li>
              <li><strong>Right to erasure:</strong> request deletion of your personal data ("right to be forgotten").</li>
              <li><strong>Right to restrict processing:</strong> request that we limit how we use your data.</li>
              <li><strong>Right to data portability:</strong> receive your data in a structured, machine-readable format.</li>
              <li><strong>Right to object:</strong> object to processing based on legitimate interest.</li>
              <li><strong>Right to withdraw consent:</strong> withdraw consent for non-essential data processing at any time.</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at <strong>privacy@safehaven.org</strong>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2>10. International Data Transfers</h2>
            <p>
              Your data may be processed on servers located in the United States (Microsoft Azure).
              We ensure appropriate safeguards are in place for international transfers in compliance
              with GDPR requirements.
            </p>
          </section>

          <section>
            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Any changes will be posted on this
              page with an updated revision date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2>12. Contact Us</h2>
            <p>
              If you have questions about this privacy policy or wish to exercise your data rights,
              please contact us:
            </p>
            <p>
              <strong>Email:</strong> privacy@safehaven.org<br />
              <strong>Organization:</strong> SafeHaven Foundation
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
