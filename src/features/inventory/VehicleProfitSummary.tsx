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
    <div className="cf-grid cf-grid-auto-lg">
      <section className="cf-card cf-card-pad">
        <h3 style={{ marginBottom: 8 }}>Financial Summary</h3>

        <div className="cf-datarow">
          <span>Final auction price</span>
          <strong className="num">
            {formatYen(car.auctionFinalPrice)}
          </strong>
        </div>

        <div className="cf-datarow">
          <span>Total cost</span>
          <strong className="num">{formatYen(totalCost)}</strong>
        </div>

        <div className="cf-datarow">
          <span>Break-even price</span>
          <strong className="num">{formatYen(breakEvenPrice)}</strong>
        </div>

        <div className="cf-datarow">
          <span>Sale price</span>
          <strong className="num">
            {hasSale ? formatYen(car.salePrice) : "Awaiting sale"}
          </strong>
        </div>

        <div className="cf-datarow">
          <span>Net result</span>
          <strong
            className={
              "num " +
              (hasSale ? (netProfit >= 0 ? "cf-pos" : "cf-neg") : "cf-muted")
            }
          >
            {hasSale ? formatYen(netProfit) : "Pending"}
          </strong>
        </div>

        {hasSale && (
          <div
            className={
              "cf-callout " +
              (roi >= 0 ? "cf-callout-green" : "cf-callout-red")
            }
            style={{ marginTop: 14 }}
          >
            <strong className="num">ROI: {roi.toFixed(1)}%</strong>
          </div>
        )}
      </section>

      <section className="cf-card cf-card-pad">
        <h3 style={{ marginBottom: 8 }}>Ownership and Funding</h3>

        <div className="cf-datarow">
          <span>Ownership</span>
          <strong>{car.ownership}</strong>
        </div>

        <div className="cf-datarow">
          <span>Business type</span>
          <strong>
            {car.saleType === "Local"
              ? "Local Trading"
              : car.saleType === "Export"
                ? "Export Trading"
                : "Not decided"}
          </strong>
        </div>

        <div className="cf-datarow">
          <span>Funding source</span>
          <strong>{investor ? investor.name : "Self-funded"}</strong>
        </div>

        <div className="cf-datarow">
          <span>Investor allocation</span>
          <strong className="num">
            {investor ? formatYen(investorAllocation) : formatYen(0)}
          </strong>
        </div>

        <div className="cf-datarow">
          <span>Funding status</span>
          <strong
            className={
              car.fundingStatus === "Closed"
                ? "cf-pos"
                : car.fundingStatus === "Allocated"
                  ? "cf-accent-text"
                  : "cf-muted"
            }
          >
            {car.fundingStatus}
          </strong>
        </div>
      </section>

      {hasSale && (
        <section
          className={
            "cf-card cf-card-pad " +
            (netProfit >= 0 ? "" : "")
          }
          style={{
            background: netProfit >= 0 ? "var(--pos-bg)" : "var(--neg-bg)",
            borderColor:
              netProfit >= 0 ? "var(--pos-border)" : "var(--neg-border)",
          }}
        >
          <h3 style={{ marginBottom: 8 }}>Profit Distribution</h3>

          {car.ownership === "Me + Partner" && (
            <div className="cf-datarow">
              <span>Business partner</span>
              <strong className="num">
                {formatYen(distribution.partnerProfit)}
              </strong>
            </div>
          )}

          <div className="cf-datarow">
            <span>Your side before investor</span>
            <strong className="num">
              {formatYen(distribution.yourSideProfit)}
            </strong>
          </div>

          {investor && netProfit > 0 && (
            <div className="cf-datarow">
              <span>
                {investor.name} ({investor.profitShare}%)
              </span>
              <strong className="num">
                {formatYen(distribution.investorProfit)}
              </strong>
            </div>
          )}

          <div className="cf-datarow" style={{ fontSize: "1.05rem" }}>
            <span>Your final profit</span>
            <strong
              className={
                "num " +
                (distribution.yourFinalProfit >= 0 ? "cf-pos" : "cf-neg")
              }
            >
              {formatYen(distribution.yourFinalProfit)}
            </strong>
          </div>
        </section>
      )}
    </div>
  );
}
