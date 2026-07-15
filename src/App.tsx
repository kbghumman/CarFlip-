import { useState } from "react";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Cars from "./pages/Cars";
import Expenses from "./pages/Expenses";
import Capital from "./pages/Capital";
import Customers from "./pages/Customers";

export default function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div className="cf-app">
      <Navbar currentPage={page} onChangePage={setPage} />

      <main className="cf-main">
        <div className="cf-content">
          {page === "dashboard" && <Dashboard />}

          {page === "cars" && <Cars />}

          {page === "expenses" && <Expenses />}

          {page === "capital" && <Capital />}

          {page === "customers" && <Customers />}

          {page === "reports" && (
            <div className="cf-empty">
              <h2 style={{ marginBottom: 8 }}>Reports</h2>
              <p>Reporting and exports are coming soon.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
