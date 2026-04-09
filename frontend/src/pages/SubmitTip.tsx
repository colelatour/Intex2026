import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { submitTip } from '../lib/tipsApi';
import Footer from '../components/layout/Footer';
import '../styles/SubmitTip.css';

const REGIONS = ['Luzon', 'Visayas', 'Mindanao'] as const;

export default function SubmitTip() {
  const location = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!name.trim() || !email.trim()) {
      setSubmitError('Please fill in both name and email.');
      return;
    }

    if (!region) {
      setSubmitError('Please select a region.');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitTip({
        name: name.trim(),
        email: email.trim(),
        region,
      });

      setSubmitSuccess(
        'Thank you. Your tip has been submitted and our team will review it.'
      );
      setName('');
      setEmail('');
      setRegion('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to submit tip right now.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section className="tip-hero">
        <div className="tip-hero__eyebrow">Help Someone in Need</div>
        <h1>Submit a Tip</h1>
        <p>
          If you know someone who may need the support of our organization,
          please share their information below. All tips are kept confidential.
        </p>
      </section>

      <section className="tip-body">
        <form className="tip-form-card" onSubmit={handleSubmit}>
          <h2>Tip Details</h2>
          <p>
            Provide the name, email, and region of the person who may need help.
          </p>

          {submitError && (
            <div className="tip-alert tip-alert--error">{submitError}</div>
          )}
          {submitSuccess && (
            <div className="tip-alert tip-alert--success">{submitSuccess}</div>
          )}

          <label htmlFor="tip-name" className="tip-label">
            Name
          </label>
          <input
            id="tip-name"
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label htmlFor="tip-email" className="tip-label">
            Email
          </label>
          <input
            id="tip-email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="tip-region" className="tip-label">
            Region
          </label>
          <select
            id="tip-region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="">Select a region</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <button
            className="tip-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Tip'}
          </button>
          <p className="tip-note">
            All information is kept confidential and will only be used by our
            team to reach out and offer support.
          </p>
        </form>
      </section>

      <div className="cta-footer-wrap">
        <Footer />
      </div>
    </>
  );
}
