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
        background: "#111827",
        color: "white",
        padding: "18px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
      }}
    >
      <h2 style={{ margin: 0 }}>
        🚗 Car Flip HQ
      </h2>

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
                  ? "#22c55e"
                  : "transparent",
              color: "white",
              border: "none",
              padding: "10px 14px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {page.label}
          </button>
        ))}
      </div>
    </nav>
  );
}