import { useEffect, useState } from 'react';

interface ChurnScoreDto {
  supporterId: string;
  displayName: string | null;
  email: string | null;
  scoredAt: string;
  churnProbability: number;
  churnRiskLabel: string | null;
  modelVersion: string | null;
}

export default function DonorDashboard() {
  const [scores, setScores]   = useState<ChurnScoreDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/churn/at-risk`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json() as Promise<ChurnScoreDto[]>;
      })
      .then(data => { setScores(data); setLoading(false); })
      .catch((err: Error) => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return <p style={{ padding: '2rem' }}>Loading churn scores…</p>;
  if (error)   return <p style={{ padding: '2rem', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>At-Risk Donors ({scores.length})</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
            <th style={th}>Name</th>
            <th style={th}>Email</th>
            <th style={th}>Churn Probability</th>
            <th style={th}>Risk Label</th>
            <th style={th}>Scored At</th>
            <th style={th}>Model</th>
          </tr>
        </thead>
        <tbody>
          {scores.map(s => (
            <tr key={s.supporterId} style={{ borderBottom: '1px solid #eee' }}>
              <td style={td}>{s.displayName ?? s.supporterId}</td>
              <td style={td}>{s.email ?? '—'}</td>
              <td style={td}>{(s.churnProbability * 100).toFixed(1)}%</td>
              <td style={td}>
                <span style={badgeStyle(s.churnRiskLabel)}>
                  {s.churnRiskLabel ?? '—'}
                </span>
              </td>
              <td style={td}>{new Date(s.scoredAt).toLocaleString()}</td>
              <td style={td}>{s.modelVersion ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = { padding: '8px 12px', fontWeight: 600 };
const td: React.CSSProperties = { padding: '8px 12px' };

function badgeStyle(label: string | null): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '2px 8px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
  };
  if (label === 'High')   return { ...base, background: '#FCEBEB', color: '#A32D2D' };
  if (label === 'Medium') return { ...base, background: '#FAEEDA', color: '#854F0B' };
  if (label === 'Low')    return { ...base, background: '#E1F5EE', color: '#085041' };
  return { ...base, background: '#f0f0f0', color: '#888' };
}
