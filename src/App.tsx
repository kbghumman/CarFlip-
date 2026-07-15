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
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 32%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
        padding: "24px 20px 40px",
      }}
    >
      <div
        style={{
          maxWidth: 1380,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <Navbar
          currentPage={page}
          onChangePage={setPage}
        />

        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.95) 100%)",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            borderRadius: 28,
            boxShadow: "0 24px 80px -30px rgba(15, 23, 42, 0.35)",
            padding: "28px 24px 32px",
            backdropFilter: "blur(18px)",
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
            <div
              style={{
                minHeight: 320,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  background: "rgba(248,250,252,0.92)",
                  border: "1px solid rgba(148, 163, 184, 0.28)",
                  borderRadius: 24,
                  padding: "36px 42px",
                  maxWidth: 600,
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(37, 99, 235, 0.14)",
                    color: "#2563eb",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 14,
                  }}
                >
                  Report hub
                </div>

                <h1 style={{ margin: 0, fontSize: 30 }}>
                  Reports — Coming Soon
                </h1>

                <p style={{ color: "#64748b", marginTop: 10 }}>
                  Advanced reporting views and export-ready summaries will appear here soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}