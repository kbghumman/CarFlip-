import { useMemo, useState } from "react";
import StatCard from "../components/StatCard";

type CarStatus = "In Stock" | "Reserved" | "Sold" | "Shipping";
type SaleType = "Not decided" | "Local" | "Export";
type ExpensePayer = "Me" | "Business Partner";
type InvestorShare = 25 | 50;
type BusinessType = "Local" | "Export";
type CapitalTransactionType = "Deposit" | "Return";

type Expense = {
  id: number;
  name: string;
  amount: string;
  paidBy: ExpensePayer;
  category?: string;
  date?: string;
  notes?: string;
};

type Car = {
  id: number;
  make: string;
  model: string;
  year: string;
  purchaseDate?: string;
  saleDate?: string;
  bidPrice?: string;
  auctionFinalPrice?: string;
  salePrice?: string;
  status?: CarStatus;
  saleType?: SaleType;
  investorId?: number | null;
  expenses?: Expense[];
};

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

type InvestorProfitSummary = {
  investor: Investor;
  totalCars: number;
  monthlyCars: number;
  totalLocalProfit: number;
  totalExportProfit: number;
  totalProfit: number;
  monthlyLocalProfit: number;
  monthlyExportProfit: number;
  monthlyProfit: number;
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getSavedCars(): Car[] {
  const savedCars = localStorage.getItem("cars");

  if (!savedCars) {
    return [];
  }

  try {
    const parsedCars = JSON.parse(savedCars);

    return parsedCars.map((car: Car) => ({
      ...car,
      expenses: Array.isArray(car.expenses)
        ? car.expenses
        : [],
      investorId:
        typeof car.investorId === "number"
          ? car.investorId
          : null,
    }));
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

    return parsedInvestors.map(
      (investor: Partial<Investor>) => ({
        id: investor.id || Date.now(),
        name: investor.name || "",
        profitShare:
          investor.profitShare === 50 ? 50 : 25,
        transactions: Array.isArray(
          investor.transactions
        )
          ? investor.transactions
          : [],
      })
    );
  } catch {
    return [];
  }
}

function formatYen(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

function getExpenseTotal(car: Car) {
  const expenses = Array.isArray(car.expenses)
    ? car.expenses
    : [];

  return expenses.reduce((total, expense) => {
    return total + (Number(expense.amount) || 0);
  }, 0);
}

function getExpensesPaidBy(
  car: Car,
  payer: ExpensePayer
) {
  const expenses = Array.isArray(car.expenses)
    ? car.expenses
    : [];

  return expenses
    .filter((expense) => expense.paidBy === payer)
    .reduce((total, expense) => {
      return total + (Number(expense.amount) || 0);
    }, 0);
}

function getTotalCost(car: Car) {
  return (
    (Number(car.auctionFinalPrice) || 0) +
    getExpenseTotal(car)
  );
}

function getNetProfit(car: Car) {
  return (
    (Number(car.salePrice) || 0) -
    getTotalCost(car)
  );
}

function getInvestor(
  car: Car,
  investors: Investor[]
) {
  if (
    car.investorId === null ||
    car.investorId === undefined
  ) {
    return undefined;
  }

  return investors.find(
    (investor) => investor.id === car.investorId
  );
}

function getProfitDistribution(
  car: Car,
  investors: Investor[]
) {
  const netProfit = getNetProfit(car);
  const partnerProfit = netProfit * 0.5;
  const yourSideProfit = netProfit * 0.5;
  const investor = getInvestor(car, investors);

  const investorProfit =
    investor && netProfit > 0
      ? yourSideProfit *
        (investor.profitShare / 100)
      : 0;

  const yourProfit =
    yourSideProfit - investorProfit;

  return {
    partnerProfit,
    yourSideProfit,
    investorProfit,
    yourProfit,
  };
}

function getCapitalDeposits(
  investor: Investor,
  businessType?: BusinessType
) {
  return investor.transactions
    .filter((transaction) => {
      const matchesType =
        transaction.type === "Deposit";

      const matchesBusiness =
        !businessType ||
        transaction.businessType === businessType;

      return matchesType && matchesBusiness;
    })
    .reduce((total, transaction) => {
      return total + (Number(transaction.amount) || 0);
    }, 0);
}

function getCapitalReturns(
  investor: Investor,
  businessType?: BusinessType
) {
  return investor.transactions
    .filter((transaction) => {
      const matchesType =
        transaction.type === "Return";

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
    getCapitalDeposits(investor, businessType) -
    getCapitalReturns(investor, businessType)
  );
}

function dateMatchesMonth(
  date: string | undefined,
  year: number,
  month: number
) {
  if (!date) {
    return false;
  }

  const parts = date.split("-");

  if (parts.length < 2) {
    return false;
  }

  return (
    Number(parts[0]) === year &&
    Number(parts[1]) === month + 1
  );
}

function getDaysSince(date: string | undefined) {
  if (!date) {
    return 0;
  }

  const startDate = new Date(`${date}T00:00:00`);
  const today = new Date();

  return Math.floor(
    (today.getTime() - startDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

export default function Dashboard() {
  const cars = getSavedCars();
  const investors = getSavedInvestors();

  const today = new Date();

  const [selectedMonth, setSelectedMonth] =
    useState(today.getMonth());

  const [selectedYear, setSelectedYear] =
    useState(today.getFullYear());

  const availableYears = useMemo(() => {
    const years = new Set<number>();

    years.add(today.getFullYear());

    cars.forEach((car) => {
      if (car.purchaseDate) {
        years.add(Number(car.purchaseDate.slice(0, 4)));
      }

      if (car.saleDate) {
        years.add(Number(car.saleDate.slice(0, 4)));
      }

      car.expenses?.forEach((expense) => {
        if (expense.date) {
          years.add(Number(expense.date.slice(0, 4)));
        }
      });
    });

    investors.forEach((investor) => {
      investor.transactions.forEach((transaction) => {
        if (transaction.date) {
          years.add(
            Number(transaction.date.slice(0, 4))
          );
        }
      });
    });

    return [...years]
      .filter((year) => !Number.isNaN(year))
      .sort((a, b) => b - a);
  }, [cars, investors, today]);

  const carsInStock = cars.filter(
    (car) =>
      !car.status || car.status === "In Stock"
  ).length;

  const carsReserved = cars.filter(
    (car) => car.status === "Reserved"
  ).length;

  const carsShipping = cars.filter(
    (car) => car.status === "Shipping"
  ).length;

  const carsSold = cars.filter(
    (car) => car.status === "Sold"
  ).length;

  const totalBusinessCost = cars.reduce(
    (total, car) => total + getTotalCost(car),
    0
  );

  const totalSales = cars.reduce(
    (total, car) =>
      total + (Number(car.salePrice) || 0),
    0
  );

  const carsWithSalePrice = cars.filter(
    (car) => Number(car.salePrice) > 0
  );

  const totalNetProfit =
    carsWithSalePrice.reduce(
      (total, car) => total + getNetProfit(car),
      0
    );

  const totalPartnerProfit =
    carsWithSalePrice.reduce((total, car) => {
      return (
        total +
        getProfitDistribution(car, investors)
          .partnerProfit
      );
    }, 0);

  const totalInvestorProfit =
    carsWithSalePrice.reduce((total, car) => {
      return (
        total +
        getProfitDistribution(car, investors)
          .investorProfit
      );
    }, 0);

  const totalYourProfit =
    carsWithSalePrice.reduce((total, car) => {
      return (
        total +
        getProfitDistribution(car, investors)
          .yourProfit
      );
    }, 0);

  const localCapitalAvailable =
    investors.reduce((total, investor) => {
      return (
        total +
        getAvailableCapital(investor, "Local")
      );
    }, 0);

  const exportCapitalAvailable =
    investors.reduce((total, investor) => {
      return (
        total +
        getAvailableCapital(investor, "Export")
      );
    }, 0);

  const totalCapitalAvailable =
    localCapitalAvailable +
    exportCapitalAvailable;

  /*
   * MONTHLY MONEY RECEIVED
   */

  const monthlySoldCars = cars.filter(
    (car) =>
      dateMatchesMonth(
        car.saleDate,
        selectedYear,
        selectedMonth
      ) && Number(car.salePrice) > 0
  );

  const monthlyVehicleSales =
    monthlySoldCars.reduce((total, car) => {
      return total + (Number(car.salePrice) || 0);
    }, 0);

  const monthlyInvestorDeposits =
    investors.reduce((total, investor) => {
      const investorDeposits =
        investor.transactions
          .filter(
            (transaction) =>
              transaction.type === "Deposit" &&
              dateMatchesMonth(
                transaction.date,
                selectedYear,
                selectedMonth
              )
          )
          .reduce((subtotal, transaction) => {
            return (
              subtotal +
              (Number(transaction.amount) || 0)
            );
          }, 0);

      return total + investorDeposits;
    }, 0);

  const monthlyMoneyIn =
    monthlyVehicleSales +
    monthlyInvestorDeposits;

  /*
   * MONTHLY MONEY PAID OUT
   */

  const monthlyPurchasedCars = cars.filter(
    (car) =>
      dateMatchesMonth(
        car.purchaseDate,
        selectedYear,
        selectedMonth
      )
  );

  const monthlyVehiclePurchases =
    monthlyPurchasedCars.reduce(
      (total, car) => {
        return (
          total +
          (Number(car.auctionFinalPrice) || 0)
        );
      },
      0
    );

  const monthlyExpenses = cars.reduce(
    (total, car) => {
      const expenses = Array.isArray(car.expenses)
        ? car.expenses
        : [];

      const selectedExpenses = expenses
        .filter((expense) =>
          dateMatchesMonth(
            expense.date,
            selectedYear,
            selectedMonth
          )
        )
        .reduce((subtotal, expense) => {
          return (
            subtotal +
            (Number(expense.amount) || 0)
          );
        }, 0);

      return total + selectedExpenses;
    },
    0
  );

  const monthlyCapitalReturned =
    investors.reduce((total, investor) => {
      const investorReturns =
        investor.transactions
          .filter(
            (transaction) =>
              transaction.type === "Return" &&
              dateMatchesMonth(
                transaction.date,
                selectedYear,
                selectedMonth
              )
          )
          .reduce((subtotal, transaction) => {
            return (
              subtotal +
              (Number(transaction.amount) || 0)
            );
          }, 0);

      return total + investorReturns;
    }, 0);

  const monthlyMoneyOut =
    monthlyVehiclePurchases +
    monthlyExpenses +
    monthlyCapitalReturned;

  const monthlyCashMovement =
    monthlyMoneyIn - monthlyMoneyOut;

  /*
   * MONTHLY PROFIT
   *
   * The complete profit from a car is recognised
   * in the month of its sale date.
   */

  const monthlyNetProfit =
    monthlySoldCars.reduce((total, car) => {
      return total + getNetProfit(car);
    }, 0);

  const monthlyPartnerProfit =
    monthlySoldCars.reduce((total, car) => {
      return (
        total +
        getProfitDistribution(car, investors)
          .partnerProfit
      );
    }, 0);

  const monthlyInvestorProfit =
    monthlySoldCars.reduce((total, car) => {
      return (
        total +
        getProfitDistribution(car, investors)
          .investorProfit
      );
    }, 0);

  const monthlyYourProfit =
    monthlySoldCars.reduce((total, car) => {
      return (
        total +
        getProfitDistribution(car, investors)
          .yourProfit
      );
    }, 0);

  const monthlyLocalSales =
    monthlySoldCars
      .filter((car) => car.saleType === "Local")
      .reduce((total, car) => {
        return total + (Number(car.salePrice) || 0);
      }, 0);

  const monthlyExportSales =
    monthlySoldCars
      .filter((car) => car.saleType === "Export")
      .reduce((total, car) => {
        return total + (Number(car.salePrice) || 0);
      }, 0);

  const monthlyLocalProfit =
    monthlySoldCars
      .filter((car) => car.saleType === "Local")
      .reduce((total, car) => {
        return total + getNetProfit(car);
      }, 0);

  const monthlyExportProfit =
    monthlySoldCars
      .filter((car) => car.saleType === "Export")
      .reduce((total, car) => {
        return total + getNetProfit(car);
      }, 0);

  /*
   * PROFIT FOR EACH INVESTOR
   */

  const investorProfitSummaries:
    InvestorProfitSummary[] = investors.map(
      (investor) => {
        const investorCars = cars.filter(
          (car) =>
            car.investorId === investor.id &&
            Number(car.salePrice) > 0
        );

        const monthlyInvestorCars =
          investorCars.filter((car) =>
            dateMatchesMonth(
              car.saleDate,
              selectedYear,
              selectedMonth
            )
          );

        const calculateInvestorProfit = (
          selectedCars: Car[],
          businessType?: BusinessType
        ) => {
          return selectedCars
            .filter(
              (car) =>
                !businessType ||
                car.saleType === businessType
            )
            .reduce((total, car) => {
              return (
                total +
                getProfitDistribution(car, investors)
                  .investorProfit
              );
            }, 0);
        };

        const totalLocalProfit =
          calculateInvestorProfit(
            investorCars,
            "Local"
          );

        const totalExportProfit =
          calculateInvestorProfit(
            investorCars,
            "Export"
          );

        const monthlyLocalProfit =
          calculateInvestorProfit(
            monthlyInvestorCars,
            "Local"
          );

        const monthlyExportProfit =
          calculateInvestorProfit(
            monthlyInvestorCars,
            "Export"
          );

        return {
          investor,
          totalCars: investorCars.length,
          monthlyCars: monthlyInvestorCars.length,
          totalLocalProfit,
          totalExportProfit,
          totalProfit:
            totalLocalProfit + totalExportProfit,
          monthlyLocalProfit,
          monthlyExportProfit,
          monthlyProfit:
            monthlyLocalProfit +
            monthlyExportProfit,
        };
      }
    );

  /*
   * ALERTS
   */

  const carsMissingPurchaseDate = cars.filter(
    (car) => !car.purchaseDate
  );

  const soldCarsMissingSaleDate = cars.filter(
    (car) =>
      car.status === "Sold" && !car.saleDate
  );

  const carsMissingBusinessType = cars.filter(
    (car) =>
      !car.saleType ||
      car.saleType === "Not decided"
  );

  const oldStockCars = cars.filter(
    (car) =>
      (car.status === "In Stock" ||
        car.status === "Reserved" ||
        !car.status) &&
      getDaysSince(car.purchaseDate) > 60
  );

  const alertCount =
    carsMissingPurchaseDate.length +
    soldCarsMissingSaleDate.length +
    carsMissingBusinessType.length +
    oldStockCars.length;

  const totalExpensesPaidByMe = cars.reduce(
    (total, car) =>
      total + getExpensesPaidBy(car, "Me"),
    0
  );

  const totalExpensesPaidByPartner =
    cars.reduce(
      (total, car) =>
        total +
        getExpensesPaidBy(
          car,
          "Business Partner"
        ),
      0
    );

  return (
    <div>
      <div className="cf-page-head">
        <div>
          <div className="cf-eyebrow">Overview</div>
          <h1>Dashboard</h1>
          <p>Financial and operational overview of your trading business</p>
        </div>
      </div>

      <div className="cf-grid cf-grid-auto">
        <StatCard
          title="Cars in Stock"
          value={carsInStock}
          color="#2563eb"
        />

        <StatCard
          title="Total Business Cost"
          value={formatYen(totalBusinessCost)}
          color="#0f172a"
        />

        <StatCard
          title="Total Sales"
          value={formatYen(totalSales)}
          color="#0891b2"
        />

        <StatCard
          title="Total Net Profit"
          value={formatYen(totalNetProfit)}
          color={totalNetProfit >= 0 ? "#15803d" : "#dc2626"}
        />
      </div>

      <div
        className="cf-grid cf-grid-auto"
        style={{ marginTop: 16 }}
      >
        <StatCard
          title="Partner Profit"
          value={formatYen(totalPartnerProfit)}
          color="#ea580c"
        />

        <StatCard
          title="Investor Profit"
          value={formatYen(totalInvestorProfit)}
          color="#7c3aed"
        />

        <StatCard
          title="Your Final Profit"
          value={formatYen(totalYourProfit)}
          color="#15803d"
        />

        <StatCard
          title="Investor Capital"
          value={formatYen(totalCapitalAvailable)}
          color="#2563eb"
        />
      </div>

      <section className="cf-panel" style={{ marginTop: 28 }}>
        <div className="cf-flex-between">
          <div>
            <h2>Monthly Statistics</h2>
            <p className="cf-muted" style={{ marginTop: 4 }}>
              Money moving in and out during the selected month
            </p>
          </div>

          <div className="cf-flex">
            <select
              className="cf-select"
              style={{ width: "auto" }}
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(
                  Number(event.target.value)
                )
              }
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>

            <select
              className="cf-select"
              style={{ width: "auto" }}
              value={selectedYear}
              onChange={(event) =>
                setSelectedYear(
                  Number(event.target.value)
                )
              }
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <h3 style={{ marginTop: 24, marginBottom: 14 }}>
          {monthNames[selectedMonth]} {selectedYear}
        </h3>

        <div className="cf-grid cf-grid-auto">
          <div className="cf-inset">
            <div className="cf-mini-label">Total Money In</div>
            <strong className="cf-stat-value num cf-pos">
              {formatYen(monthlyMoneyIn)}
            </strong>
          </div>

          <div className="cf-inset">
            <div className="cf-mini-label">Total Money Out</div>
            <strong className="cf-stat-value num cf-neg">
              {formatYen(monthlyMoneyOut)}
            </strong>
          </div>

          <div className="cf-inset">
            <div className="cf-mini-label">Net Cash Movement</div>
            <strong
              className={
                "cf-stat-value num " +
                (monthlyCashMovement >= 0
                  ? "cf-brand-text"
                  : "cf-warn-text")
              }
            >
              {formatYen(monthlyCashMovement)}
            </strong>
          </div>

          <div className="cf-inset">
            <div className="cf-mini-label">Trading Profit</div>
            <strong
              className={
                "cf-stat-value num " +
                (monthlyNetProfit >= 0 ? "cf-pos" : "cf-neg")
              }
            >
              {formatYen(monthlyNetProfit)}
            </strong>
          </div>
        </div>

        <div
          className="cf-grid cf-grid-auto-lg"
          style={{ marginTop: 18 }}
        >
          <div className="cf-inset">
            <h3 style={{ marginBottom: 8 }}>Money Received</h3>

            <div className="cf-datarow">
              <span>Vehicle sales</span>
              <strong className="num">
                {formatYen(monthlyVehicleSales)}
              </strong>
            </div>

            <div className="cf-datarow">
              <span>Investor deposits</span>
              <strong className="num">
                {formatYen(monthlyInvestorDeposits)}
              </strong>
            </div>

            <div className="cf-datarow">
              <strong>Total received</strong>
              <strong className="num cf-pos">
                {formatYen(monthlyMoneyIn)}
              </strong>
            </div>
          </div>

          <div className="cf-inset">
            <h3 style={{ marginBottom: 8 }}>Money Paid Out</h3>

            <div className="cf-datarow">
              <span>Vehicle purchases</span>
              <strong className="num">
                {formatYen(monthlyVehiclePurchases)}
              </strong>
            </div>

            <div className="cf-datarow">
              <span>Vehicle expenses</span>
              <strong className="num">
                {formatYen(monthlyExpenses)}
              </strong>
            </div>

            <div className="cf-datarow">
              <span>Investor capital returned</span>
              <strong className="num">
                {formatYen(monthlyCapitalReturned)}
              </strong>
            </div>

            <div className="cf-datarow">
              <strong>Total paid out</strong>
              <strong className="num cf-neg">
                {formatYen(monthlyMoneyOut)}
              </strong>
            </div>
          </div>
        </div>

        <div className="cf-inset" style={{ marginTop: 18 }}>
          <h3 style={{ marginBottom: 8 }}>
            Monthly Profit Distribution
          </h3>

          <div className="cf-datarow">
            <span>Vehicles sold</span>
            <strong className="num">{monthlySoldCars.length}</strong>
          </div>

          <div className="cf-datarow">
            <span>Total trading profit</span>
            <strong className="num">
              {formatYen(monthlyNetProfit)}
            </strong>
          </div>

          <div className="cf-datarow">
            <span>Business partner&apos;s share</span>
            <strong className="num">
              {formatYen(monthlyPartnerProfit)}
            </strong>
          </div>

          <div className="cf-datarow">
            <span>Investors&apos; combined share</span>
            <strong className="num">
              {formatYen(monthlyInvestorProfit)}
            </strong>
          </div>

          <div className="cf-datarow">
            <span>Your final profit</span>
            <strong className="num cf-brand-text">
              {formatYen(monthlyYourProfit)}
            </strong>
          </div>
        </div>

        <div
          className="cf-grid cf-grid-auto-lg"
          style={{ marginTop: 18 }}
        >
          <div className="cf-inset">
            <h3 style={{ marginBottom: 10 }}>Local Trading</h3>

            <div className="cf-datarow">
              <span>Sales</span>
              <strong className="num">
                {formatYen(monthlyLocalSales)}
              </strong>
            </div>
            <div className="cf-datarow">
              <span>Profit</span>
              <strong className="num">
                {formatYen(monthlyLocalProfit)}
              </strong>
            </div>
          </div>

          <div className="cf-inset">
            <h3 style={{ marginBottom: 10 }}>Export Trading</h3>

            <div className="cf-datarow">
              <span>Sales</span>
              <strong className="num">
                {formatYen(monthlyExportSales)}
              </strong>
            </div>
            <div className="cf-datarow">
              <span>Profit</span>
              <strong className="num">
                {formatYen(monthlyExportProfit)}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="cf-panel" style={{ marginTop: 28 }}>
        <h2>Profit Distribution by Investor</h2>
        <p className="cf-muted" style={{ marginTop: 4, marginBottom: 18 }}>
          Separate lifetime and selected-month results for every investor
        </p>

        {investorProfitSummaries.length === 0 ? (
          <div className="cf-empty">No investors have been added yet.</div>
        ) : (
          investorProfitSummaries.map((summary) => {
            const localCapital =
              getAvailableCapital(
                summary.investor,
                "Local"
              );

            const exportCapital =
              getAvailableCapital(
                summary.investor,
                "Export"
              );

            return (
              <div
                key={summary.investor.id}
                className="cf-inset"
                style={{ marginBottom: 16 }}
              >
                <div className="cf-flex-between">
                  <div>
                    <h3 style={{ marginBottom: 8 }}>
                      {summary.investor.name}
                    </h3>

                    <span className="cf-badge cf-badge-violet">
                      {summary.investor.profitShare}% of your profit side
                    </span>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div className="cf-mini-label" style={{ marginBottom: 4 }}>
                      Total profit earned
                    </div>

                    <strong className="cf-stat-value num cf-accent-text">
                      {formatYen(summary.totalProfit)}
                    </strong>
                  </div>
                </div>

                <div
                  className="cf-grid cf-grid-auto-sm"
                  style={{ marginTop: 18 }}
                >
                  <div className="cf-card cf-card-pad">
                    <div className="cf-mini-label">This month</div>
                    <strong className="num cf-accent-text" style={{ fontSize: "1.25rem" }}>
                      {formatYen(summary.monthlyProfit)}
                    </strong>
                    <div className="cf-muted" style={{ marginTop: 4, fontSize: "0.82rem" }}>
                      {summary.monthlyCars} vehicles
                    </div>
                  </div>

                  <div className="cf-card cf-card-pad">
                    <div className="cf-mini-label">Lifetime local profit</div>
                    <strong className="num" style={{ fontSize: "1.25rem" }}>
                      {formatYen(summary.totalLocalProfit)}
                    </strong>
                  </div>

                  <div className="cf-card cf-card-pad">
                    <div className="cf-mini-label">Lifetime export profit</div>
                    <strong className="num" style={{ fontSize: "1.25rem" }}>
                      {formatYen(summary.totalExportProfit)}
                    </strong>
                  </div>

                  <div className="cf-card cf-card-pad">
                    <div className="cf-mini-label">Total vehicles</div>
                    <strong className="num" style={{ fontSize: "1.25rem" }}>
                      {summary.totalCars}
                    </strong>
                  </div>
                </div>

                <div
                  className="cf-grid cf-grid-auto"
                  style={{ marginTop: 12 }}
                >
                  <div className="cf-card cf-card-pad">
                    <div className="cf-mini-label">Local capital available</div>
                    <strong className="num cf-brand-text">
                      {formatYen(localCapital)}
                    </strong>
                    <div className="cf-muted" style={{ marginTop: 6, fontSize: "0.82rem" }}>
                      Monthly local profit: {formatYen(summary.monthlyLocalProfit)}
                    </div>
                  </div>

                  <div className="cf-card cf-card-pad">
                    <div className="cf-mini-label">Export capital available</div>
                    <strong className="num cf-accent-text">
                      {formatYen(exportCapital)}
                    </strong>
                    <div className="cf-muted" style={{ marginTop: 6, fontSize: "0.82rem" }}>
                      Monthly export profit: {formatYen(summary.monthlyExportProfit)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      <div
        className="cf-grid cf-grid-auto-lg"
        style={{ marginTop: 28 }}
      >
        <div className="cf-panel">
          <h2>Inventory Status</h2>

          <div className="cf-datarow" style={{ marginTop: 8 }}>
            <span>In stock</span>
            <strong className="num">{carsInStock}</strong>
          </div>

          <div className="cf-datarow">
            <span>Reserved</span>
            <strong className="num">{carsReserved}</strong>
          </div>

          <div className="cf-datarow">
            <span>Shipping</span>
            <strong className="num">{carsShipping}</strong>
          </div>

          <div className="cf-datarow">
            <span>Sold</span>
            <strong className="num">{carsSold}</strong>
          </div>
        </div>

        <div className="cf-panel">
          <h2>Expense Payments</h2>

          <div className="cf-datarow" style={{ marginTop: 8 }}>
            <span>Paid by me</span>
            <strong className="num">
              {formatYen(totalExpensesPaidByMe)}
            </strong>
          </div>

          <div className="cf-datarow">
            <span>Paid by partner</span>
            <strong className="num">
              {formatYen(totalExpensesPaidByPartner)}
            </strong>
          </div>
        </div>

        <div className="cf-panel">
          <div className="cf-section-title">
            <h2>Business Alerts</h2>
            {alertCount > 0 && (
              <span className="cf-badge cf-badge-amber">{alertCount}</span>
            )}
          </div>

          {alertCount === 0 ? (
            <p className="cf-pos">Everything looks up to date.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {carsMissingPurchaseDate.length > 0 && (
                <div className="cf-callout cf-callout-amber">
                  Cars missing purchase dates:{" "}
                  <strong>{carsMissingPurchaseDate.length}</strong>
                </div>
              )}

              {soldCarsMissingSaleDate.length > 0 && (
                <div className="cf-callout cf-callout-amber">
                  Sold cars missing sale dates:{" "}
                  <strong>{soldCarsMissingSaleDate.length}</strong>
                </div>
              )}

              {carsMissingBusinessType.length > 0 && (
                <div className="cf-callout cf-callout-amber">
                  Cars missing business type:{" "}
                  <strong>{carsMissingBusinessType.length}</strong>
                </div>
              )}

              {oldStockCars.length > 0 && (
                <div className="cf-callout cf-callout-amber">
                  Cars held for more than 60 days:{" "}
                  <strong>{oldStockCars.length}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
