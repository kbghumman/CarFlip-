import type {
  BusinessType,
  Car,
  ExpensePayer,
  Investor,
  VehicleOwnership,
} from "../types";

export function toNumber(
  value: string | number | undefined | null
) {
  const convertedValue = Number(value);

  return Number.isFinite(convertedValue)
    ? convertedValue
    : 0;
}

export function formatYen(
  value: string | number | undefined | null
) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export function getExpenseTotal(
  car: Car | undefined
) {
  if (!car || !Array.isArray(car.expenses)) {
    return 0;
  }

  return car.expenses.reduce(
    (total, expense) =>
      total + toNumber(expense?.amount),
    0
  );
}

export function getExpensesPaidBy(
  car: Car | undefined,
  payer: ExpensePayer
) {
  if (!car || !Array.isArray(car.expenses)) {
    return 0;
  }

  return car.expenses
    .filter(
      (expense) =>
        expense?.paidBy === payer
    )
    .reduce(
      (total, expense) =>
        total + toNumber(expense?.amount),
      0
    );
}

export function getTotalCost(
  car: Car | undefined
) {
  if (!car) {
    return 0;
  }

  return (
    toNumber(car.auctionFinalPrice) +
    getExpenseTotal(car)
  );
}

export function getNetProfit(
  car: Car | undefined
) {
  if (!car) {
    return 0;
  }

  return (
    toNumber(car.salePrice) -
    getTotalCost(car)
  );
}

export function findInvestor(
  car: Car | undefined,
  investors: Investor[] | undefined
) {
  if (
    !car ||
    car.investorId === null ||
    car.investorId === undefined ||
    !Array.isArray(investors)
  ) {
    return undefined;
  }

  return investors.find(
    (investor) =>
      investor &&
      investor.id === car.investorId
  );
}

export function getYourOwnershipPercentage(
  ownership: VehicleOwnership | undefined
) {
  return ownership === "Mine Only"
    ? 1
    : 0.5;
}

export function getPartnerOwnershipPercentage(
  ownership: VehicleOwnership | undefined
) {
  return ownership === "Me + Partner"
    ? 0.5
    : 0;
}

export function getInvestorAllocation(
  car: Car | undefined
) {
  if (
    !car ||
    car.investorId === null ||
    car.investorId === undefined
  ) {
    return 0;
  }

  const yourOwnershipPercentage =
    getYourOwnershipPercentage(
      car.ownership
    );

  return (
    toNumber(car.auctionFinalPrice) *
    yourOwnershipPercentage
  );
}

export function getProfitDistribution(
  car: Car | undefined,
  investors: Investor[] | undefined
) {
  const netProfit = getNetProfit(car);

  if (!car) {
    return {
      netProfit: 0,
      partnerProfit: 0,
      yourSideProfit: 0,
      investorProfit: 0,
      yourFinalProfit: 0,
    };
  }

  const partnerPercentage =
    getPartnerOwnershipPercentage(
      car.ownership
    );

  const yourSidePercentage =
    getYourOwnershipPercentage(
      car.ownership
    );

  const partnerProfit =
    netProfit * partnerPercentage;

  const yourSideProfit =
    netProfit * yourSidePercentage;

  const investor = findInvestor(
    car,
    investors
  );

  const investorProfit =
    investor && netProfit > 0
      ? yourSideProfit *
        (investor.profitShare / 100)
      : 0;

  const yourFinalProfit =
    yourSideProfit - investorProfit;

  return {
    netProfit,
    partnerProfit,
    yourSideProfit,
    investorProfit,
    yourFinalProfit,
  };
}

export function getInvestorDeposits(
  investor: Investor | undefined,
  businessType?: Exclude<
    BusinessType,
    "Not decided"
  >
) {
  if (
    !investor ||
    !Array.isArray(investor.transactions)
  ) {
    return 0;
  }

  return investor.transactions
    .filter((transaction) => {
      if (!transaction) {
        return false;
      }

      const correctTransaction =
        transaction.type === "Deposit";

      const correctBusiness =
        !businessType ||
        transaction.businessType ===
          businessType;

      return (
        correctTransaction &&
        correctBusiness
      );
    })
    .reduce(
      (total, transaction) =>
        total + toNumber(transaction.amount),
      0
    );
}

export function getInvestorReturns(
  investor: Investor | undefined,
  businessType?: Exclude<
    BusinessType,
    "Not decided"
  >
) {
  if (
    !investor ||
    !Array.isArray(investor.transactions)
  ) {
    return 0;
  }

  return investor.transactions
    .filter((transaction) => {
      if (!transaction) {
        return false;
      }

      const correctTransaction =
        transaction.type === "Return";

      const correctBusiness =
        !businessType ||
        transaction.businessType ===
          businessType;

      return (
        correctTransaction &&
        correctBusiness
      );
    })
    .reduce(
      (total, transaction) =>
        total + toNumber(transaction.amount),
      0
    );
}

export function getInvestorTotalCapital(
  investor: Investor | undefined,
  businessType?: Exclude<
    BusinessType,
    "Not decided"
  >
) {
  return (
    getInvestorDeposits(
      investor,
      businessType
    ) -
    getInvestorReturns(
      investor,
      businessType
    )
  );
}

export function getInvestorAllocatedCapital(
  investorId: number,
  cars: Car[] | undefined,
  businessType?: Exclude<
    BusinessType,
    "Not decided"
  >
) {
  if (!Array.isArray(cars)) {
    return 0;
  }

  return cars
    .filter((car) => {
      if (!car) {
        return false;
      }

      const belongsToInvestor =
        car.investorId === investorId;

      const correctBusiness =
        !businessType ||
        car.saleType === businessType;

      // Capital is tied up only while the car is unsold
      // and the investment remains allocated.
      const investmentIsOpen =
        car.fundingStatus === "Allocated" &&
        car.status !== "Sold";

      return (
        belongsToInvestor &&
        correctBusiness &&
        investmentIsOpen
      );
    })
    .reduce(
      (total, car) =>
        total + getInvestorAllocation(car),
      0
    );
}

export function getInvestorAvailableCapital(
  investor: Investor | undefined,
  cars: Car[] | undefined,
  businessType?: Exclude<
    BusinessType,
    "Not decided"
  >
) {
  if (!investor) {
    return 0;
  }

  const totalCapital =
    getInvestorTotalCapital(
      investor,
      businessType
    );

  const allocated =
    getInvestorAllocatedCapital(
      investor.id,
      cars,
      businessType
    );

  return totalCapital - allocated;
}

export function dateMatchesMonth(
  date: string | undefined,
  year: number,
  monthIndex: number
) {
  if (!date) {
    return false;
  }

  const [dateYear, dateMonth] =
    date.split("-").map(Number);

  if (
    !Number.isFinite(dateYear) ||
    !Number.isFinite(dateMonth)
  ) {
    return false;
  }

  return (
    dateYear === year &&
    dateMonth === monthIndex + 1
  );
}