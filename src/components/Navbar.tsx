import type { ReactNode } from "react";

type NavbarProps = {
  currentPage: string;
  onChangePage: (page: string) => void;
};

type NavItem = {
  id: string;
  label: string;
  icon: ReactNode;
};

const icon = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  cars: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13" />
      <path d="M4 17h16v-3.5a1.5 1.5 0 0 0-1.5-1.5h-13A1.5 1.5 0 0 0 4 13.5z" />
      <circle cx="7.5" cy="17" r="1.5" />
      <circle cx="16.5" cy="17" r="1.5" />
    </svg>
  ),
  expenses: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  ),
  capital: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.4-1.1 1.9-2.5 2.5s-2.5 1.1-2.5 2.5a2.5 2.5 0 0 0 5 0" />
    </svg>
  ),
  customers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 8.2a3 3 0 0 1 0 5.6M18 19a5.5 5.5 0 0 0-3-4.9" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20V4M20 20H4" />
      <rect x="7" y="11" width="3" height="6" rx="0.5" />
      <rect x="12" y="7" width="3" height="10" rx="0.5" />
      <rect x="17" y="13" width="3" height="4" rx="0.5" />
    </svg>
  ),
};

export default function Navbar({
  currentPage,
  onChangePage,
}: NavbarProps) {
  const pages: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: icon.dashboard },
    { id: "cars", label: "Inventory", icon: icon.cars },
    { id: "expenses", label: "Expenses", icon: icon.expenses },
    { id: "capital", label: "Capital", icon: icon.capital },
    { id: "customers", label: "Customers", icon: icon.customers },
    { id: "reports", label: "Reports", icon: icon.reports },
  ];

  return (
    <nav className="cf-sidebar" aria-label="Main navigation">
      <div className="cf-brand">
        <span className="cf-brand-mark" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13" />
            <path d="M4 17h16v-3.5a1.5 1.5 0 0 0-1.5-1.5h-13A1.5 1.5 0 0 0 4 13.5z" />
            <circle cx="7.5" cy="17" r="1.3" />
            <circle cx="16.5" cy="17" r="1.3" />
          </svg>
        </span>

        <div>
          <div className="cf-brand-name">CarFlip</div>
          <div className="cf-brand-sub">Trading HQ</div>
        </div>
      </div>

      <div className="cf-nav">
        <span className="cf-nav-label">Workspace</span>

        {pages.map((page) => (
          <button
            key={page.id}
            type="button"
            className="cf-nav-item"
            aria-current={currentPage === page.id}
            onClick={() => onChangePage(page.id)}
          >
            {page.icon}
            {page.label}
          </button>
        ))}
      </div>

      <div className="cf-sidebar-foot">
        Vehicle import &amp; export management
      </div>
    </nav>
  );
}
