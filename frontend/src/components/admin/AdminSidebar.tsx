// src/components/admin/AdminSidebar.tsx
import { type ReactNode, useEffect, useState } from 'react';
import { getSession } from '../../lib/authApi';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard',          label: 'Dashboard',          icon: 'grid'      },
      { id: 'resident-directory', label: 'Resident Directory', icon: 'users'     },
      { id: 'donors',             label: 'Donor Dashboard',    icon: 'heart'     },
      { id: 'process-recordings', label: 'Process Recordings', icon: 'clipboard' },
      { id: 'user-management',    label: 'User Management',    icon: 'user',  adminOnly: true },
    ],
  },
];

const ICONS: Record<string, ReactNode> = {
  grid: (
    <svg className="sidebar__icon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  users: (
    <svg className="sidebar__icon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  play: (
    <svg className="sidebar__icon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4V8z"/>
    </svg>
  ),
  home: (
    <svg className="sidebar__icon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  heart: (
    <svg className="sidebar__icon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  dollar: (
    <svg className="sidebar__icon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  clipboard: (
    <svg className="sidebar__icon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  ),
  chart: (
    <svg className="sidebar__icon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  twitter: (
    <svg className="sidebar__icon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
    </svg>
  ),
  user: (
    <svg className="sidebar__icon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  house: (
    <svg className="sidebar__icon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
};

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
}

export default function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getSession().then(s => setIsAdmin(s.roles.includes('Admin')));
  }, []);

  return (
    <div className="sidebar">
      <div className="sidebar__brand">
        Sheltered Light <span>Admin Portal</span>
      </div>

      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          <div className="sidebar__section-label">{section.label}</div>
          {section.items
            .filter(item => !item.adminOnly || isAdmin)
            .map((item) => (
            <button
              key={item.id}
              className={`sidebar__link${activeSection === item.id ? ' active' : ''}`}
              onClick={() => onSectionChange(item.id)}
            >
              {ICONS[item.icon]}
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
