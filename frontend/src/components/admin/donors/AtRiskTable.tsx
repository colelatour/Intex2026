import { useEffect, useState } from 'react';
import { get } from '../../../lib/api';

interface ChurnScoreDto {
  supporterId: string;
  displayName: string | null;
  email: string | null;
  scoredAt: string;
  churnProbability: number;
  churnRiskLabel: string | null;
  modelVersion: string | null;
}

export default function AtRiskTable() {
  const [scores,   setScores]   = useState<ChurnScoreDto[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [contacted, setContacted] = useState<Set<string>>(new Set());

  useEffect(() => {
    get<ChurnScoreDto[]>('/api/churn/at-risk')
      .then(d => { setScores(d); setLoading(false); })
      .catch((err: Error) => { setError(err.message); setLoading(false); });
  }, []);

  function markContacted(id: string) {
    setContacted(prev => new Set([...prev, id]));
  }

  function buildMailtoHref(score: ChurnScoreDto) {
    const displayName = score.displayName ?? score.supporterId;
    const subject = `Checking in from Sheltered Light`;
    const body =
      `Hi ${displayName},\n\n` +
      `Thank you for your support of Sheltered Light. Your generosity helps provide safe shelter, education, and care for girls in need.\n\n` +
      `We wanted to check in and share updates on the impact of your support. If you're open to it, we'd love to reconnect and hear from you.\n\n` +
      `With gratitude,\n` +
      `The Sheltered Light Team`;

    return `mailto:${encodeURIComponent(score.email ?? '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  if (loading) return <p style={{ padding: '2rem' }}>Loading at-risk donors…</p>;
  if (error)   return <p style={{ padding: '2rem', color: '#A32D2D' }}>Error: {error}</p>;

  return (
    <div className="supporter-table-wrap">
      {scores.length === 0
        ? <p style={{ padding: '2rem', color: '#888' }}>No churn scores available. Run the pipeline first.</p>
        : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Risk</th>
                  <th>Churn Likelihood</th>
                  <th>Scored At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scores.map(s => (
                  <tr key={s.supporterId}>
                    <td>{s.displayName ?? s.supporterId}</td>
                    <td>{s.email ?? '—'}</td>
                    <td><ChurnBadge label={s.churnRiskLabel} /></td>
                    <td>{(s.churnProbability * 100).toFixed(1)}%</td>
                    <td>{new Date(s.scoredAt).toLocaleDateString()}</td>
                    <td>
                      <div className="at-risk-actions">
                        <button
                          className="btn-export"
                          onClick={() => {
                            if (!s.email) return;
                            window.location.href = buildMailtoHref(s);
                          }}
                          disabled={!s.email}
                        >
                          Draft outreach
                        </button>
                        {contacted.has(s.supporterId)
                          ? <span className="contacted-label">Logged ✓</span>
                          : (
                            <button
                              className="btn-add"
                              onClick={() => markContacted(s.supporterId)}
                            >
                              Mark contacted
                            </button>
                          )
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}

function ChurnBadge({ label }: { label: string | null }) {
  if (!label) return <span className="badge-churn-none">—</span>;
  const cls = label === 'High' ? 'badge-churn-high'
    : label === 'Medium' ? 'badge-churn-medium'
    : 'badge-churn-low';
  return <span className={cls}>{label}</span>;
}
