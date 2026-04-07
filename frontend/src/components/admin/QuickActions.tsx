// src/components/admin/QuickActions.tsx

const ACTIONS = [
  {
    label: 'Add New Resident',
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    label: 'Log Process Recording',
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" /><path d="M10 8l6 4-6 4V8z" />
      </svg>
    ),
  },
  {
    label: 'Record Donation',
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: 'Schedule Home Visit',
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

export default function QuickActions() {
  return (
    <div className="admin-card">
      <h4>Quick Actions</h4>
      {ACTIONS.map((a) => (
        <button className="qa-btn" key={a.label}>
          {a.icon}
          {a.label}
        </button>
      ))}
    </div>
  );
}
