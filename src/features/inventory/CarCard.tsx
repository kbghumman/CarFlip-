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

function getStatusBadgeClass(status: Car["status"]) {
  if (status === "Sold") {
    return "cf-badge cf-badge-green";
  }

  if (status === "Shipping") {
    return "cf-badge cf-badge-orange";
  }

  if (status === "Reserved") {
    return "cf-badge cf-badge-amber";
  }

  return "cf-badge cf-badge-blue";
}

function getFundingBadgeClass(
  fundingStatus: Car["fundingStatus"]
) {
  if (fundingStatus === "Closed") {
    return "cf-badge cf-badge-green";
  }

  if (fundingStatus === "Allocated") {
    return "cf-badge cf-badge-violet";
  }

  return "cf-badge cf-badge-slate";
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
      className="cf-card"
      style={{ marginBottom: 20, overflow: "hidden" }}
    >
      <div className="cf-card-pad">
        <div className="cf-flex-between" style={{ alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2 style={{ marginBottom: 12 }}>
              {car.year} {car.make} {car.model}
            </h2>

            <div className="cf-flex" style={{ gap: 8 }}>
              <span className={getStatusBadgeClass(car.status)}>
                <span className="cf-dot" />
                {car.status}
              </span>

              <span className="cf-badge cf-badge-slate">
                {car.saleType === "Local"
                  ? "Local Trading"
                  : car.saleType === "Export"
                    ? "Export Trading"
                    : "Business type undecided"}
              </span>

              <span
                className={
                  "cf-badge " +
                  (car.ownership === "Mine Only"
                    ? "cf-badge-sky"
                    : "cf-badge-orange")
                }
              >
                {car.ownership}
              </span>

              <span className={getFundingBadgeClass(car.fundingStatus)}>
                Funding: {car.fundingStatus}
              </span>

              {investor && (
                <span className="cf-badge cf-badge-violet">
                  Investor: {investor.name}
                </span>
              )}
            </div>
          </div>

          <div className="cf-actions">
            <button
              type="button"
              onClick={() =>
                setShowDetails(
                  (current) => !current
                )
              }
              className="cf-btn cf-btn-dark cf-btn-sm"
            >
              {showDetails ? "Hide Details" : "View Details"}
            </button>

            <button
              type="button"
              onClick={() => onManageExpenses(car)}
              className="cf-btn cf-btn-accent cf-btn-sm"
            >
              Expenses
            </button>

            <button
              type="button"
              onClick={() => onEdit(car)}
              className="cf-btn cf-btn-primary cf-btn-sm"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="cf-btn cf-btn-danger cf-btn-sm"
            >
              Delete
            </button>
          </div>
        </div>

        <div
          className="cf-grid cf-grid-auto-sm"
          style={{ marginTop: 22 }}
        >
          <div className="cf-inset">
            <div className="cf-mini-label">Total Cost</div>
            <strong className="num" style={{ fontSize: "1.35rem" }}>
              {formatYen(totalCost)}
            </strong>
          </div>

          <div className="cf-inset">
            <div className="cf-mini-label">Expenses</div>
            <strong className="num" style={{ fontSize: "1.35rem" }}>
              {formatYen(expenseTotal)}
            </strong>
            <div className="cf-muted" style={{ marginTop: 5, fontSize: "0.85rem" }}>
              {car.expenses.length}{" "}
              {car.expenses.length === 1 ? "item" : "items"}
            </div>
          </div>

          <div className="cf-inset">
            <div className="cf-mini-label">Sale Price</div>
            <strong className="num" style={{ fontSize: "1.35rem" }}>
              {hasSale ? formatYen(car.salePrice) : "Awaiting sale"}
            </strong>
          </div>

          <div
            className="cf-inset"
            style={{
              background: hasSale
                ? netProfit >= 0
                  ? "var(--pos-bg)"
                  : "var(--neg-bg)"
                : "var(--surface-2)",
              borderColor: hasSale
                ? netProfit >= 0
                  ? "var(--pos-border)"
                  : "var(--neg-border)"
                : "var(--line)",
            }}
          >
            <div className="cf-mini-label">Result</div>
            <strong
              className={
                "num " +
                (hasSale
                  ? netProfit >= 0
                    ? "cf-pos"
                    : "cf-neg"
                  : "cf-muted")
              }
              style={{ fontSize: "1.35rem" }}
            >
              {hasSale ? formatYen(netProfit) : "Pending"}
            </strong>

            {hasSale && (
              <div
                className={
                  "num " + (roi >= 0 ? "cf-pos" : "cf-neg")
                }
                style={{ marginTop: 5, fontSize: "0.85rem", fontWeight: 700 }}
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
            background: "var(--surface-2)",
            borderTop: "1px solid var(--line)",
            padding: 22,
          }}
        >
          <div
            className="cf-grid cf-grid-auto-lg"
            style={{ marginBottom: 20 }}
          >
            <section className="cf-card cf-card-pad">
              <div className="cf-mini-label">Important Dates</div>
              <p style={{ marginTop: 4 }}>
                <strong>Purchased:</strong> {formatDate(car.purchaseDate)}
              </p>
              <p style={{ marginTop: 6 }}>
                <strong>Sold:</strong> {formatDate(car.saleDate)}
              </p>
            </section>

            <section className="cf-card cf-card-pad">
              <div className="cf-mini-label">Auction</div>
              <p style={{ marginTop: 4 }}>
                <strong>Bid price:</strong>{" "}
                {car.bidPrice ? formatYen(car.bidPrice) : "Not entered"}
              </p>
              <p style={{ marginTop: 6 }}>
                <strong>Final price:</strong>{" "}
                {car.auctionFinalPrice
                  ? formatYen(car.auctionFinalPrice)
                  : "Not entered"}
              </p>
            </section>

            <section className="cf-card cf-card-pad">
              <div className="cf-mini-label">Sale</div>
              <p style={{ marginTop: 4 }}>
                <strong>Sale price:</strong>{" "}
                {hasSale ? formatYen(car.salePrice) : "Awaiting sale"}
              </p>
              <p style={{ marginTop: 6 }}>
                <strong>Status:</strong> {car.status}
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
                className="cf-callout cf-callout-accent"
                style={{ marginTop: 20 }}
              >
                <div className="cf-flex-between">
                  <div>
                    <strong style={{ display: "block", color: "var(--accent)" }}>
                      Investor capital is allocated
                    </strong>
                    <span style={{ fontSize: "0.85rem" }}>
                      Close the investment after the vehicle is sold.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCloseInvestment}
                    className="cf-btn cf-btn-success cf-btn-sm"
                  >
                    Close Investment
                  </button>
                </div>
              </div>
            )}

          {car.fundingStatus === "Closed" && (
            <div
              className="cf-callout cf-callout-green"
              style={{ marginTop: 20, fontWeight: 700 }}
            >
              Investment closed. The allocated investor capital is no longer
              tied up in this vehicle.
            </div>
          )}
        </div>
      )}
    </article>
  );
}
