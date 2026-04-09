// src/components/admin/AdminSidebar.tsx
import { type ReactNode, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getSession } from '../../lib/authApi';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
    ],
  },
  {
    label: 'Residents',
    items: [
      { id: 'resident-directory', label: 'Resident Directory',  icon: 'users'     },
      { id: 'process-recordings', label: 'Process Recordings',  icon: 'clipboard' },
      { id: 'home-visits',        label: 'Visits & Conferences', icon: 'house'    },
      { id: 'referrals',          label: 'Referrals',           icon: 'referral'  },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'safehouse-management', label: 'Safehouse Management', icon: 'home'  },
      { id: 'donors',               label: 'Donor Dashboard',      icon: 'heart' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { id: 'user-management', label: 'User Management', icon: 'user', adminOnly: true },
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
  referral: (
    <svg className="sidebar__icon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
};

export default function AdminSidebar() {
  const [isAdmin, setIsAdmin]       = useState(false);
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    getSession().then(s => setIsAdmin(s.roles.includes('Admin')));
  }, []);

  // Close drawer on route change on mobile
  const handleNavClick = () => setMobileOpen(false);

  const desktopNav = NAV_SECTIONS.map((section) => (
    <div key={section.label}>
      {!collapsed && <div className="sidebar__section-label">{section.label}</div>}
      {section.items
        .filter(item => !item.adminOnly || isAdmin)
        .map((item) => (
          <NavLink
            key={item.id}
            to={`/admin/${item.id}`}
            className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
            title={collapsed ? item.label : undefined}
            onClick={handleNavClick}
          >
            {ICONS[item.icon]}
            {!collapsed && item.label}
          </NavLink>
        ))}
    </div>
  ));

  const mobileNav = NAV_SECTIONS.map((section) => (
    <div key={section.label}>
      <div className="sidebar__section-label">{section.label}</div>
      {section.items
        .filter(item => !item.adminOnly || isAdmin)
        .map((item) => (
          <NavLink
            key={item.id}
            to={`/admin/${item.id}`}
            className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
            onClick={handleNavClick}
          >
            {ICONS[item.icon]}
            {item.label}
          </NavLink>
        ))}
    </div>
  ));

  return (
    <>
      <div className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
        <div className="sidebar__brand">
          {!collapsed && <span>Sheltered Light Admin Portal</span>}
          {/* Desktop collapse toggle */}
          <button
            className="sidebar__collapse-btn sidebar__collapse-btn--desktop"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
              {collapsed
                ? <path d="M9 18l6-6-6-6"/>
                : <path d="M15 18l-6-6 6-6"/>}
            </svg>
          </button>
          {/* Mobile hamburger toggle */}
          <button
            className="sidebar__collapse-btn sidebar__collapse-btn--mobile"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20" height="20">
              {mobileOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
        </div>

        {/* Desktop nav — always visible in sidebar */}
        <div className="sidebar__nav--desktop">
          {desktopNav}
        </div>
      </div>

      {/* Mobile drawer — outside sidebar so fixed positioning works correctly */}
      <div className={`sidebar__nav${mobileOpen ? ' sidebar__nav--open' : ''}`}>
        {mobileNav}
      </div>

      {/* Mobile backdrop */}
      <div
        className={`sidebar__overlay${mobileOpen ? ' sidebar__overlay--visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />
    </>
  );
}
