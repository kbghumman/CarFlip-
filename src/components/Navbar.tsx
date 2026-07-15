type NavbarProps = {
  currentPage: string;
  onChangePage: (page: string) => void;
};

export default function Navbar({
  currentPage,
  onChangePage,
}: NavbarProps) {
  const pages = [
    {
      id: "dashboard",
      label: "Dashboard",
    },
    {
      id: "cars",
      label: "Inventory",
    },
    {
      id: "expenses",
      label: "Expenses",
    },
    {
      id: "capital",
      label: "Capital",
    },
    {
      id: "customers",
      label: "Customers",
    },
    {
      id: "reports",
      label: "Reports",
    },
  ];

  return (
    <nav
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #111827 48%, #1d4ed8 100%)",
        color: "white",
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 18,
        flexWrap: "wrap",
        borderRadius: 24,
        boxShadow: "0 24px 70px -30px rgba(15, 23, 42, 0.55)",
      }}
    >
      <div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.16)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          <span>🚗</span>
          Car Flip HQ
        </div>
        <h2 style={{ margin: 0, fontSize: 24 }}>
          Operations command center
        </h2>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {pages.map((page) => (
          <button
            key={page.id}
            type="button"
            onClick={() =>
              onChangePage(page.id)
            }
            style={{
              background:
                currentPage === page.id
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.08)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.16)",
              padding: "10px 14px",
              borderRadius: 999,
              cursor: "pointer",
              fontWeight: 600,
              backdropFilter: "blur(8px)",
            }}
          >
            {page.label}
          </button>
        ))}
      </div>
    </nav>
  );
}