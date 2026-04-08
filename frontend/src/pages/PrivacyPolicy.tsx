import Footer from '../components/layout/Footer';
import '../styles/PrivacyPolicy.css';

export default function PrivacyPolicy() {
  return (
    <>
      <main className="privacy">
        <div className="privacy__container">
          <h1>Privacy Policy</h1>
          <p className="privacy__updated">Effective April 2026 &middot; Last updated: April 7, 2026</p>
          <p>This policy applies to shelteredlight.com and the Sheltered Light web application.</p>

          <section>
            <h2>1. Who we are</h2>
            <p>
              Sheltered Light is a nonprofit organization dedicated to protecting and rehabilitating survivors of sexual
              abuse and trafficking. We operate safehouses and rehabilitation programs in partnership with
              in-country service providers, funded through donations from individuals and organizations worldwide.
            </p>
            <p>
              For the purposes of the General Data Protection Regulation (GDPR) and applicable data protection
              law, Sheltered Light is the <strong>data controller</strong> responsible for your personal data collected through this
              website and web application.
            </p>
            <p>You can contact us regarding privacy matters at:</p>
            <p>
              <strong>Sheltered Light — Privacy Team</strong><br />
              Email: privacy@shelteredlight.com
            </p>
          </section>

          <section>
            <h2>2. What data we collect</h2>

            <h3>Account data (authenticated users)</h3>
            <p>When you register for or log in to our platform, we collect:</p>
            <ul>
              <li><strong>Email address</strong> — used as your username and primary means of contact</li>
              <li><strong>Password</strong> — stored as a one-way cryptographic hash; we never store your plaintext password</li>
              <li><strong>Account role</strong> — for example, donor or administrator</li>
              <li><strong>Account timestamps</strong> — date and time of account creation and last login</li>
            </ul>

            <h3>Donor and contribution data</h3>
            <p>If you are registered as a donor or supporter, we may also store:</p>
            <ul>
              <li>Display name and contact information you provide</li>
              <li>Donation history (type, amount, date, campaign association)</li>
              <li>Communication preferences and acquisition channel</li>
            </ul>

            <h3>Technical and usage data</h3>
            <p>We may collect limited technical data necessary for security and system operation:</p>
            <ul>
              <li>Authentication session tokens (via secure HTTP-only cookies)</li>
              <li>Browser type and operating system (for compatibility and security logging)</li>
              <li>IP address (for security monitoring and fraud prevention)</li>
            </ul>
            <p>
              We do not use tracking pixels, third-party analytics scripts, or advertising cookies. We do not sell or
              rent your personal data to any third party.
            </p>
          </section>

          <section>
            <h2>3. How we use your data</h2>
            <p>We use your personal data only for the following purposes:</p>
            <ul>
              <li><strong>Authentication and access control</strong> — to verify your identity and grant appropriate access to the platform</li>
              <li><strong>Donor relationship management</strong> — to track contributions, communicate impact, and support donor retention</li>
              <li><strong>Operational administration</strong> — to enable authorized staff to manage cases, generate reports, and coordinate services</li>
              <li><strong>Security and fraud prevention</strong> — to protect accounts, detect unauthorized access, and maintain audit logs</li>
              <li><strong>Legal compliance</strong> — to meet obligations under applicable law and respond to lawful requests</li>
            </ul>
            <p>
              We do not use your data for automated decision-making or profiling that produces legal or similarly
              significant effects.
            </p>
          </section>

          <section>
            <h2>4. Legal basis for processing</h2>
            <p>Under GDPR Article 6, we process your data on the following legal bases:</p>
            <ul>
              <li><strong>Contract performance (Art. 6(1)(b))</strong> — processing your account credentials is necessary to provide the service you registered for</li>
              <li><strong>Legitimate interests (Art. 6(1)(f))</strong> — security logging, fraud prevention, and system reliability represent legitimate interests that do not override your rights</li>
              <li><strong>Legal obligation (Art. 6(1)(c))</strong> — we may be required to retain or disclose certain data to comply with applicable law</li>
              <li><strong>Consent (Art. 6(1)(a))</strong> — for non-essential cookies and optional communications, we rely on your explicit consent, which you may withdraw at any time</li>
            </ul>
          </section>

          <section>
            <h2>5. Cookies and consent</h2>

            <h3>Essential cookies</h3>
            <p>We use a single authentication session cookie to keep you logged in while you use the platform. This cookie is:</p>
            <ul>
              <li><strong>HTTP-only</strong> — not accessible by JavaScript, protecting against XSS session hijacking</li>
              <li>Transmitted only over HTTPS</li>
              <li>Set with SameSite=Lax to reduce cross-site request forgery risk</li>
              <li>Session-scoped or limited to 8 hours, depending on your 'remember me' preference</li>
            </ul>
            <p>
              Essential cookies do not require your consent under GDPR Recital 47, as they are strictly necessary for
              the service to function.
            </p>

            <h3>Cookie consent</h3>
            <p>
              The first time you visit our site, we display a cookie consent banner. Accepting cookies records your
              preference via a first-party cookie (cookie_consent=true) valid for one year. You may withdraw consent
              at any time by clearing your browser cookies or adjusting your browser settings.
            </p>
            <p>We do not set any non-essential, tracking, or advertising cookies.</p>
          </section>

          <section>
            <h2>6. How we share your data</h2>
            <p>
              We do not sell, trade, or rent your personal data. We may share limited data only in the following
              circumstances:
            </p>
            <ul>
              <li><strong>Cloud infrastructure providers</strong> — our platform is hosted on a cloud provider (e.g., Microsoft Azure). Data is stored under their data processing agreements, which meet GDPR transfer requirements</li>
              <li><strong>Legal requirements</strong> — we may disclose information if required by law, court order, or government authority, and only to the extent required</li>
              <li><strong>Organizational staff</strong> — authorized administrators and social workers may access donor and case data within the platform as necessary to carry out their roles</li>
            </ul>
          </section>

          <section>
            <h2>7. How long we keep your data</h2>
            <ul>
              <li><strong>Account data</strong> — retained for the duration of your account and up to 2 years following account closure, unless a longer period is required by law</li>
              <li><strong>Donation records</strong> — retained for a minimum of 7 years to satisfy financial record-keeping obligations</li>
              <li><strong>Security and access logs</strong> — retained for up to 90 days</li>
              <li><strong>Cookie consent records</strong> — retained for 1 year from the date of consent</li>
            </ul>
            <p>When data is no longer required, it is securely deleted or anonymized.</p>
          </section>

          <section>
            <h2>8. Your rights under GDPR</h2>
            <p>
              If you are located in the European Economic Area (EEA) or the United Kingdom, you have the following
              rights regarding your personal data:
            </p>
            <ul>
              <li><strong>Right of access (Art. 15)</strong> — request a copy of the personal data we hold about you</li>
              <li><strong>Right to rectification (Art. 16)</strong> — request that inaccurate data be corrected</li>
              <li><strong>Right to erasure (Art. 17)</strong> — request deletion of your data, subject to legal retention requirements</li>
              <li><strong>Right to restrict processing (Art. 18)</strong> — request that we limit how we use your data</li>
              <li><strong>Right to data portability (Art. 20)</strong> — request your data in a structured, machine-readable format</li>
              <li><strong>Right to object (Art. 21)</strong> — object to processing based on legitimate interests</li>
              <li><strong>Right to withdraw consent (Art. 7(3))</strong> — where processing is based on consent, you may withdraw it at any time without affecting prior processing</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at <strong>privacy@shelteredlight.com</strong>. We will respond within 30
              days. You also have the right to lodge a complaint with your local supervisory authority.
            </p>
          </section>

          <section>
            <h2>9. How we protect your data</h2>
            <p>We have implemented the following technical and organizational security measures:</p>
            <ul>
              <li>All data in transit is encrypted using TLS (HTTPS). HTTP connections are automatically redirected to HTTPS</li>
              <li>Passwords are hashed using industry-standard algorithms via ASP.NET Core Identity — plaintext passwords are never stored</li>
              <li>Authentication requires passwords of 14 characters or more, encouraging strong passphrases</li>
              <li>Session cookies are HTTP-only and Secure, preventing interception and client-side access</li>
              <li>Content Security Policy (CSP) headers restrict which scripts and resources may execute in the browser</li>
              <li>Role-based access control (RBAC) ensures users can only access data appropriate to their role</li>
              <li>All data modification and deletion actions require authentication and explicit confirmation</li>
              <li>Optional multi-factor authentication (MFA) is available for all user accounts</li>
            </ul>
            <p>
              Despite these measures, no system is completely secure. In the event of a data breach that poses a
              risk to your rights, we will notify affected users and relevant authorities as required by law.
            </p>
          </section>

          <section>
            <h2>10. A note on minors and sensitive data</h2>
            <p>
              Sheltered Light serves survivors who are minors. All case data relating to residents is strictly
              confidential and is never disclosed, shared, or published in any form that could identify an individual.
              Public-facing impact reports and dashboards contain only fully anonymized aggregate statistics.
            </p>
            <p>
              Our public website is not directed at children under the age of 16, and we do not knowingly collect
              personal data from children through our public-facing registration system.
            </p>
            <p>
              If you believe a child's data has been processed in error, please contact us immediately at
              privacy@shelteredlight.com.
            </p>
          </section>

          <section>
            <h2>11. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or
              legal requirements. When we make material changes, we will update the 'Last updated' date at the top
              of this page. We encourage you to review this policy periodically.
            </p>
            <p>
              Continued use of our platform after changes take effect constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2>12. Contact us</h2>
            <p>
              For any questions, requests, or concerns regarding this Privacy Policy or your personal data, please
              reach out to us:
            </p>
            <p>
              <strong>Sheltered Light</strong><br />
              Privacy inquiries: privacy@shelteredlight.com
            </p>
            <p>
              We aim to respond to all privacy requests within 30 days. For urgent matters, please include 'URGENT'
              in your subject line.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
