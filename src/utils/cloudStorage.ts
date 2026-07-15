import type {
  Car,
  Expense,
  Investor,
  TimelineEvent,
} from "../types";
import { supabase } from "./supabase";

const CARS_STORAGE_KEY = "cars";
const INVESTORS_STORAGE_KEY = "investors";
const LAST_SYNCED_CARS_KEY = "wildspeed_last_synced_cars";
const LAST_SYNCED_INVESTORS_KEY = "wildspeed_last_synced_investors";
const PENDING_SYNC_KEY = "wildspeed_direct_sync_pending";

let syncQueue: Promise<void> = Promise.resolve();

function readArray<T>(key: string): T[] {
  try {
    const value = localStorage.getItem(key);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

function stable(value: unknown) {
  return JSON.stringify(value);
}

function changed<T>(before: T | undefined, after: T) {
  return !before || stable(before) !== stable(after);
}

function asNumberString(value: unknown) {
  if (value === "" || value === null || value === undefined) return 0;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function asDate(value: string | undefined) {
  return value || null;
}

async function getUserId() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.user.id ?? null;
}

function carRow(userId: string, car: Car) {
  return {
    user_id: userId,
    app_id: car.id,
    make: car.make,
    model: car.model,
    year: car.year,
    purchase_date: asDate(car.purchaseDate),
    sale_date: asDate(car.saleDate),
    bid_price: asNumberString(car.bidPrice),
    auction_final_price: asNumberString(car.auctionFinalPrice),
    sale_price: asNumberString(car.salePrice),
    target_profit: asNumberString(car.targetProfit),
    status: car.status,
    sale_type: car.saleType,
    ownership: car.ownership,
    investor_app_id: car.investorId,
    funding_status: car.fundingStatus,
    notes: car.notes,
    buyer_name: car.buyerName,
    customer_type: car.customerType,
    name_transfer_status: car.nameTransferStatus,
    name_transfer_date: asDate(car.nameTransferDate),
    timeline: car.timeline,
    updated_at: new Date().toISOString(),
  };
}

function expenseRow(userId: string, carId: number, expense: Expense) {
  return {
    user_id: userId,
    app_id: expense.id,
    car_app_id: carId,
    name: expense.name,
    amount: asNumberString(expense.amount),
    paid_by: expense.paidBy,
    category: expense.category || "Custom Expense",
    expense_date: asDate(expense.date),
    notes: expense.notes || "",
  };
}

function investorRow(userId: string, investor: Investor) {
  return {
    user_id: userId,
    app_id: investor.id,
    name: investor.name,
    profit_share: investor.profitShare,
  };
}

function transactionRow(userId: string, investorId: number, transaction: Investor["transactions"][number]) {
  return {
    user_id: userId,
    app_id: transaction.id,
    investor_app_id: investorId,
    transaction_type: transaction.type,
    business_type: transaction.businessType,
    amount: asNumberString(transaction.amount),
    transaction_date: transaction.date,
    notes: transaction.notes,
  };
}

async function syncCarsDirect(
  userId: string,
  previousCars: Car[],
  nextCars: Car[]
) {
  const previousById = new Map(previousCars.map((car) => [car.id, car]));
  const nextById = new Map(nextCars.map((car) => [car.id, car]));

  const changedCars = nextCars.filter((car) => changed(previousById.get(car.id), car));
  const deletedCarIds = previousCars
    .filter((car) => !nextById.has(car.id))
    .map((car) => car.id);

  if (changedCars.length > 0) {
    const { error } = await supabase
      .from("cars")
      .upsert(changedCars.map((car) => carRow(userId, car)), {
        onConflict: "user_id,app_id",
      });
    if (error) throw error;
  }

  if (deletedCarIds.length > 0) {
    const { error: expenseDeleteError } = await supabase
      .from("expenses")
      .delete()
      .eq("user_id", userId)
      .in("car_app_id", deletedCarIds);
    if (expenseDeleteError) throw expenseDeleteError;

    const { error } = await supabase
      .from("cars")
      .delete()
      .eq("user_id", userId)
      .in("app_id", deletedCarIds);
    if (error) throw error;
  }

  for (const car of changedCars) {
    const oldExpenses = previousById.get(car.id)?.expenses ?? [];
    const oldExpenseIds = new Set(oldExpenses.map((expense) => expense.id));
    const newExpenseIds = new Set(car.expenses.map((expense) => expense.id));

    const changedExpenses = car.expenses.filter((expense) => {
      const oldExpense = oldExpenses.find((item) => item.id === expense.id);
      return changed(oldExpense, expense);
    });

    const deletedExpenseIds = [...oldExpenseIds].filter((id) => !newExpenseIds.has(id));

    if (changedExpenses.length > 0) {
      const { error } = await supabase
        .from("expenses")
        .upsert(
          changedExpenses.map((expense) => expenseRow(userId, car.id, expense)),
          { onConflict: "user_id,app_id" }
        );
      if (error) throw error;
    }

    if (deletedExpenseIds.length > 0) {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("user_id", userId)
        .in("app_id", deletedExpenseIds);
      if (error) throw error;
    }
  }
}

async function syncInvestorsDirect(
  userId: string,
  previousInvestors: Investor[],
  nextInvestors: Investor[]
) {
  const previousById = new Map(previousInvestors.map((investor) => [investor.id, investor]));
  const nextById = new Map(nextInvestors.map((investor) => [investor.id, investor]));

  const changedInvestors = nextInvestors.filter((investor) =>
    changed(previousById.get(investor.id), investor)
  );
  const deletedInvestorIds = previousInvestors
    .filter((investor) => !nextById.has(investor.id))
    .map((investor) => investor.id);

  if (changedInvestors.length > 0) {
    const { error } = await supabase
      .from("investors")
      .upsert(changedInvestors.map((investor) => investorRow(userId, investor)), {
        onConflict: "user_id,app_id",
      });
    if (error) throw error;
  }

  if (deletedInvestorIds.length > 0) {
    const { error: transactionDeleteError } = await supabase
      .from("capital_transactions")
      .delete()
      .eq("user_id", userId)
      .in("investor_app_id", deletedInvestorIds);
    if (transactionDeleteError) throw transactionDeleteError;

    const { error } = await supabase
      .from("investors")
      .delete()
      .eq("user_id", userId)
      .in("app_id", deletedInvestorIds);
    if (error) throw error;
  }

  for (const investor of changedInvestors) {
    const oldTransactions = previousById.get(investor.id)?.transactions ?? [];
    const oldTransactionIds = new Set(oldTransactions.map((transaction) => transaction.id));
    const newTransactionIds = new Set(investor.transactions.map((transaction) => transaction.id));

    const changedTransactions = investor.transactions.filter((transaction) => {
      const oldTransaction = oldTransactions.find((item) => item.id === transaction.id);
      return changed(oldTransaction, transaction);
    });

    const deletedTransactionIds = [...oldTransactionIds].filter(
      (id) => !newTransactionIds.has(id)
    );

    if (changedTransactions.length > 0) {
      const { error } = await supabase
        .from("capital_transactions")
        .upsert(
          changedTransactions.map((transaction) =>
            transactionRow(userId, investor.id, transaction)
          ),
          { onConflict: "user_id,app_id" }
        );
      if (error) throw error;
    }

    if (deletedTransactionIds.length > 0) {
      const { error } = await supabase
        .from("capital_transactions")
        .delete()
        .eq("user_id", userId)
        .in("app_id", deletedTransactionIds);
      if (error) throw error;
    }
  }
}

async function performDirectSync() {
  const userId = await getUserId();
  if (!userId) return;

  const currentCars = readArray<Car>(CARS_STORAGE_KEY);
  const currentInvestors = readArray<Investor>(INVESTORS_STORAGE_KEY);
  const previousCars = readArray<Car>(LAST_SYNCED_CARS_KEY);
  const previousInvestors = readArray<Investor>(LAST_SYNCED_INVESTORS_KEY);

  await syncCarsDirect(userId, previousCars, currentCars);
  await syncInvestorsDirect(userId, previousInvestors, currentInvestors);

  writeArray(LAST_SYNCED_CARS_KEY, currentCars);
  writeArray(LAST_SYNCED_INVESTORS_KEY, currentInvestors);
  localStorage.setItem(PENDING_SYNC_KEY, "false");
}

export function syncAppStateToCloud() {
  localStorage.setItem(PENDING_SYNC_KEY, "true");
  syncQueue = syncQueue
    .then(performDirectSync)
    .catch((error) => {
      console.error("Direct Supabase save failed:", error);
      localStorage.setItem(PENDING_SYNC_KEY, "true");
    });
  return syncQueue;
}

function mapTimeline(value: unknown): TimelineEvent[] {
  return Array.isArray(value) ? (value as TimelineEvent[]) : [];
}

async function loadDirectState(userId: string) {
  const [carsResult, expensesResult, investorsResult, transactionsResult] =
    await Promise.all([
      supabase.from("cars").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("expenses").select("*").eq("user_id", userId),
      supabase.from("investors").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("capital_transactions").select("*").eq("user_id", userId),
    ]);

  for (const result of [carsResult, expensesResult, investorsResult, transactionsResult]) {
    if (result.error) throw result.error;
  }

  const expensesByCar = new Map<number, Expense[]>();
  for (const row of expensesResult.data ?? []) {
    if (typeof row.car_app_id !== "number" || typeof row.app_id !== "number") continue;
    const expense: Expense = {
      id: row.app_id,
      name: row.name ?? "",
      amount: String(row.amount ?? ""),
      paidBy: row.paid_by === "Business Partner" ? "Business Partner" : "Me",
      category: row.category ?? "Custom Expense",
      date: row.expense_date ?? "",
      notes: row.notes ?? "",
    };
    const list = expensesByCar.get(row.car_app_id) ?? [];
    list.push(expense);
    expensesByCar.set(row.car_app_id, list);
  }

  const cars: Car[] = (carsResult.data ?? [])
    .filter((row) => typeof row.app_id === "number")
    .map((row) => ({
      id: row.app_id,
      make: row.make ?? "",
      model: row.model ?? "",
      year: row.year ?? "",
      purchaseDate: row.purchase_date ?? "",
      saleDate: row.sale_date ?? "",
      bidPrice: String(row.bid_price ?? ""),
      auctionFinalPrice: String(row.auction_final_price ?? ""),
      salePrice: String(row.sale_price ?? ""),
      targetProfit: String(row.target_profit ?? ""),
      status: row.status ?? "In Stock",
      saleType: row.sale_type ?? "Not decided",
      ownership: row.ownership ?? "Me + Partner",
      investorId: typeof row.investor_app_id === "number" ? row.investor_app_id : null,
      fundingStatus: row.funding_status ?? "Not Allocated",
      notes: row.notes ?? "",
      buyerName: row.buyer_name ?? "",
      customerType: row.customer_type ?? "",
      nameTransferStatus: row.name_transfer_status ?? "Pending",
      nameTransferDate: row.name_transfer_date ?? "",
      expenses: expensesByCar.get(row.app_id) ?? [],
      timeline: mapTimeline(row.timeline),
    }));

  const transactionsByInvestor = new Map<number, Investor["transactions"]>();
  for (const row of transactionsResult.data ?? []) {
    if (typeof row.investor_app_id !== "number" || typeof row.app_id !== "number") continue;
    const transaction: Investor["transactions"][number] = {
      id: row.app_id,
      type: row.transaction_type === "Return" ? "Return" : "Deposit",
      businessType: row.business_type === "Export" ? "Export" : "Local",
      amount: String(row.amount ?? ""),
      date: row.transaction_date ?? "",
      notes: row.notes ?? "",
    };
    const list = transactionsByInvestor.get(row.investor_app_id) ?? [];
    list.push(transaction);
    transactionsByInvestor.set(row.investor_app_id, list);
  }

  const investors: Investor[] = (investorsResult.data ?? [])
    .filter((row) => typeof row.app_id === "number")
    .map((row) => ({
      id: row.app_id,
      name: row.name ?? "",
      profitShare: row.profit_share === 50 ? 50 : 25,
      transactions: transactionsByInvestor.get(row.app_id) ?? [],
    }));

  return { cars, investors };
}

async function loadLegacyAppState(userId: string) {
  const { data, error } = await supabase
    .from("app_state")
    .select("cars, investors")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return {
    cars: Array.isArray(data?.cars) ? (data.cars as Car[]) : [],
    investors: Array.isArray(data?.investors) ? (data.investors as Investor[]) : [],
  };
}

export async function hydrateAppStateFromCloud() {
  const userId = await getUserId();
  if (!userId) return;

  if (localStorage.getItem(PENDING_SYNC_KEY) === "true") {
    await syncAppStateToCloud();
    return;
  }

  let direct = await loadDirectState(userId);

  if (direct.cars.length === 0 && direct.investors.length === 0) {
    const legacy = await loadLegacyAppState(userId);
    if (legacy.cars.length > 0 || legacy.investors.length > 0) {
      writeArray(CARS_STORAGE_KEY, legacy.cars);
      writeArray(INVESTORS_STORAGE_KEY, legacy.investors);
      writeArray(LAST_SYNCED_CARS_KEY, []);
      writeArray(LAST_SYNCED_INVESTORS_KEY, []);
      await syncAppStateToCloud();
      direct = legacy;
    }
  }

  writeArray(CARS_STORAGE_KEY, direct.cars);
  writeArray(INVESTORS_STORAGE_KEY, direct.investors);
  writeArray(LAST_SYNCED_CARS_KEY, direct.cars);
  writeArray(LAST_SYNCED_INVESTORS_KEY, direct.investors);
}

export async function flushCloudSync() {
  await syncAppStateToCloud();
}

export async function clearCloudSessionCache() {
  localStorage.removeItem(CARS_STORAGE_KEY);
  localStorage.removeItem(INVESTORS_STORAGE_KEY);
  localStorage.removeItem(LAST_SYNCED_CARS_KEY);
  localStorage.removeItem(LAST_SYNCED_INVESTORS_KEY);
  localStorage.removeItem(PENDING_SYNC_KEY);
}
