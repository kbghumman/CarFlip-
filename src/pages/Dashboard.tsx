import { useMemo, useState } from "react";
import StatCard from "../components/StatCard";

type CarStatus = "In Stock" | "Reserved" | "Sold" | "Shipping";
type SaleType = "Not decided" | "Local" | "Export";
type VehicleOwnership = "Mine Only" | "Me + Partner";
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
  ownership?: VehicleOwnership;
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
      ownership:
        car.ownership === "Mine Only"
          ? "Mine Only"
          : "Me + Partner",
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

  const isPartnered =
    car.ownership === "Me + Partner";

  const partnerProfit = isPartnered
    ? netProfit * 0.5
    : 0;

  const yourSideProfit = isPartnered
    ? netProfit * 0.5
    : netProfit;

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

  const inventoryValue = cars
    .filter(
      (car) =>
        car.status !== "Sold" &&
        Number(car.auctionFinalPrice) > 0
    )
    .reduce(
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

  const panelStyle = {
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)",
    padding: 22,
    borderRadius: 22,
    border: "1px solid rgba(15, 23, 42, 0.07)",
    boxShadow: "0 20px 50px -24px rgba(15, 23, 42, 0.28)",
  };

  const summaryBoxStyle = {
    background: "rgba(248, 250, 252, 0.92)",
    border: "1px solid rgba(148, 163, 184, 0.24)",
    padding: 16,
    borderRadius: 16,
  };

  const tableRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    padding: "12px 0",
    borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
    flexWrap: "wrap" as const,
    color: "#334155",
    fontSize: 14,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #111827 42%, #2563eb 100%)",
          borderRadius: 28,
          padding: "28px 30px",
          color: "white",
          boxShadow: "0 24px 80px -24px rgba(15, 23, 42, 0.55)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                padding: "6px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.16)",
                color: "rgba(255,255,255,0.9)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              CarFlip command center
            </div>

            <h1
              style={{
                margin: "10px 0 8px",
                color: "white",
                fontSize: 34,
                lineHeight: 1.05,
              }}
            >
              Dashboard
            </h1>

            <p
              style={{
                color: "rgba(255,255,255,0.82)",
                margin: 0,
                maxWidth: 620,
                lineHeight: 1.6,
              }}
            >
              Financial and operational overview of your
              vehicle flipping business, designed for fast
              decision-making.
            </p>
          </div>

          <div
            style={{
              minWidth: 220,
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: 20,
              padding: 18,
              backdropFilter: "blur(12px)",
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
              Selected period
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>
              {monthNames[selectedMonth]} {selectedYear}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.76)", marginTop: 8 }}>
              {alertCount > 0
                ? `${alertCount} attention points to review`
                : "Everything is looking healthy"}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <StatCard
          title="Cars in Stock"
          value={carsInStock}
          color="#2563eb"
        />

        <StatCard
          title="Inventory Value"
          value={formatYen(inventoryValue)}
          color="#7c3aed"
        />

        <StatCard
          title="Total Sales"
          value={formatYen(totalSales)}
          color="#0891b2"
        />

        <StatCard
          title="Total Net Profit"
          value={formatYen(totalNetProfit)}
          color={
            totalNetProfit >= 0
              ? "#16a34a"
              : "#dc2626"
          }
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
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
          color="#16a34a"
        />

        <StatCard
          title="Investor Capital"
          value={formatYen(totalCapitalAvailable)}
          color="#2563eb"
        />
      </div>

      <div style={{ ...panelStyle, marginTop: 4 }}>
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
            <h2 style={{ margin: 0, color: "#0f172a" }}>
              Monthly Statistics
            </h2>

            <p
              style={{
                color: "#64748b",
                marginBottom: 0,
                marginTop: 4,
              }}
            >
              Money moving in and out during the selected
              month
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <select
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(
                  Number(event.target.value)
                )
              }
              style={{
                padding: "10px 12px",
                border: "1px solid rgba(148, 163, 184, 0.35)",
                borderRadius: 10,
                fontWeight: 600,
                background: "white",
                color: "#0f172a",
              }}
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(event) =>
                setSelectedYear(
                  Number(event.target.value)
                )
              }
              style={{
                padding: "10px 12px",
                border: "1px solid rgba(148, 163, 184, 0.35)",
                borderRadius: 10,
                fontWeight: 600,
                background: "white",
                color: "#0f172a",
              }}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
            marginTop: 20,
          }}
        >
          <div
            style={{
              ...summaryBoxStyle,
              background: "#f0fdf4",
            }}
          >
            <div style={{ color: "#64748b" }}>
              Total Money In
            </div>

            <strong
              style={{
                display: "block",
                fontSize: 24,
                marginTop: 7,
                color: "#16a34a",
              }}
            >
              {formatYen(monthlyMoneyIn)}
            </strong>
          </div>

          <div
            style={{
              ...summaryBoxStyle,
              background: "#fef2f2",
            }}
          >
            <div style={{ color: "#64748b" }}>
              Total Money Out
            </div>

            <strong
              style={{
                display: "block",
                fontSize: 24,
                marginTop: 7,
                color: "#dc2626",
              }}
            >
              {formatYen(monthlyMoneyOut)}
            </strong>
          </div>

          <div
            style={{
              ...summaryBoxStyle,
              background:
                monthlyCashMovement >= 0
                  ? "#eff6ff"
                  : "#fff7ed",
            }}
          >
            <div style={{ color: "#64748b" }}>
              Net Cash Movement
            </div>

            <strong
              style={{
                display: "block",
                fontSize: 24,
                marginTop: 7,
                color:
                  monthlyCashMovement >= 0
                    ? "#2563eb"
                    : "#ea580c",
              }}
            >
              {formatYen(monthlyCashMovement)}
            </strong>
          </div>

          <div
            style={{
              ...summaryBoxStyle,
              background:
                monthlyNetProfit >= 0
                  ? "#f0fdf4"
                  : "#fef2f2",
            }}
          >
            <div style={{ color: "#64748b" }}>
              Trading Profit
            </div>

            <strong
              style={{
                display: "block",
                fontSize: 24,
                marginTop: 7,
                color:
                  monthlyNetProfit >= 0
                    ? "#16a34a"
                    : "#dc2626",
              }}
            >
              {formatYen(monthlyNetProfit)}
            </strong>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginTop: 16,
          }}
        >
          <div style={summaryBoxStyle}>
            <h3 style={{ marginTop: 0, color: "#0f172a" }}>
              Money Received
            </h3>

            <div style={tableRowStyle}>
              <span>Vehicle sales</span>
              <strong>{formatYen(monthlyVehicleSales)}</strong>
            </div>

            <div style={tableRowStyle}>
              <span>Investor deposits</span>
              <strong>{formatYen(monthlyInvestorDeposits)}</strong>
            </div>

            <div
              style={{
                ...tableRowStyle,
                borderBottom: "none",
                fontSize: 15,
              }}
            >
              <strong>Total received</strong>
              <strong style={{ color: "#16a34a" }}>
                {formatYen(monthlyMoneyIn)}
              </strong>
            </div>
          </div>

          <div style={summaryBoxStyle}>
            <h3 style={{ marginTop: 0, color: "#0f172a" }}>
              Money Paid Out
            </h3>

            <div style={tableRowStyle}>
              <span>Vehicle purchases</span>
              <strong>{formatYen(monthlyVehiclePurchases)}</strong>
            </div>

            <div style={tableRowStyle}>
              <span>Vehicle expenses</span>
              <strong>{formatYen(monthlyExpenses)}</strong>
            </div>

            <div style={tableRowStyle}>
              <span>Investor capital returned</span>
              <strong>{formatYen(monthlyCapitalReturned)}</strong>
            </div>

            <div
              style={{
                ...tableRowStyle,
                borderBottom: "none",
                fontSize: 15,
              }}
            >
              <strong>Total paid out</strong>
              <strong style={{ color: "#dc2626" }}>
                {formatYen(monthlyMoneyOut)}
              </strong>
            </div>
          </div>
        </div>

        <div
          style={{
            ...summaryBoxStyle,
            marginTop: 16,
            background: "#fafafa",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#0f172a" }}>
            Monthly Profit Distribution
          </h3>

          <div style={tableRowStyle}>
            <span>Vehicles sold</span>
            <strong>{monthlySoldCars.length}</strong>
          </div>

          <div style={tableRowStyle}>
            <span>Total trading profit</span>
            <strong>{formatYen(monthlyNetProfit)}</strong>
          </div>

          <div style={tableRowStyle}>
            <span>Business partner’s share</span>
            <strong>{formatYen(monthlyPartnerProfit)}</strong>
          </div>

          <div style={tableRowStyle}>
            <span>Investors’ combined share</span>
            <strong>{formatYen(monthlyInvestorProfit)}</strong>
          </div>

          <div
            style={{
              ...tableRowStyle,
              borderBottom: "none",
            }}
          >
            <span>Your final profit</span>
            <strong style={{ color: "#2563eb" }}>
              {formatYen(monthlyYourProfit)}
            </strong>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 14,
            marginTop: 16,
          }}
        >
          <div
            style={{
              ...summaryBoxStyle,
              background: "#eff6ff",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#0f172a" }}>
              Local Trading
            </h3>

            <p>
              <strong>Sales:</strong>{" "}
              {formatYen(monthlyLocalSales)}
            </p>

            <p>
              <strong>Profit:</strong>{" "}
              {formatYen(monthlyLocalProfit)}
            </p>
          </div>

          <div
            style={{
              ...summaryBoxStyle,
              background: "#f5f3ff",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#0f172a" }}>
              Export Trading
            </h3>

            <p>
              <strong>Sales:</strong>{" "}
              {formatYen(monthlyExportSales)}
            </p>

            <p>
              <strong>Profit:</strong>{" "}
              {formatYen(monthlyExportProfit)}
            </p>
          </div>
        </div>
      </div>

      <div style={{ ...panelStyle, marginTop: 4 }}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>
          Profit Distribution by Investor
        </h2>

        <p style={{ color: "#64748b" }}>
          Separate lifetime and selected-month results for every investor
        </p>

        {investorProfitSummaries.length === 0 ? (
          <p style={{ color: "#334155" }}>No investors have been added yet.</p>
        ) : (
          investorProfitSummaries.map((summary) => {
            const localCapital =
              getAvailableCapital(summary.investor, "Local");

            const exportCapital =
              getAvailableCapital(summary.investor, "Export");

            return (
              <div
                key={summary.investor.id}
                style={{
                  border: "1px solid rgba(148, 163, 184, 0.22)",
                  borderRadius: 18,
                  padding: 18,
                  marginBottom: 16,
                  background: "rgba(255,255,255,0.9)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 15,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: 7, color: "#0f172a" }}>
                      {summary.investor.name}
                    </h3>

                    <span
                      style={{
                        background: "#ede9fe",
                        color: "#5b21b6",
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {summary.investor.profitShare}% of your profit side
                    </span>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#64748b", fontSize: 14 }}>
                      Total profit earned
                    </div>

                    <strong
                      style={{
                        display: "block",
                        color: "#7c3aed",
                        fontSize: 23,
                        marginTop: 4,
                      }}
                    >
                      {formatYen(summary.totalProfit)}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: 12,
                    marginTop: 18,
                  }}
                >
                  <div style={summaryBoxStyle}>
                    <div style={{ color: "#64748b" }}>This month</div>

                    <strong
                      style={{
                        display: "block",
                        fontSize: 20,
                        marginTop: 5,
                        color: "#7c3aed",
                      }}
                    >
                      {formatYen(summary.monthlyProfit)}
                    </strong>

                    <div style={{ color: "#64748b", marginTop: 5, fontSize: 14 }}>
                      {summary.monthlyCars} vehicles
                    </div>
                  </div>

                  <div style={summaryBoxStyle}>
                    <div style={{ color: "#64748b" }}>Lifetime local profit</div>

                    <strong
                      style={{
                        display: "block",
                        fontSize: 20,
                        marginTop: 5,
                      }}
                    >
                      {formatYen(summary.totalLocalProfit)}
                    </strong>
                  </div>

                  <div style={summaryBoxStyle}>
                    <div style={{ color: "#64748b" }}>Lifetime export profit</div>

                    <strong
                      style={{
                        display: "block",
                        fontSize: 20,
                        marginTop: 5,
                      }}
                    >
                      {formatYen(summary.totalExportProfit)}
                    </strong>
                  </div>

                  <div style={summaryBoxStyle}>
                    <div style={{ color: "#64748b" }}>Total vehicles</div>

                    <strong
                      style={{
                        display: "block",
                        fontSize: 20,
                        marginTop: 5,
                      }}
                    >
                      {summary.totalCars}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  <div
                    style={{
                      ...summaryBoxStyle,
                      background: "#eff6ff",
                    }}
                  >
                    <div style={{ color: "#64748b" }}>Local capital available</div>

                    <strong
                      style={{
                        display: "block",
                        marginTop: 5,
                        color: "#2563eb",
                      }}
                    >
                      {formatYen(localCapital)}
                    </strong>

                    <div style={{ color: "#64748b", marginTop: 7, fontSize: 14 }}>
                      Monthly local profit: {formatYen(summary.monthlyLocalProfit)}
                    </div>
                  </div>

                  <div
                    style={{
                      ...summaryBoxStyle,
                      background: "#f5f3ff",
                    }}
                  >
                    <div style={{ color: "#64748b" }}>Export capital available</div>

                    <strong
                      style={{
                        display: "block",
                        marginTop: 5,
                        color: "#7c3aed",
                      }}
                    >
                      {formatYen(exportCapital)}
                    </strong>

                    <div style={{ color: "#64748b", marginTop: 7, fontSize: 14 }}>
                      Monthly export profit: {formatYen(summary.monthlyExportProfit)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          marginTop: 4,
        }}
      >
        <div style={panelStyle}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>
            Inventory Status
          </h2>

          <div style={tableRowStyle}>
            <span>In stock</span>
            <strong>{carsInStock}</strong>
          </div>

          <div style={tableRowStyle}>
            <span>Reserved</span>
            <strong>{carsReserved}</strong>
          </div>

          <div style={tableRowStyle}>
            <span>Shipping</span>
            <strong>{carsShipping}</strong>
          </div>

          <div
            style={{
              ...tableRowStyle,
              borderBottom: "none",
            }}
          >
            <span>Sold</span>
            <strong>{carsSold}</strong>
          </div>
        </div>

        <div style={panelStyle}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>
            Expense Payments
          </h2>

          <div style={tableRowStyle}>
            <span>Paid by me</span>
            <strong>{formatYen(totalExpensesPaidByMe)}</strong>
          </div>

          <div
            style={{
              ...tableRowStyle,
              borderBottom: "none",
            }}
          >
            <span>Paid by partner</span>
            <strong>{formatYen(totalExpensesPaidByPartner)}</strong>
          </div>
        </div>

        <div style={panelStyle}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>
            Business Alerts
            {alertCount > 0 && (
              <span
                style={{
                  background: "#dc2626",
                  color: "white",
                  borderRadius: 999,
                  padding: "3px 9px",
                  fontSize: 14,
                  marginLeft: 9,
                }}
              >
                {alertCount}
              </span>
            )}
          </h2>

          {alertCount === 0 ? (
            <p style={{ color: "#166534" }}>
              Everything looks up to date.
            </p>
          ) : (
            <>
              {carsMissingPurchaseDate.length > 0 && (
                <p>
                  ⚠ Cars missing purchase dates: <strong>{carsMissingPurchaseDate.length}</strong>
                </p>
              )}

              {soldCarsMissingSaleDate.length > 0 && (
                <p>
                  ⚠ Sold cars missing sale dates: <strong>{soldCarsMissingSaleDate.length}</strong>
                </p>
              )}

              {carsMissingBusinessType.length > 0 && (
                <p>
                  ⚠ Cars missing business type: <strong>{carsMissingBusinessType.length}</strong>
                </p>
              )}

              {oldStockCars.length > 0 && (
                <p>
                  ⚠ Cars held for more than 60 days: <strong>{oldStockCars.length}</strong>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}