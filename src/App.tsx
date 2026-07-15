import { useState } from "react";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Cars from "./pages/Cars";
import Expenses from "./pages/Expenses";
import Capital from "./pages/Capital";
import Customers from "./pages/Customers";

export default function App() {
  const [page, setPage] =
    useState("dashboard");

  return (
    <div>
      <Navbar
        currentPage={page}
        onChangePage={setPage}
      />

      <div
        style={{
          padding: 30,
          maxWidth: 1300,
          margin: "0 auto",
        }}
      >
        {page === "dashboard" && (
          <Dashboard />
        )}

        {page === "cars" && <Cars />}

        {page === "expenses" && (
          <Expenses />
        )}

        {page === "capital" && (
          <Capital />
        )}

        {page === "customers" && (
          <Customers />
        )}

        {page === "reports" && (
          <h1>Reports — Coming Soon</h1>
        )}
      </div>
    </div>
  );
}