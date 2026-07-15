import { useState } from "react";

import type {
  Car,
  Investor,
} from "../../types";

import {
  findInvestor,
  formatYen,
  getExpenseTotal,
  getNetProfit,
  getTotalCost,
} from "../../utils/finance";

import VehicleProfitSummary from "./VehicleProfitSummary";

type CarCardProps = {
  car: Car;
  investors: Investor[];
  onEdit: (car: Car) => void;
  onDelete: (carId: number) => void;
  onManageExpenses: (car: Car) => void;
  onCloseInvestment: (carId: number) => void;
};

function formatDate(date: string) {
  if (!date) {
    return "Not entered";
  }

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString();
}

function getStatusColors(status: Car["status"]) {
  if (status === "Sold") {
    return {
      background: "#dcfce7",
      color: "#166534",
      dot: "#16a34a",
    };
  }

  if (status === "Shipping") {
    return {
      background: "#ffedd5",
      color: "#9a3412",
      dot: "#ea580c",
    };
  }

  if (status === "Reserved") {
    return {
      background: "#fef3c7",
      color: "#92400e",
      dot: "#ca8a04",
    };
  }

  return {
    background: "#dbeafe",
    color: "#1e40af",
    dot: "#2563eb",
  };
}

function getFundingColors(
  fundingStatus: Car["fundingStatus"]
) {
  if (fundingStatus === "Closed") {
    return {
      background: "#dcfce7",
      color: "#166534",
    };
  }

  if (fundingStatus === "Allocated") {
    return {
      background: "#ede9fe",
      color: "#5b21b6",
    };
  }

  return {
    background: "#f3f4f6",
    color: "#4b5563",
  };
}

export default function CarCard({
  car,
  investors,
  onEdit,
  onDelete,
  onManageExpenses,
  onCloseInvestment,
}: CarCardProps) {
  const [showDetails, setShowDetails] =
    useState(false);

  const investor = findInvestor(
    car,
    investors
  );

  const expenseTotal =
    getExpenseTotal(car);

  const totalCost =
    getTotalCost(car);

  const netProfit =
    getNetProfit(car);

  const hasSale =
    Boolean(car.saleDate) &&
    Number(car.salePrice) > 0;

  const roi =
    hasSale && totalCost > 0
      ? (netProfit / totalCost) * 100
      : 0;

  const statusColors =
    getStatusColors(car.status);

  const fundingColors =
    getFundingColors(
      car.fundingStatus
    );

  const buttonStyle = {
    color: "white",
    border: "none",
    padding: "9px 13px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
  };

  const summaryBoxStyle = {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 15,
  };

  const smallLabelStyle = {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
    marginBottom: 7,
  };

  function handleDelete() {
    const confirmed = window.confirm(
      `Delete ${car.year} ${car.make} ${car.model} and all of its expenses?`
    );

    if (!confirmed) {
      return;
    }

    onDelete(car.id);
  }

  function handleCloseInvestment() {
    if (car.investorId === null) {
      alert(
        "This vehicle does not have an investor."
      );
      return;
    }

    if (!hasSale) {
      alert(
        "Enter the sale price and sale date before closing the investment."
      );
      return;
    }

    const confirmed = window.confirm(
      "Close this investment and release the allocated investor capital?"
    );

    if (!confirmed) {
      return;
    }

    onCloseInvestment(car.id);
  }

  return (
    <article
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 15,
        marginBottom: 20,
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: 22 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 240,
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: 10,
              }}
            >
              {car.year} {car.make} {car.model}
            </h2>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  background: statusColors.background,
                  color: statusColors.color,
                  borderRadius: 20,
                  padding: "6px 11px",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: statusColors.dot,
                  }}
                />

                {car.status}
              </span>

              <span
                style={{
                  background: "#f3f4f6",
                  color: "#374151",
                  borderRadius: 20,
                  padding: "6px 11px",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {car.saleType === "Local"
                  ? "Local Trading"
                  : car.saleType === "Export"
                    ? "Export Trading"
                    : "Business type undecided"}
              </span>

              <span
                style={{
                  background:
                    car.ownership === "Mine Only"
                      ? "#e0f2fe"
                      : "#fff7ed",
                  color:
                    car.ownership === "Mine Only"
                      ? "#075985"
                      : "#9a3412",
                  borderRadius: 20,
                  padding: "6px 11px",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {car.ownership}
              </span>

              <span
                style={{
                  background: fundingColors.background,
                  color: fundingColors.color,
                  borderRadius: 20,
                  padding: "6px 11px",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Funding: {car.fundingStatus}
              </span>

              {investor && (
                <span
                  style={{
                    background: "#ede9fe",
                    color: "#5b21b6",
                    borderRadius: 20,
                    padding: "6px 11px",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Investor: {investor.name}
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setShowDetails(
                  (current) => !current
                )
              }
              style={{
                ...buttonStyle,
                background: "#111827",
              }}
            >
              {showDetails
                ? "Hide Details"
                : "View Details"}
            </button>

            <button
              type="button"
              onClick={() =>
                onManageExpenses(car)
              }
              style={{
                ...buttonStyle,
                background: "#7c3aed",
              }}
            >
              Expenses
            </button>

            <button
              type="button"
              onClick={() => onEdit(car)}
              style={{
                ...buttonStyle,
                background: "#2563eb",
              }}
            >
              Edit
            </button>

            <button
              type="button"
              onClick={handleDelete}
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
            marginTop: 22,
          }}
        >
          <div style={summaryBoxStyle}>
            <div style={smallLabelStyle}>
              Total Cost
            </div>

            <strong
              style={{
                display: "block",
                fontSize: 22,
              }}
            >
              {formatYen(totalCost)}
            </strong>
          </div>

          <div style={summaryBoxStyle}>
            <div style={smallLabelStyle}>
              Expenses
            </div>

            <strong
              style={{
                display: "block",
                fontSize: 22,
              }}
            >
              {formatYen(expenseTotal)}
            </strong>

            <div
              style={{
                color: "#6b7280",
                marginTop: 5,
                fontSize: 14,
              }}
            >
              {car.expenses.length}{" "}
              {car.expenses.length === 1
                ? "item"
                : "items"}
            </div>
          </div>

          <div style={summaryBoxStyle}>
            <div style={smallLabelStyle}>
              Sale Price
            </div>

            <strong
              style={{
                display: "block",
                fontSize: 22,
              }}
            >
              {hasSale
                ? formatYen(car.salePrice)
                : "Awaiting sale"}
            </strong>
          </div>

          <div
            style={{
              ...summaryBoxStyle,
              background: hasSale
                ? netProfit >= 0
                  ? "#f0fdf4"
                  : "#fef2f2"
                : "#f9fafb",
            }}
          >
            <div style={smallLabelStyle}>
              Result
            </div>

            <strong
              style={{
                display: "block",
                fontSize: 22,
                color: hasSale
                  ? netProfit >= 0
                    ? "#16a34a"
                    : "#dc2626"
                  : "#6b7280",
              }}
            >
              {hasSale
                ? formatYen(netProfit)
                : "Pending"}
            </strong>

            {hasSale && (
              <div
                style={{
                  marginTop: 5,
                  fontSize: 14,
                  fontWeight: 700,
                  color:
                    roi >= 0
                      ? "#166534"
                      : "#991b1b",
                }}
              >
                ROI: {roi.toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      </div>

      {showDetails && (
        <div
          style={{
            background: "#fafafa",
            borderTop: "1px solid #e5e7eb",
            padding: 22,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 15,
              marginBottom: 20,
            }}
          >
            <section style={summaryBoxStyle}>
              <div style={smallLabelStyle}>
                Important Dates
              </div>

              <p>
                <strong>Purchased:</strong>{" "}
                {formatDate(car.purchaseDate)}
              </p>

              <p style={{ marginBottom: 0 }}>
                <strong>Sold:</strong>{" "}
                {formatDate(car.saleDate)}
              </p>
            </section>

            <section style={summaryBoxStyle}>
              <div style={smallLabelStyle}>
                Auction
              </div>

              <p>
                <strong>Bid price:</strong>{" "}
                {car.bidPrice
                  ? formatYen(car.bidPrice)
                  : "Not entered"}
              </p>

              <p style={{ marginBottom: 0 }}>
                <strong>Final price:</strong>{" "}
                {car.auctionFinalPrice
                  ? formatYen(
                      car.auctionFinalPrice
                    )
                  : "Not entered"}
              </p>
            </section>

            <section style={summaryBoxStyle}>
              <div style={smallLabelStyle}>
                Sale
              </div>

              <p>
                <strong>Sale price:</strong>{" "}
                {hasSale
                  ? formatYen(car.salePrice)
                  : "Awaiting sale"}
              </p>

              <p style={{ marginBottom: 0 }}>
                <strong>Status:</strong>{" "}
                {car.status}
              </p>
            </section>
          </div>

          <VehicleProfitSummary
            car={car}
            investors={investors}
          />

          {car.investorId !== null &&
            car.fundingStatus === "Allocated" && (
              <div
                style={{
                  marginTop: 20,
                  background: "#ede9fe",
                  border: "1px solid #c4b5fd",
                  borderRadius: 11,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 15,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display: "block",
                        color: "#5b21b6",
                      }}
                    >
                      Investor capital is allocated
                    </strong>

                    <span
                      style={{
                        color: "#6d28d9",
                        fontSize: 14,
                      }}
                    >
                      Close the investment after the
                      vehicle is sold.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCloseInvestment}
                    style={{
                      ...buttonStyle,
                      background: "#16a34a",
                    }}
                  >
                    Close Investment
                  </button>
                </div>
              </div>
            )}

          {car.fundingStatus === "Closed" && (
            <div
              style={{
                marginTop: 20,
                background: "#dcfce7",
                color: "#166534",
                border: "1px solid #86efac",
                borderRadius: 11,
                padding: 16,
                fontWeight: 700,
              }}
            >
              Investment closed. The allocated
              investor capital is no longer tied up
              in this vehicle.
            </div>
          )}
        </div>
      )}
    </article>
  );
}