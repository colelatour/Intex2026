// src/components/donate/DonorHistory.tsx
import { useEffect, useState } from 'react';
import { getSession } from '../../lib/authApi';
import { getMyDonations, type MyDonationsResponse } from '../../lib/donationsApi';

export default function DonorHistory({ refreshKey }: { refreshKey?: number }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [data, setData] = useState<MyDonationsResponse | null>(null);

  useEffect(() => {
    getSession().then((session) => {
      setLoggedIn(session.isAuthenticated);
      if (session.isAuthenticated) {
        getMyDonations()
          .then(setData)
          .catch(() => setData({ firstName: '', lastName: '', donations: [] }));
      }
    }).catch(() => setLoggedIn(false));
  }, [refreshKey]);

  return (
    <div className="donate-history-card">
      <h3>Your Donation History</h3>

      {loggedIn === null && (
        <p className="donate-history-empty">Loading…</p>
      )}

      {loggedIn === false && (
        <p className="donate-history-empty">Log in to view your donor history</p>
      )}

      {loggedIn === true && data && data.donations.length === 0 && (
        <p className="donate-history-empty">No donations recorded, make your first donation today!</p>
      )}

      {loggedIn === true && data && data.donations.length > 0 && (
        <>
          <ul className="donate-history-list">
            {data.donations.map((d) => (
              <li key={d.donationId} className="donate-history-item">
                <span className="donate-history-amount">
                  {d.currencyCode} {Number(d.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="donate-history-date">
                  {new Date(d.donationDate + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
