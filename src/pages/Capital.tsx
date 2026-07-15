import { useEffect, useState } from "react";

import { syncAppStateToCloud } from "../utils/cloudStorage";

import type { Car } from "../types";

import {
  getInvestorAllocatedCapital,
} from "../utils/finance";

type InvestorShare = 25 | 50;

type CapitalTransactionType = "Deposit" | "Return";

type BusinessType = "Local" | "Export";

type CapitalTransaction = {
  id: number;
  type: CapitalTransactionType;
  businessType: BusinessType;
  amount: string;
  date: string;
  notes: string;
};

type Investor = {
  id: number;
  name: string;
  profitShare: InvestorShare;
  transactions: CapitalTransaction[];
};

function getSavedCars(): Car[] {
  const savedCars = localStorage.getItem("cars");

  if (!savedCars) {
    return [];
  }

  try {
    const parsedCars = JSON.parse(savedCars);

    return Array.isArray(parsedCars)
      ? parsedCars.filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function getSavedInvestors(): Investor[] {
  const savedInvestors = localStorage.getItem("investors");

  if (!savedInvestors) {
    return [];
  }

  try {
    const parsedInvestors = JSON.parse(savedInvestors);

    return parsedInvestors.map((investor: Partial<Investor>) => ({
      id: investor.id || Date.now(),
      name: investor.name || "",
      profitShare: investor.profitShare === 50 ? 50 : 25,
      transactions: Array.isArray(investor.transactions)
        ? investor.transactions.map(
            (
              transaction: Partial<CapitalTransaction> & {
                businessType?: BusinessType;
              }
            ) => ({
              id: transaction.id || Date.now(),
              type:
                transaction.type === "Return"
                  ? "Return"
                  : "Deposit",
              businessType:
                transaction.businessType === "Export"
                  ? "Export"
                  : "Local",
              amount: transaction.amount || "",
              date: transaction.date || "",
              notes: transaction.notes || "",
            })
          )
        : [],
    }));
  } catch {
    return [];
  }
}

function formatYen(value: string | number) {
  const numberValue = Number(value) || 0;

  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(numberValue);
}

function formatDate(date: string) {
  if (!date) {
    return "No date";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString();
}

function getDeposits(
  investor: Investor,
  businessType?: BusinessType
) {
  return investor.transactions
    .filter((transaction) => {
      const matchesType = transaction.type === "Deposit";
      const matchesBusiness =
        !businessType ||
        transaction.businessType === businessType;

      return matchesType && matchesBusiness;
    })
    .reduce((total, transaction) => {
      return total + (Number(transaction.amount) || 0);
    }, 0);
}

function getReturns(
  investor: Investor,
  businessType?: BusinessType
) {
  return investor.transactions
    .filter((transaction) => {
      const matchesType = transaction.type === "Return";
      const matchesBusiness =
        !businessType ||
        transaction.businessType === businessType;

      return matchesType && matchesBusiness;
    })
    .reduce((total, transaction) => {
      return total + (Number(transaction.amount) || 0);
    }, 0);
}

function getAvailableCapital(
  investor: Investor,
  businessType?: BusinessType
) {
  return (
    getDeposits(investor, businessType) -
    getReturns(investor, businessType)
  );
}

function getRemainingCapital(
  investor: Investor,
  cars: Car[],
  businessType?: BusinessType
) {
  const totalCapital = getAvailableCapital(
    investor,
    businessType
  );

  const allocatedCapital =
    getInvestorAllocatedCapital(
      investor.id,
      cars,
      businessType
    );

  return totalCapital - allocatedCapital;
}

export default function Capital() {
  const [investors, setInvestors] =
    useState<Investor[]>(getSavedInvestors);

  const [cars] =
    useState<Car[]>(getSavedCars);

  const [investorName, setInvestorName] = useState("");

  const [profitShare, setProfitShare] =
    useState<InvestorShare>(25);

  const [editingInvestorId, setEditingInvestorId] =
    useState<number | null>(null);

  const [expandedInvestorId, setExpandedInvestorId] =
    useState<number | null>(null);

  const [transactionInvestorId, setTransactionInvestorId] =
    useState<number | null>(null);

  const [transactionType, setTransactionType] =
    useState<CapitalTransactionType>("Deposit");

  const [businessType, setBusinessType] =
    useState<BusinessType>("Local");

  const [transactionAmount, setTransactionAmount] =
    useState("");

  const [transactionDate, setTransactionDate] =
    useState("");

  const [transactionNotes, setTransactionNotes] =
    useState("");

  const [editingTransactionId, setEditingTransactionId] =
    useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem(
      "investors",
      JSON.stringify(investors)
    );
    void syncAppStateToCloud();
  }, [investors]);

  function saveInvestor() {
    if (!investorName.trim()) {
      alert("Please enter the investor's name.");
      return;
    }

    if (editingInvestorId !== null) {
      setInvestors(
        investors.map((investor) => {
          if (investor.id !== editingInvestorId) {
            return investor;
          }

          return {
            ...investor,
            name: investorName.trim(),
            profitShare,
          };
        })
      );
    } else {
      const newInvestor: Investor = {
        id: Date.now(),
        name: investorName.trim(),
        profitShare,
        transactions: [],
      };

      setInvestors([...investors, newInvestor]);
    }

    clearInvestorForm();
  }

  function startEditingInvestor(investor: Investor) {
    setInvestorName(investor.name);
    setProfitShare(investor.profitShare);
    setEditingInvestorId(investor.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function clearInvestorForm() {
    setInvestorName("");
    setProfitShare(25);
    setEditingInvestorId(null);
  }

  function deleteInvestor(investorId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this investor and all of their capital transactions?"
    );

    if (!confirmed) {
      return;
    }

    setInvestors(
      investors.filter(
        (investor) => investor.id !== investorId
      )
    );

    if (editingInvestorId === investorId) {
      clearInvestorForm();
    }

    if (expandedInvestorId === investorId) {
      setExpandedInvestorId(null);
    }

    if (transactionInvestorId === investorId) {
      closeTransactionForm();
    }
  }

  function toggleInvestorDetails(investorId: number) {
    setExpandedInvestorId(
      expandedInvestorId === investorId
        ? null
        : investorId
    );
  }

  function openTransactionForm(investorId: number) {
    if (transactionInvestorId === investorId) {
      closeTransactionForm();
      return;
    }

    setTransactionInvestorId(investorId);
    setExpandedInvestorId(investorId);
    clearTransactionFields();
  }

  function closeTransactionForm() {
    setTransactionInvestorId(null);
    clearTransactionFields();
  }

  function saveTransaction(investorId: number) {
    if (
      !transactionAmount ||
      Number(transactionAmount) <= 0
    ) {
      alert("Please enter a valid amount.");
      return;
    }

    if (!transactionDate) {
      alert("Please enter the transaction date.");
      return;
    }

    if (
      transactionType === "Return" &&
      editingTransactionId === null
    ) {
      const investor = investors.find(
        (item) => item.id === investorId
      );

      if (investor) {
        const available = getRemainingCapital(
          investor,
          cars,
          businessType
        );

        if (Number(transactionAmount) > available) {
          const confirmed = window.confirm(
            `This return is greater than the investor's available ${businessType.toLowerCase()} capital. Do you still want to continue?`
          );

          if (!confirmed) {
            return;
          }
        }
      }
    }

    if (editingTransactionId !== null) {
      setInvestors(
        investors.map((investor) => {
          if (investor.id !== investorId) {
            return investor;
          }

          return {
            ...investor,
            transactions: investor.transactions.map(
              (transaction) => {
                if (
                  transaction.id !== editingTransactionId
                ) {
                  return transaction;
                }

                return {
                  ...transaction,
                  type: transactionType,
                  businessType,
                  amount: transactionAmount,
                  date: transactionDate,
                  notes: transactionNotes.trim(),
                };
              }
            ),
          };
        })
      );
    } else {
      const newTransaction: CapitalTransaction = {
        id: Date.now(),
        type: transactionType,
        businessType,
        amount: transactionAmount,
        date: transactionDate,
        notes: transactionNotes.trim(),
      };

      setInvestors(
        investors.map((investor) => {
          if (investor.id !== investorId) {
            return investor;
          }

          return {
            ...investor,
            transactions: [
              ...investor.transactions,
              newTransaction,
            ],
          };
        })
      );
    }

    clearTransactionFields();
  }

  function startEditingTransaction(
    investorId: number,
    transaction: CapitalTransaction
  ) {
    setTransactionInvestorId(investorId);
    setTransactionType(transaction.type);
    setBusinessType(transaction.businessType);
    setTransactionAmount(transaction.amount);
    setTransactionDate(transaction.date);
    setTransactionNotes(transaction.notes);
    setEditingTransactionId(transaction.id);
  }

  function deleteTransaction(
    investorId: number,
    transactionId: number
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
      return;
    }

    setInvestors(
      investors.map((investor) => {
        if (investor.id !== investorId) {
          return investor;
        }

        return {
          ...investor,
          transactions: investor.transactions.filter(
            (transaction) =>
              transaction.id !== transactionId
          ),
        };
      })
    );

    if (editingTransactionId === transactionId) {
      clearTransactionFields();
    }
  }

  function clearTransactionFields() {
    setTransactionType("Deposit");
    setBusinessType("Local");
    setTransactionAmount("");
    setTransactionDate("");
    setTransactionNotes("");
    setEditingTransactionId(null);
  }

  const totalLocalDeposited = investors.reduce(
    (total, investor) =>
      total + getDeposits(investor, "Local"),
    0
  );

  const totalExportDeposited = investors.reduce(
    (total, investor) =>
      total + getDeposits(investor, "Export"),
    0
  );

  const totalLocalReturned = investors.reduce(
    (total, investor) =>
      total + getReturns(investor, "Local"),
    0
  );

  const totalExportReturned = investors.reduce(
    (total, investor) =>
      total + getReturns(investor, "Export"),
    0
  );

  const totalLocalCapital =
    totalLocalDeposited - totalLocalReturned;

  const totalExportCapital =
    totalExportDeposited - totalExportReturned;

  const totalLocalAllocated = investors.reduce(
    (total, investor) =>
      total +
      getInvestorAllocatedCapital(
        investor.id,
        cars,
        "Local"
      ),
    0
  );

  const totalExportAllocated = investors.reduce(
    (total, investor) =>
      total +
      getInvestorAllocatedCapital(
        investor.id,
        cars,
        "Export"
      ),
    0
  );

  const totalLocalAvailable = investors.reduce(
    (total, investor) =>
      total +
      getRemainingCapital(
        investor,
        cars,
        "Local"
      ),
    0
  );

  const totalExportAvailable = investors.reduce(
    (total, investor) =>
      total +
      getRemainingCapital(
        investor,
        cars,
        "Export"
      ),
    0
  );

  const totalCapital =
    totalLocalCapital + totalExportCapital;

  const totalAllocated =
    totalLocalAllocated + totalExportAllocated;

  const totalAvailable =
    totalLocalAvailable + totalExportAvailable;

  const inputStyle = {
    width: "100%",
    padding: 12,
    marginBottom: 14,
    boxSizing: "border-box" as const,
    border: "1px solid rgba(148, 163, 184, 0.35)",
    borderRadius: 12,
    fontSize: 15,
    background: "rgba(255,255,255,0.96)",
    color: "#0f172a",
  };

  const buttonStyle = {
    color: "white",
    border: "none",
    padding: "10px 14px",
    borderRadius: 999,
    cursor: "pointer",
    fontWeight: 600,
  };

  const summaryBoxStyle = {
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)",
    padding: 18,
    borderRadius: 16,
    minWidth: 220,
    flex: 1,
    boxShadow: "0 16px 35px -24px rgba(15, 23, 42, 0.26)",
    border: "1px solid rgba(148, 163, 184, 0.24)",
  };

  return (
    <div>
      <h1 style={{ marginBottom: 5, color: "#0f172a" }}>Capital</h1>

      <p style={{ color: "#6b7280", marginTop: 0 }}>
        Manage investor capital for local and export business
      </p>

      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)",
          padding: 22,
          borderRadius: 20,
          maxWidth: 760,
          marginTop: 20,
          boxShadow: "0 20px 50px -24px rgba(15, 23, 42, 0.28)",
          border: "1px solid rgba(148, 163, 184, 0.24)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          {editingInvestorId !== null
            ? "Edit Investor"
            : "Add Investor"}
        </h2>

        <input
          type="text"
          placeholder="Investor name"
          value={investorName}
          onChange={(event) =>
            setInvestorName(event.target.value)
          }
          style={inputStyle}
        />

        <label
          style={{
            display: "block",
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          Investor share of your half of the profit
        </label>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setProfitShare(25)}
            style={{
              border:
                profitShare === 25
                  ? "2px solid #2563eb"
                  : "1px solid #d1d5db",
              background:
                profitShare === 25 ? "#dbeafe" : "white",
              color:
                profitShare === 25
                  ? "#1e40af"
                  : "#374151",
              padding: "10px 18px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            25%
          </button>

          <button
            type="button"
            onClick={() => setProfitShare(50)}
            style={{
              border:
                profitShare === 50
                  ? "2px solid #7c3aed"
                  : "1px solid #d1d5db",
              background:
                profitShare === 50 ? "#ede9fe" : "white",
              color:
                profitShare === 50
                  ? "#5b21b6"
                  : "#374151",
              padding: "10px 18px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            50%
          </button>
        </div>

        <div
          style={{
            background: "rgba(248,250,252,0.95)",
            border: "1px solid rgba(148, 163, 184, 0.24)",
            borderRadius: 14,
            padding: 14,
            marginBottom: 18,
            color: "#4b5563",
          }}
        >
          The investor’s percentage is calculated from your
          half of the net profit. Your business partner receives
          50% of the net profit first.
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={saveInvestor}
            style={{
              ...buttonStyle,
              background:
                editingInvestorId !== null
                  ? "#2563eb"
                  : "#22c55e",
            }}
          >
            {editingInvestorId !== null
              ? "Save Investor Changes"
              : "Add Investor"}
          </button>

          {editingInvestorId !== null && (
            <button
              onClick={clearInvestorForm}
              style={{
                ...buttonStyle,
                background: "#6b7280",
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 25,
          flexWrap: "wrap",
        }}
      >
        <div style={summaryBoxStyle}>
          <div style={{ color: "#6b7280" }}>
            Local Remaining Capital
          </div>

          <div
            style={{
              fontSize: 27,
              fontWeight: 800,
              marginTop: 8,
              color:
                totalLocalAvailable >= 0
                  ? "#16a34a"
                  : "#dc2626",
            }}
          >
            {formatYen(totalLocalAvailable)}
          </div>
        </div>

        <div style={summaryBoxStyle}>
          <div style={{ color: "#6b7280" }}>
            Export Remaining Capital
          </div>

          <div
            style={{
              fontSize: 27,
              fontWeight: 800,
              marginTop: 8,
              color:
                totalExportAvailable >= 0
                  ? "#7c3aed"
                  : "#dc2626",
            }}
          >
            {formatYen(totalExportAvailable)}
          </div>
        </div>

        <div style={summaryBoxStyle}>
          <div style={{ color: "#6b7280" }}>
            Total Remaining Capital
          </div>

          <div
            style={{
              fontSize: 27,
              fontWeight: 800,
              marginTop: 8,
              color:
                totalAvailable >= 0
                  ? "#2563eb"
                  : "#dc2626",
            }}
          >
            {formatYen(totalAvailable)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={summaryBoxStyle}>
          <div style={{ color: "#6b7280" }}>
            Total Investor Capital
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginTop: 8,
              color: "#111827",
            }}
          >
            {formatYen(totalCapital)}
          </div>
        </div>

        <div style={summaryBoxStyle}>
          <div style={{ color: "#6b7280" }}>
            Capital Allocated to Cars
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginTop: 8,
              color: "#ea580c",
            }}
          >
            {formatYen(totalAllocated)}
          </div>
        </div>

        <div style={summaryBoxStyle}>
          <div style={{ color: "#6b7280" }}>
            Capital Remaining
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginTop: 8,
              color:
                totalAvailable >= 0
                  ? "#16a34a"
                  : "#dc2626",
            }}
          >
            {formatYen(totalAvailable)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={summaryBoxStyle}>
          <div style={{ color: "#6b7280" }}>
            Local Deposits
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginTop: 8,
            }}
          >
            {formatYen(totalLocalDeposited)}
          </div>

          <div
            style={{
              color: "#6b7280",
              marginTop: 5,
              fontSize: 14,
            }}
          >
            Returned: {formatYen(totalLocalReturned)}
          </div>
        </div>

        <div style={summaryBoxStyle}>
          <div style={{ color: "#6b7280" }}>
            Export Deposits
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginTop: 8,
            }}
          >
            {formatYen(totalExportDeposited)}
          </div>

          <div
            style={{
              color: "#6b7280",
              marginTop: 5,
              fontSize: 14,
            }}
          >
            Returned: {formatYen(totalExportReturned)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 30 }}>
        <h2>Investors</h2>

        {investors.length === 0 ? (
          <p>No investors have been added yet.</p>
        ) : (
          investors.map((investor) => {
            const localTotalCapital = getAvailableCapital(
              investor,
              "Local"
            );

            const localAllocated =
              getInvestorAllocatedCapital(
                investor.id,
                cars,
                "Local"
              );

            const localAvailable =
              localTotalCapital - localAllocated;

            const exportTotalCapital = getAvailableCapital(
              investor,
              "Export"
            );

            const exportAllocated =
              getInvestorAllocatedCapital(
                investor.id,
                cars,
                "Export"
              );

            const exportAvailable =
              exportTotalCapital - exportAllocated;

            const investorTotalAvailable =
              localAvailable + exportAvailable;

            const isExpanded =
              expandedInvestorId === investor.id;

            const sortedTransactions = [
              ...investor.transactions,
            ].sort((a, b) =>
              b.date.localeCompare(a.date)
            );

            return (
              <div
                key={investor.id}
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)",
                  borderRadius: 20,
                  marginBottom: 18,
                  boxShadow: "0 20px 50px -24px rgba(15, 23, 42, 0.28)",
                  border: "1px solid rgba(148, 163, 184, 0.24)",
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: 22 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          marginTop: 0,
                          marginBottom: 8,
                        }}
                      >
                        {investor.name}
                      </h2>

                      <span
                        style={{
                          display: "inline-block",
                          background: "#ede9fe",
                          color: "#5b21b6",
                          borderRadius: 20,
                          padding: "6px 11px",
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
                        {investor.profitShare}% of your
                        profit share
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() =>
                          toggleInvestorDetails(investor.id)
                        }
                        style={{
                          ...buttonStyle,
                          background: "#111827",
                        }}
                      >
                        {isExpanded
                          ? "Hide Details"
                          : "View Details"}
                      </button>

                      <button
                        onClick={() =>
                          startEditingInvestor(investor)
                        }
                        style={{
                          ...buttonStyle,
                          background: "#2563eb",
                        }}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          deleteInvestor(investor.id)
                        }
                        style={{
                          ...buttonStyle,
                          background: "#dc2626",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 14,
                      marginTop: 20,
                    }}
                  >
                    <div
                      style={{
                        background: "#eff6ff",
                        padding: 15,
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ color: "#6b7280" }}>
                        Local Remaining Capital
                      </div>

                      <strong
                        style={{
                          display: "block",
                          fontSize: 21,
                          marginTop: 5,
                          color:
                            localAvailable >= 0
                              ? "#2563eb"
                              : "#dc2626",
                        }}
                      >
                        {formatYen(localAvailable)}
                      </strong>

                      <div
                        style={{
                          color: "#6b7280",
                          marginTop: 5,
                          fontSize: 13,
                        }}
                      >
                        Total capital: {formatYen(localTotalCapital)}
                      </div>

                      <div
                        style={{
                          color: "#6b7280",
                          marginTop: 3,
                          fontSize: 13,
                        }}
                      >
                        Allocated: {formatYen(localAllocated)}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#f5f3ff",
                        padding: 15,
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ color: "#6b7280" }}>
                        Export Remaining Capital
                      </div>

                      <strong
                        style={{
                          display: "block",
                          fontSize: 21,
                          marginTop: 5,
                          color:
                            exportAvailable >= 0
                              ? "#7c3aed"
                              : "#dc2626",
                        }}
                      >
                        {formatYen(exportAvailable)}
                      </strong>

                      <div
                        style={{
                          color: "#6b7280",
                          marginTop: 5,
                          fontSize: 13,
                        }}
                      >
                        Total capital: {formatYen(exportTotalCapital)}
                      </div>

                      <div
                        style={{
                          color: "#6b7280",
                          marginTop: 3,
                          fontSize: 13,
                        }}
                      >
                        Allocated: {formatYen(exportAllocated)}
                      </div>
                    </div>

                    <div
                      style={{
                        background:
                          investorTotalAvailable >= 0
                            ? "#f0fdf4"
                            : "#fef2f2",
                        padding: 15,
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ color: "#6b7280" }}>
                        Total Remaining
                      </div>

                      <strong
                        style={{
                          display: "block",
                          fontSize: 21,
                          marginTop: 5,
                          color:
                            investorTotalAvailable >= 0
                              ? "#16a34a"
                              : "#dc2626",
                        }}
                      >
                        {formatYen(investorTotalAvailable)}
                      </strong>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      padding: 22,
                      background:
                        "linear-gradient(180deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.92) 100%)",
                      borderTop: "1px solid rgba(148, 163, 184, 0.22)",
                    }}
                  >
                    <button
                      onClick={() =>
                        openTransactionForm(investor.id)
                      }
                      style={{
                        ...buttonStyle,
                        background: "#7c3aed",
                        marginBottom: 18,
                      }}
                    >
                      {transactionInvestorId === investor.id
                        ? "Close Transaction Form"
                        : "Add Capital Transaction"}
                    </button>

                    {transactionInvestorId ===
                      investor.id && (
                      <div
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)",
                          border:
                            "1px solid rgba(148, 163, 184, 0.24)",
                          borderRadius: 16,
                          padding: 18,
                          marginBottom: 20,
                        }}
                      >
                        <h3 style={{ marginTop: 0 }}>
                          {editingTransactionId !== null
                            ? "Edit Transaction"
                            : "Add Transaction"}
                        </h3>

                        <label
                          style={{
                            display: "block",
                            marginBottom: 8,
                            fontWeight: 600,
                          }}
                        >
                          Transaction type
                        </label>

                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            marginBottom: 16,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setTransactionType("Deposit")
                            }
                            style={{
                              border:
                                transactionType === "Deposit"
                                  ? "2px solid #16a34a"
                                  : "1px solid #d1d5db",
                              background:
                                transactionType === "Deposit"
                                  ? "#dcfce7"
                                  : "white",
                              color:
                                transactionType === "Deposit"
                                  ? "#166534"
                                  : "#374151",
                              padding: "10px 16px",
                              borderRadius: 8,
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            Deposit Received
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setTransactionType("Return")
                            }
                            style={{
                              border:
                                transactionType === "Return"
                                  ? "2px solid #ea580c"
                                  : "1px solid #d1d5db",
                              background:
                                transactionType === "Return"
                                  ? "#ffedd5"
                                  : "white",
                              color:
                                transactionType === "Return"
                                  ? "#9a3412"
                                  : "#374151",
                              padding: "10px 16px",
                              borderRadius: 8,
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            Capital Returned
                          </button>
                        </div>

                        <label
                          style={{
                            display: "block",
                            marginBottom: 8,
                            fontWeight: 600,
                          }}
                        >
                          Business type
                        </label>

                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            marginBottom: 16,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setBusinessType("Local")
                            }
                            style={{
                              border:
                                businessType === "Local"
                                  ? "2px solid #2563eb"
                                  : "1px solid #d1d5db",
                              background:
                                businessType === "Local"
                                  ? "#dbeafe"
                                  : "white",
                              color:
                                businessType === "Local"
                                  ? "#1e40af"
                                  : "#374151",
                              padding: "10px 18px",
                              borderRadius: 8,
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            Local Business
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setBusinessType("Export")
                            }
                            style={{
                              border:
                                businessType === "Export"
                                  ? "2px solid #7c3aed"
                                  : "1px solid #d1d5db",
                              background:
                                businessType === "Export"
                                  ? "#ede9fe"
                                  : "white",
                              color:
                                businessType === "Export"
                                  ? "#5b21b6"
                                  : "#374151",
                              padding: "10px 18px",
                              borderRadius: 8,
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            Export Business
                          </button>
                        </div>

                        <input
                          type="number"
                          placeholder="Amount in Japanese yen"
                          value={transactionAmount}
                          onChange={(event) =>
                            setTransactionAmount(
                              event.target.value
                            )
                          }
                          style={inputStyle}
                        />

                        <label
                          style={{
                            display: "block",
                            marginBottom: 7,
                            fontWeight: 600,
                          }}
                        >
                          Transaction date
                        </label>

                        <input
                          type="date"
                          value={transactionDate}
                          onChange={(event) =>
                            setTransactionDate(
                              event.target.value
                            )
                          }
                          style={inputStyle}
                        />

                        <textarea
                          placeholder="Notes, optional"
                          value={transactionNotes}
                          onChange={(event) =>
                            setTransactionNotes(
                              event.target.value
                            )
                          }
                          rows={3}
                          style={{
                            ...inputStyle,
                            resize: "vertical",
                          }}
                        />

                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            onClick={() =>
                              saveTransaction(investor.id)
                            }
                            style={{
                              ...buttonStyle,
                              background:
                                editingTransactionId !== null
                                  ? "#2563eb"
                                  : "#22c55e",
                            }}
                          >
                            {editingTransactionId !== null
                              ? "Save Transaction Changes"
                              : "Add Transaction"}
                          </button>

                          {editingTransactionId !== null && (
                            <button
                              onClick={clearTransactionFields}
                              style={{
                                ...buttonStyle,
                                background: "#6b7280",
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <h3>Capital History</h3>

                    {sortedTransactions.length === 0 ? (
                      <p>
                        No capital transactions have been
                        recorded.
                      </p>
                    ) : (
                      sortedTransactions.map(
                        (transaction) => (
                          <div
                            key={transaction.id}
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              alignItems: "center",
                              gap: 15,
                              padding: 14,
                              marginBottom: 9,
                              background:
                                "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)",
                              border:
                                "1px solid rgba(148, 163, 184, 0.24)",
                              borderRadius: 14,
                              flexWrap: "wrap",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                }}
                              >
                                <strong>
                                  {transaction.type ===
                                  "Deposit"
                                    ? "Deposit Received"
                                    : "Capital Returned"}
                                </strong>

                                <span
                                  style={{
                                    background:
                                      transaction.businessType ===
                                      "Local"
                                        ? "#dbeafe"
                                        : "#ede9fe",
                                    color:
                                      transaction.businessType ===
                                      "Local"
                                        ? "#1e40af"
                                        : "#5b21b6",
                                    borderRadius: 20,
                                    padding: "4px 9px",
                                    fontSize: 13,
                                    fontWeight: 700,
                                  }}
                                >
                                  {transaction.businessType}
                                </span>
                              </div>

                              <div
                                style={{
                                  marginTop: 5,
                                  fontWeight: 700,
                                  color:
                                    transaction.type ===
                                    "Deposit"
                                      ? "#16a34a"
                                      : "#ea580c",
                                }}
                              >
                                {transaction.type ===
                                "Deposit"
                                  ? "+"
                                  : "-"}
                                {formatYen(
                                  transaction.amount
                                )}
                              </div>

                              <div
                                style={{
                                  color: "#6b7280",
                                  marginTop: 4,
                                  fontSize: 14,
                                }}
                              >
                                {formatDate(
                                  transaction.date
                                )}
                              </div>

                              {transaction.notes && (
                                <div
                                  style={{
                                    color: "#4b5563",
                                    marginTop: 5,
                                  }}
                                >
                                  {transaction.notes}
                                </div>
                              )}
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                              }}
                            >
                              <button
                                onClick={() =>
                                  startEditingTransaction(
                                    investor.id,
                                    transaction
                                  )
                                }
                                style={{
                                  ...buttonStyle,
                                  background: "#2563eb",
                                  padding: "7px 11px",
                                }}
                              >
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  deleteTransaction(
                                    investor.id,
                                    transaction.id
                                  )
                                }
                                style={{
                                  ...buttonStyle,
                                  background: "#dc2626",
                                  padding: "7px 11px",
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}