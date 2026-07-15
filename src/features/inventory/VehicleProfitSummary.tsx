import type { Car, Investor } from "../../types";

import {
  findInvestor,
  formatYen,
  getInvestorAllocation,
  getNetProfit,
  getProfitDistribution,
  getTotalCost,
} from "../../utils/finance";

type VehicleProfitSummaryProps = {
  car: Car;
  investors: Investor[];
};

const sectionStyle = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  borderRadius: 16,
  padding: 18,
};

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 15,
  padding: "9px 0",
  borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
  flexWrap: "wrap" as const,
};

export default function VehicleProfitSummary({
  car,
  investors,
}: VehicleProfitSummaryProps) {
  const investor = findInvestor(car, investors);

  const totalCost = getTotalCost(car);
  const netProfit = getNetProfit(car);
  const investorAllocation = getInvestorAllocation(car);

  const distribution = getProfitDistribution(
    car,
    investors
  );

  const hasSale =
    Boolean(car.saleDate) &&
    Number(car.salePrice) > 0;

  const breakEvenPrice = totalCost;

  const roi =
    totalCost > 0 && hasSale
      ? (netProfit / totalCost) * 100
      : 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 18,
      }}
    >
      <section style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>
          Financial Summary
        </h3>

        <div style={rowStyle}>
          <span>Final auction price</span>

          <strong>
            {formatYen(car.auctionFinalPrice)}
          </strong>
        </div>

        <div style={rowStyle}>
          <span>Total cost</span>

          <strong>{formatYen(totalCost)}</strong>
        </div>

        <div style={rowStyle}>
          <span>Break-even price</span>

          <strong>{formatYen(breakEvenPrice)}</strong>
        </div>

        <div style={rowStyle}>
          <span>Sale price</span>

          <strong>
            {hasSale
              ? formatYen(car.salePrice)
              : "Awaiting sale"}
          </strong>
        </div>

        <div
          style={{
            ...rowStyle,
            borderBottom: "none",
          }}
        >
          <span>Net result</span>

          <strong
            style={{
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
        </div>

        {hasSale && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              background:
                roi >= 0 ? "#f0fdf4" : "#fef2f2",
            }}
          >
            <strong
              style={{
                color:
                  roi >= 0 ? "#166534" : "#991b1b",
              }}
            >
              ROI: {roi.toFixed(1)}%
            </strong>
          </div>
        )}
      </section>

      <section style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>
          Ownership and Funding
        </h3>

        <div style={rowStyle}>
          <span>Ownership</span>

          <strong>{car.ownership}</strong>
        </div>

        <div style={rowStyle}>
          <span>Business type</span>

          <strong>
            {car.saleType === "Local"
              ? "Local Trading"
              : car.saleType === "Export"
                ? "Export Trading"
                : "Not decided"}
          </strong>
        </div>

        <div style={rowStyle}>
          <span>Funding source</span>

          <strong>
            {investor
              ? investor.name
              : "Self-funded"}
          </strong>
        </div>

        <div style={rowStyle}>
          <span>Investor allocation</span>

          <strong>
            {investor
              ? formatYen(investorAllocation)
              : formatYen(0)}
          </strong>
        </div>

        <div
          style={{
            ...rowStyle,
            borderBottom: "none",
          }}
        >
          <span>Funding status</span>

          <strong
            style={{
              color:
                car.fundingStatus === "Closed"
                  ? "#16a34a"
                  : car.fundingStatus === "Allocated"
                    ? "#7c3aed"
                    : "#6b7280",
            }}
          >
            {car.fundingStatus}
          </strong>
        </div>
      </section>

      {hasSale && (
        <section
          style={{
            ...sectionStyle,
            background:
              netProfit >= 0 ? "#f0fdf4" : "#fef2f2",
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Profit Distribution
          </h3>

          {car.ownership === "Me + Partner" && (
            <div style={rowStyle}>
              <span>Business partner</span>

              <strong>
                {formatYen(
                  distribution.partnerProfit
                )}
              </strong>
            </div>
          )}

          <div style={rowStyle}>
            <span>Your side before investor</span>

            <strong>
              {formatYen(
                distribution.yourSideProfit
              )}
            </strong>
          </div>

          {investor && netProfit > 0 && (
            <div style={rowStyle}>
              <span>
                {investor.name} (
                {investor.profitShare}%)
              </span>

              <strong>
                {formatYen(
                  distribution.investorProfit
                )}
              </strong>
            </div>
          )}

          <div
            style={{
              ...rowStyle,
              borderBottom: "none",
              fontSize: 18,
            }}
          >
            <span>Your final profit</span>

            <strong
              style={{
                color:
                  distribution.yourFinalProfit >= 0
                    ? "#16a34a"
                    : "#dc2626",
              }}
            >
              {formatYen(
                distribution.yourFinalProfit
              )}
            </strong>
          </div>
        </section>
      )}
    </div>
  );
}