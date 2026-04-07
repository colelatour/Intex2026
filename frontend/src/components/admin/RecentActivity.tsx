// src/components/admin/RecentActivity.tsx

const ACTIVITIES = [
  { dot: 'dot-blue',   text: 'Process recording added for #RES-003', time: '2 hours ago' },
  { dot: 'dot-gold',   text: 'New donation logged — $500',            time: '4 hours ago' },
  { dot: 'dot-orange', text: 'Home visit scheduled — House B',        time: 'Yesterday'   },
  { dot: 'dot-gray',   text: 'New resident admitted — #RES-036',      time: 'Yesterday'   },
];

export default function RecentActivity() {
  return (
    <div className="admin-card">
      <h4>Recent Activity</h4>
      {ACTIVITIES.map((a, i) => (
        <div className="activity-item" key={i}>
          <div className={`activity-dot ${a.dot}`} />
          <div>
            <div className="activity-text">{a.text}</div>
            <div className="activity-time">{a.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
