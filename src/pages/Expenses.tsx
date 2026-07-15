import { useEffect, useState } from "react";

import { syncAppStateToCloud } from "../utils/cloudStorage";

type ExpensePayer = "Me" | "Business Partner";

type ExpenseCategory =
  | "Shakken"
  | "Fuel"
  | "Part Order"
  | "Transport/Delivery"
  | "Repair"
  | "Product";

type Expense = {
  id: number;
  name: string;
  amount: string;
  paidBy: ExpensePayer;
  category?: ExpenseCategory;
  date?: string;
  notes?: string;
};

type Car = {
  id: number;
  make: string;
  model: string;
  year: string;
  expenses: Expense[];
};

const expenseCategories: ExpenseCategory[] = [
  "Shakken",
  "Fuel",
  "Part Order",
  "Transport/Delivery",
  "Repair",
  "Product",
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
      expenses: Array.isArray(car.expenses) ? car.expenses : [],
    }));
  } catch {
    return [];
  }
}

function formatYen(value: string | number) {
  const numberValue = Number(value) || 0;

  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(numberValue);
}

function formatDate(date: string | undefined) {
  if (!date) {
    return "No date";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString();
}

function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return expenseCategories.includes(value as ExpenseCategory);
}

export default function Expenses() {
  const [cars, setCars] = useState<Car[]>(getSavedCars);

  const [selectedCarId, setSelectedCarId] = useState("");
  const [category, setCategory] =
    useState<ExpenseCategory>("Shakken");
  const [expenseName, setExpenseName] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<ExpensePayer>("Me");
  const [expenseDate, setExpenseDate] = useState("");
  const [notes, setNotes] = useState("");

  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(
    null
  );

  const [editingCarId, setEditingCarId] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem("cars", JSON.stringify(cars));
    void syncAppStateToCloud();
  }, [cars]);

  function saveExpense() {
    const carId = Number(selectedCarId);

    if (!carId) {
      alert("Please choose a car.");
      return;
    }

    if (!expenseName.trim()) {
      alert("Please enter an expense description.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }

    if (editingExpenseId !== null && editingCarId !== null) {
      setCars(
        cars.map((car) => {
          if (car.id !== editingCarId) {
            return car;
          }

          return {
            ...car,
            expenses: car.expenses.map((expense) => {
              if (expense.id !== editingExpenseId) {
                return expense;
              }

              return {
                ...expense,
                category,
                name: expenseName.trim(),
                amount,
                paidBy,
                date: expenseDate,
                notes: notes.trim(),
              };
            }),
          };
        })
      );
    } else {
      const newExpense: Expense = {
        id: Date.now(),
        category,
        name: expenseName.trim(),
        amount,
        paidBy,
        date: expenseDate,
        notes: notes.trim(),
      };

      setCars(
        cars.map((car) => {
          if (car.id !== carId) {
            return car;
          }

          return {
            ...car,
            expenses: [...car.expenses, newExpense],
          };
        })
      );
    }

    clearForm();
  }

  function startEditingExpense(car: Car, expense: Expense) {
    setSelectedCarId(String(car.id));

    setCategory(
      isExpenseCategory(expense.category)
        ? expense.category
        : "Product"
    );

    setExpenseName(expense.name);
    setAmount(expense.amount);
    setPaidBy(expense.paidBy);
    setExpenseDate(expense.date || "");
    setNotes(expense.notes || "");

    setEditingExpenseId(expense.id);
    setEditingCarId(car.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function deleteExpense(carId: number, expenseId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) {
      return;
    }

    setCars(
      cars.map((car) => {
        if (car.id !== carId) {
          return car;
        }

        return {
          ...car,
          expenses: car.expenses.filter(
            (expense) => expense.id !== expenseId
          ),
        };
      })
    );

    if (editingExpenseId === expenseId) {
      clearForm();
    }
  }

  function clearForm() {
    setSelectedCarId("");
    setCategory("Shakken");
    setExpenseName("");
    setAmount("");
    setPaidBy("Me");
    setExpenseDate("");
    setNotes("");
    setEditingExpenseId(null);
    setEditingCarId(null);
  }

  const allExpenses = cars.flatMap((car) =>
    car.expenses.map((expense) => ({
      car,
      expense,
    }))
  );

  const sortedExpenses = [...allExpenses].sort((a, b) => {
    const dateA = a.expense.date || "";
    const dateB = b.expense.date || "";

    return dateB.localeCompare(dateA);
  });

  const totalExpenses = allExpenses.reduce((total, item) => {
    return total + (Number(item.expense.amount) || 0);
  }, 0);

  const totalPaidByMe = allExpenses
    .filter((item) => item.expense.paidBy === "Me")
    .reduce((total, item) => {
      return total + (Number(item.expense.amount) || 0);
    }, 0);

  const totalPaidByPartner = allExpenses
    .filter((item) => item.expense.paidBy === "Business Partner")
    .reduce((total, item) => {
      return total + (Number(item.expense.amount) || 0);
    }, 0);

  const inputStyle = {
    width: "100%",
    padding: 12,
    marginBottom: 12,
    boxSizing: "border-box" as const,
    border: "1px solid rgba(148, 163, 184, 0.35)",
    borderRadius: 12,
    background: "rgba(255,255,255,0.96)",
    color: "#0f172a",
  };

  const buttonStyle = {
    color: "white",
    border: "none",
    padding: "10px 14px",
    borderRadius: 999,
    cursor: "pointer",
    fontWeight: 600,
  };

  return (
    <div>
      <h1 style={{ marginBottom: 5, color: "#0f172a" }}>Expenses</h1>

      <p style={{ color: "#6b7280", marginTop: 0 }}>
        Add and manage expenses for every vehicle
      </p>

      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)",
          padding: 22,
          borderRadius: 20,
          maxWidth: 760,
          marginTop: 20,
          boxShadow: "0 20px 50px -24px rgba(15, 23, 42, 0.28)",
          border: "1px solid rgba(148, 163, 184, 0.24)",
        }}
      >
        <h2 style={{ color: "#0f172a" }}>
          {editingExpenseId !== null ? "Edit Expense" : "Add Expense"}
        </h2>

        {cars.length === 0 ? (
          <p>You must add a car before you can record an expense.</p>
        ) : (
          <>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Choose car
            </label>

            <select
              value={selectedCarId}
              onChange={(event) =>
                setSelectedCarId(event.target.value)
              }
              disabled={editingExpenseId !== null}
              style={inputStyle}
            >
              <option value="">Select a car</option>

              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.year} {car.make} {car.model}
                </option>
              ))}
            </select>

            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Choose expense category
            </label>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              {expenseCategories.map((expenseCategory) => (
                <button
                  key={expenseCategory}
                  type="button"
                  onClick={() => setCategory(expenseCategory)}
                  style={{
                    border:
                      category === expenseCategory
                        ? "2px solid #2563eb"
                        : "1px solid #d1d5db",
                    background:
                      category === expenseCategory
                        ? "#dbeafe"
                        : "white",
                    color:
                      category === expenseCategory
                        ? "#1e40af"
                        : "#374151",
                    padding: "9px 13px",
                    borderRadius: 20,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {expenseCategory}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Description, for example Front bumper repair"
              value={expenseName}
              onChange={(event) =>
                setExpenseName(event.target.value)
              }
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Amount in Japanese yen"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              style={inputStyle}
            />

            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Expense date
            </label>

            <input
              type="date"
              value={expenseDate}
              onChange={(event) =>
                setExpenseDate(event.target.value)
              }
              style={inputStyle}
            />

            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Who paid?
            </label>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => setPaidBy("Me")}
                style={{
                  border:
                    paidBy === "Me"
                      ? "2px solid #2563eb"
                      : "1px solid #d1d5db",
                  background:
                    paidBy === "Me" ? "#dbeafe" : "white",
                  color: paidBy === "Me" ? "#1e40af" : "#374151",
                  padding: "10px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Me
              </button>

              <button
                type="button"
                onClick={() => setPaidBy("Business Partner")}
                style={{
                  border:
                    paidBy === "Business Partner"
                      ? "2px solid #7c3aed"
                      : "1px solid #d1d5db",
                  background:
                    paidBy === "Business Partner"
                      ? "#ede9fe"
                      : "white",
                  color:
                    paidBy === "Business Partner"
                      ? "#5b21b6"
                      : "#374151",
                  padding: "10px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Business Partner
              </button>
            </div>

            <textarea
              placeholder="Notes, optional"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={saveExpense}
                style={{
                  ...buttonStyle,
                  background:
                    editingExpenseId !== null
                      ? "#2563eb"
                      : "#22c55e",
                }}
              >
                {editingExpenseId !== null
                  ? "Save Expense Changes"
                  : "Add Expense"}
              </button>

              {editingExpenseId !== null && (
                <button
                  onClick={clearForm}
                  style={{
                    ...buttonStyle,
                    background: "#6b7280",
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 25,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            background: "white",
            padding: 18,
            borderRadius: 12,
            minWidth: 220,
            flex: 1,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ color: "#6b7280" }}>Total Expenses</div>

          <div
            style={{
              fontSize: 27,
              fontWeight: 700,
              marginTop: 8,
            }}
          >
            {formatYen(totalExpenses)}
          </div>
        </div>

        <div
          style={{
            background: "white",
            padding: 18,
            borderRadius: 12,
            minWidth: 220,
            flex: 1,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ color: "#6b7280" }}>Paid by Me</div>

          <div
            style={{
              fontSize: 27,
              fontWeight: 700,
              marginTop: 8,
              color: "#2563eb",
            }}
          >
            {formatYen(totalPaidByMe)}
          </div>
        </div>

        <div
          style={{
            background: "white",
            padding: 18,
            borderRadius: 12,
            minWidth: 220,
            flex: 1,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ color: "#6b7280" }}>Paid by Partner</div>

          <div
            style={{
              fontSize: 27,
              fontWeight: 700,
              marginTop: 8,
              color: "#7c3aed",
            }}
          >
            {formatYen(totalPaidByPartner)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 30 }}>
        <h2>Expense History</h2>

        {sortedExpenses.length === 0 ? (
          <p>No expenses have been added yet.</p>
        ) : (
          sortedExpenses.map(({ car, expense }) => (
            <div
              key={`${car.id}-${expense.id}`}
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)",
                padding: 18,
                borderRadius: 16,
                marginBottom: 12,
                boxShadow: "0 16px 35px -24px rgba(15, 23, 42, 0.22)",
                border: "1px solid rgba(148, 163, 184, 0.24)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 15,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                    {expense.name}
                  </h3>

                  <p style={{ margin: "5px 0" }}>
                    <strong>Car:</strong> {car.year} {car.make}{" "}
                    {car.model}
                  </p>

                  <p style={{ margin: "5px 0" }}>
                    <strong>Category:</strong>{" "}
                    {isExpenseCategory(expense.category)
                      ? expense.category
                      : "Product"}
                  </p>

                  <p style={{ margin: "5px 0" }}>
                    <strong>Amount:</strong>{" "}
                    {formatYen(expense.amount)}
                  </p>

                  <p style={{ margin: "5px 0" }}>
                    <strong>Paid by:</strong> {expense.paidBy}
                  </p>

                  <p style={{ margin: "5px 0" }}>
                    <strong>Date:</strong>{" "}
                    {formatDate(expense.date)}
                  </p>

                  {expense.notes && (
                    <p style={{ margin: "5px 0" }}>
                      <strong>Notes:</strong> {expense.notes}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() =>
                      startEditingExpense(car, expense)
                    }
                    style={{
                      ...buttonStyle,
                      background: "#2563eb",
                      padding: "8px 12px",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      deleteExpense(car.id, expense.id)
                    }
                    style={{
                      ...buttonStyle,
                      background: "#dc2626",
                      padding: "8px 12px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}