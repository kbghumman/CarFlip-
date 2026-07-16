import {
  useEffect,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import type {
  Session,
} from "@supabase/supabase-js";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Cars from "./pages/Cars";
import Expenses from "./pages/Expenses";
import Capital from "./pages/Capital";
import Customers from "./pages/Customers";

import { supabase } from "./utils/supabase";

import {
  clearCloudSessionCache,
  getSyncStatus,
  hydrateAppStateFromCloud,
  subscribeToSyncStatus,
} from "./utils/cloudStorage";

import type { SyncStatus } from "./utils/cloudStorage";

export default function App() {
  const [page, setPage] =
    useState("dashboard");

  const [session, setSession] =
    useState<Session | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [cloudLoading, setCloudLoading] =
    useState(false);

  const [cloudError, setCloudError] =
    useState("");

  const [syncStatus, setSyncStatus] =
    useState<SyncStatus>(() => getSyncStatus());

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loginLoading, setLoginLoading] =
    useState(false);

  const [loginError, setLoginError] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    async function prepareSession(
      nextSession: Session | null
    ) {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setCloudError("");

      if (!nextSession) {
        setCloudLoading(false);
        setAuthLoading(false);
        return;
      }

      setCloudLoading(true);

      try {
        await hydrateAppStateFromCloud();
      } catch (error) {
        console.error(
          "Could not load cloud data:",
          error
        );

        setCloudError(
          "Your cloud data could not be loaded. The app is using the local copy on this device."
        );
      } finally {
        if (isMounted) {
          setCloudLoading(false);
          setAuthLoading(false);
        }
      }
    }

    async function loadSession() {
      const {
        data,
        error,
      } =
        await supabase.auth.getSession();

      if (error) {
        console.error(
          "Could not load Supabase session:",
          error
        );
      }

      await prepareSession(
        data.session ?? null
      );
    }

    void loadSession();

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          void prepareSession(newSession);
        }
      );

    return () => {
      isMounted = false;

      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    return subscribeToSyncStatus(setSyncStatus);
  }, []);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoginError("");

    if (
      !email.trim() ||
      !password
    ) {
      setLoginError(
        "Please enter your email and password."
      );

      return;
    }

    setLoginLoading(true);

    const {
      error,
    } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (error) {
      setLoginError(error.message);
      setLoginLoading(false);
      return;
    }

    setPassword("");
    setLoginLoading(false);
  }

  async function handleSignOut() {
    const confirmed =
      window.confirm(
        "Are you sure you want to sign out?"
      );

    if (!confirmed) {
      return;
    }

    const {
      error,
    } =
      await supabase.auth.signOut();

    if (error) {
      alert(
        `Could not sign out: ${error.message}`
      );

      return;
    }

    await clearCloudSessionCache();

    setPage("dashboard");
    setSession(null);
  }

  if (authLoading || cloudLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 34%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
          padding: 24,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            background:
              "rgba(255,255,255,0.94)",
            border:
              "1px solid rgba(15,23,42,0.08)",
            borderRadius: 24,
            padding: "28px 34px",
            boxShadow:
              "0 24px 80px -30px rgba(15,23,42,0.35)",
            color: "#334155",
            fontWeight: 700,
          }}
        >
          {cloudLoading
            ? "Loading your cloud data..."
            : "Loading WildSpeed MotorsOS..."}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top left, rgba(37, 99, 235, 0.2), transparent 34%), radial-gradient(circle at bottom right, rgba(124, 58, 237, 0.16), transparent 32%), linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)",
          padding: 20,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 460,
            background:
              "rgba(255,255,255,0.96)",
            border:
              "1px solid rgba(15,23,42,0.08)",
            borderRadius: 28,
            boxShadow:
              "0 28px 90px -32px rgba(15,23,42,0.45)",
            padding: "34px 30px",
            backdropFilter: "blur(18px)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "7px 11px",
              borderRadius: 999,
              background:
                "rgba(37,99,235,0.12)",
              color: "#2563eb",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Secure access
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 32,
              lineHeight: 1.15,
              color: "#0f172a",
            }}
          >
            WildSpeed MotorsOS
          </h1>

          <p
            style={{
              color: "#64748b",
              marginTop: 10,
              marginBottom: 26,
              lineHeight: 1.6,
            }}
          >
            Sign in to access your vehicle,
            customer, investor and financial
            records.
          </p>

          <form onSubmit={handleLogin}>
            <div
              style={{
                marginBottom: 16,
              }}
            >
              <label
                htmlFor="login-email"
                style={{
                  display: "block",
                  marginBottom: 7,
                  color: "#334155",
                  fontWeight: 700,
                }}
              >
                Email
              </label>

              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: 12,
                  padding: "13px 14px",
                  fontSize: 16,
                  outline: "none",
                  background: "#ffffff",
                }}
              />
            </div>

            <div
              style={{
                marginBottom: 18,
              }}
            >
              <label
                htmlFor="login-password"
                style={{
                  display: "block",
                  marginBottom: 7,
                  color: "#334155",
                  fontWeight: 700,
                }}
              >
                Password
              </label>

              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: 12,
                  padding: "13px 14px",
                  fontSize: 16,
                  outline: "none",
                  background: "#ffffff",
                }}
              />
            </div>

            {loginError && (
              <div
                style={{
                  background: "#fef2f2",
                  border:
                    "1px solid #fecaca",
                  color: "#991b1b",
                  borderRadius: 11,
                  padding: 12,
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}
              >
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 12,
                padding: "13px 16px",
                background:
                  loginLoading
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                color: "white",
                cursor:
                  loginLoading
                    ? "not-allowed"
                    : "pointer",
                fontWeight: 800,
                fontSize: 16,
                boxShadow:
                  loginLoading
                    ? "none"
                    : "0 12px 28px -12px rgba(37,99,235,0.65)",
              }}
            >
              {loginLoading
                ? "Signing in..."
                : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

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
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              color: "#64748b",
              fontSize: 14,
            }}
          >
            Signed in as{" "}
            <strong
              style={{
                color: "#334155",
              }}
            >
              {session.user.email}
            </strong>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div
              aria-live="polite"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 999,
                padding: "9px 13px",
                border:
                  syncStatus === "saved"
                    ? "1px solid #bbf7d0"
                    : syncStatus === "saving"
                      ? "1px solid #fde68a"
                      : "1px solid #fecaca",
                background:
                  syncStatus === "saved"
                    ? "#f0fdf4"
                    : syncStatus === "saving"
                      ? "#fffbeb"
                      : "#fef2f2",
                color:
                  syncStatus === "saved"
                    ? "#166534"
                    : syncStatus === "saving"
                      ? "#92400e"
                      : "#991b1b",
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background:
                    syncStatus === "saved"
                      ? "#22c55e"
                      : syncStatus === "saving"
                        ? "#f59e0b"
                        : "#ef4444",
                }}
              />

              {syncStatus === "saved"
                ? "All changes saved"
                : syncStatus === "saving"
                  ? "Saving changes..."
                  : syncStatus === "offline"
                    ? "Offline — changes pending"
                    : "Save failed — will retry"}
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              style={{
                border:
                  "1px solid rgba(148,163,184,0.45)",
                borderRadius: 10,
                padding: "9px 13px",
                background:
                  "rgba(255,255,255,0.82)",
                color: "#334155",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {cloudError && (
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#9a3412",
              borderRadius: 12,
              padding: 13,
            }}
          >
            {cloudError}
          </div>
        )}

        <Navbar
          currentPage={page}
          onChangePage={setPage}
        />

        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.95) 100%)",
            border:
              "1px solid rgba(15, 23, 42, 0.08)",
            borderRadius: 28,
            boxShadow:
              "0 24px 80px -30px rgba(15, 23, 42, 0.35)",
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
                  background:
                    "rgba(248,250,252,0.92)",
                  border:
                    "1px solid rgba(148, 163, 184, 0.28)",
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
                    background:
                      "rgba(37, 99, 235, 0.14)",
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

                <h1
                  style={{
                    margin: 0,
                    fontSize: 30,
                  }}
                >
                  Reports — Coming Soon
                </h1>

                <p
                  style={{
                    color: "#64748b",
                    marginTop: 10,
                  }}
                >
                  Advanced reporting views and
                  export-ready summaries will
                  appear here soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}