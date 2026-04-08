// src/components/admin/RecentActivity.tsx
import type { ActivityItem } from '../../types/AdminDashboard';

const DOT_MAP: Record<string, string> = {
  ProcessRecordingAdded: 'dot-blue',
  DonationRecorded:      'dot-gold',
  HomeVisitScheduled:    'dot-orange',
  ResidentCreated:       'dot-gray',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

interface Props {
  items: ActivityItem[];
  loading?: boolean;
}

export default function RecentActivity({ items, loading }: Props) {
  return (
    <div className="admin-card dashboard-card dashboard-card--activity">
      <h4>Recent Activity</h4>
      {loading ? (
        <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>Loading…</p>
      ) : items.length === 0 ? (
        <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>No recent activity.</p>
      ) : (
        items.map((a, i) => (
          <div className="activity-item" key={i}>
            <div className={`activity-dot ${DOT_MAP[a.type] ?? 'dot-gray'}`} />
            <div>
              <div className="activity-text">{a.text}</div>
              <div className="activity-time">{timeAgo(a.timestamp)}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
