export type CarStatus =
  | "In Stock"
  | "Reserved"
  | "Sold"
  | "Shipping";

export type BusinessType =
  | "Not decided"
  | "Local"
  | "Export";

export type VehicleOwnership =
  | "Mine Only"
  | "Me + Partner";

export type ExpensePayer =
  | "Me"
  | "Business Partner";

export type ExpenseCategory =
  | "Shakken"
  | "Fuel"
  | "Part Order"
  | "Transport/Delivery"
  | "Repair"
  | "Product"
  | "Custom Expense";

export type InvestorShare = 25 | 50;

export type CapitalTransactionType =
  | "Deposit"
  | "Return";

export type FundingStatus =
  | "Not Allocated"
  | "Allocated"
  | "Closed";

export type CustomerType =
  | ""
  | "Local"
  | "Export";

export type NameTransferStatus =
  | "Pending"
  | "Completed"
  | "Not Applicable";

export type TimelineEventType =
  | "Vehicle Added"
  | "Vehicle Updated"
  | "Expense Added"
  | "Expense Updated"
  | "Expense Deleted"
  | "Vehicle Sold"
  | "Investment Allocated"
  | "Investment Closed"
  | "Note Updated";

export type Expense = {
  id: number;
  name: string;
  amount: string;
  paidBy: ExpensePayer;
  category?: ExpenseCategory | string;
  date?: string;
  notes?: string;
};

export type CapitalTransaction = {
  id: number;
  type: CapitalTransactionType;
  businessType: "Local" | "Export";
  amount: string;
  date: string;
  notes: string;
};

export type Investor = {
  id: number;
  name: string;
  profitShare: InvestorShare;
  transactions: CapitalTransaction[];
};

export type TimelineEvent = {
  id: number;
  type: TimelineEventType;
  title: string;
  description: string;
  date: string;
  amount?: string;
};

export type Car = {
  id: number;

  make: string;
  model: string;
  year: string;

  purchaseDate: string;
  saleDate: string;

  bidPrice: string;
  auctionFinalPrice: string;
  salePrice: string;
  targetProfit: string;

  status: CarStatus;
  saleType: BusinessType;
  ownership: VehicleOwnership;

  investorId: number | null;
  fundingStatus: FundingStatus;

  notes: string;

  buyerName: string;
  customerType: CustomerType;
  nameTransferStatus: NameTransferStatus;
  nameTransferDate: string;

  expenses: Expense[];
  timeline: TimelineEvent[];
};