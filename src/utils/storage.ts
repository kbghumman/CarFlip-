import type {
  Car,
  Expense,
  Investor,
  TimelineEvent,
} from "../types";

const CARS_STORAGE_KEY = "cars";
const INVESTORS_STORAGE_KEY = "investors";

function createSafeId() {
  return (
    Date.now() +
    Math.floor(Math.random() * 100000)
  );
}

function normalizeExpense(
  expense: Partial<Expense>
): Expense {
  return {
    id:
      typeof expense.id === "number"
        ? expense.id
        : createSafeId(),

    name: expense.name || "",
    amount: expense.amount || "",

    paidBy:
      expense.paidBy === "Business Partner"
        ? "Business Partner"
        : "Me",

    category:
      expense.category || "Custom Expense",

    date: expense.date || "",
    notes: expense.notes || "",
  };
}

function normalizeTimelineEvent(
  event: Partial<TimelineEvent>
): TimelineEvent {
  return {
    id:
      typeof event.id === "number"
        ? event.id
        : createSafeId(),

    type:
      event.type || "Vehicle Updated",

    title:
      event.title || "Vehicle activity",

    description:
      event.description || "",

    date:
      event.date ||
      new Date().toISOString(),

    amount:
      event.amount || undefined,
  };
}

export function loadCars(): Car[] {
  const savedCars =
    localStorage.getItem(
      CARS_STORAGE_KEY
    );

  if (!savedCars) {
    return [];
  }

  try {
    const parsedCars =
      JSON.parse(savedCars);

    if (!Array.isArray(parsedCars)) {
      return [];
    }

    return parsedCars
      .filter(Boolean)
      .map((car): Car => {
        const customerType =
          car.customerType === "Local" ||
          car.customerType === "Export"
            ? car.customerType
            : "";

        let nameTransferStatus:
          Car["nameTransferStatus"];

        if (customerType === "Export") {
          nameTransferStatus =
            "Not Applicable";
        } else if (
          car.nameTransferStatus ===
          "Completed"
        ) {
          nameTransferStatus =
            "Completed";
        } else {
          nameTransferStatus =
            "Pending";
        }

        return {
          id:
            typeof car.id === "number"
              ? car.id
              : createSafeId(),

          make: car.make || "",
          model: car.model || "",
          year: car.year || "",

          purchaseDate:
            car.purchaseDate || "",

          saleDate:
            car.saleDate || "",

          bidPrice:
            car.bidPrice || "",

          auctionFinalPrice:
            car.auctionFinalPrice ||
            car.purchasePrice ||
            "",

          salePrice:
            car.salePrice || "",

          targetProfit:
            car.targetProfit || "",

          status:
            car.status === "Reserved" ||
            car.status === "Sold" ||
            car.status === "Shipping"
              ? car.status
              : "In Stock",

          saleType:
            car.saleType === "Local" ||
            car.saleType === "Export"
              ? car.saleType
              : "Not decided",

          ownership:
            car.ownership === "Mine Only"
              ? "Mine Only"
              : "Me + Partner",

          investorId:
            typeof car.investorId ===
            "number"
              ? car.investorId
              : null,

          fundingStatus:
            car.fundingStatus ===
              "Allocated" ||
            car.fundingStatus === "Closed"
              ? car.fundingStatus
              : "Not Allocated",

          notes: car.notes || "",

          buyerName:
            car.buyerName ||
            car.customerName ||
            "",

          customerType,

          nameTransferStatus,

          nameTransferDate:
            car.nameTransferDate || "",

          expenses:
            Array.isArray(car.expenses)
              ? car.expenses.map(
                  normalizeExpense
                )
              : [],

          timeline:
            Array.isArray(car.timeline)
              ? car.timeline.map(
                  normalizeTimelineEvent
                )
              : [],
        };
      });
  } catch (error) {
    console.error(
      "Could not load cars:",
      error
    );

    return [];
  }
}

export function saveCars(
  cars: Car[]
) {
  try {
    localStorage.setItem(
      CARS_STORAGE_KEY,
      JSON.stringify(cars)
    );
  } catch (error) {
    console.error(
      "Could not save cars:",
      error
    );
  }
}

export function loadInvestors():
  Investor[] {
  const savedInvestors =
    localStorage.getItem(
      INVESTORS_STORAGE_KEY
    );

  if (!savedInvestors) {
    return [];
  }

  try {
    const parsedInvestors =
      JSON.parse(savedInvestors);

    if (
      !Array.isArray(parsedInvestors)
    ) {
      return [];
    }

    return parsedInvestors
      .filter(Boolean)
      .map(
        (investor): Investor => ({
          id:
            typeof investor.id ===
            "number"
              ? investor.id
              : createSafeId(),

          name:
            investor.name || "",

          profitShare:
            investor.profitShare === 50
              ? 50
              : 25,

          transactions:
            Array.isArray(
              investor.transactions
            )
              ? investor.transactions
                  .filter(Boolean)
                  .map(
                    (transaction: {
                      id?: number;
                      type?: string;
                      businessType?: string;
                      amount?: string;
                      date?: string;
                      notes?: string;
                    }) => ({
                      id:
                        typeof transaction.id ===
                        "number"
                          ? transaction.id
                          : createSafeId(),

                      type:
                        transaction.type ===
                        "Return"
                          ? "Return"
                          : "Deposit",

                      businessType:
                        transaction.businessType ===
                        "Export"
                          ? "Export"
                          : "Local",

                      amount:
                        transaction.amount ||
                        "",

                      date:
                        transaction.date ||
                        "",

                      notes:
                        transaction.notes ||
                        "",
                    })
                  )
              : [],
        })
      );
  } catch (error) {
    console.error(
      "Could not load investors:",
      error
    );

    return [];
  }
}

export function saveInvestors(
  investors: Investor[]
) {
  try {
    localStorage.setItem(
      INVESTORS_STORAGE_KEY,
      JSON.stringify(investors)
    );
  } catch (error) {
    console.error(
      "Could not save investors:",
      error
    );
  }
}