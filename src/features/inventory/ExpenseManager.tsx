import { useEffect, useState } from "react";

import type {
  Car,
  Expense,
  ExpenseCategory,
  ExpensePayer,
} from "../../types";

import {
  formatYen,
  getExpensesPaidBy,
  getExpenseTotal,
} from "../../utils/finance";

type ExpenseManagerProps = {
  car: Car;
  onUpdateCar: (updatedCar: Car) => void;
  onClose: () => void;
};

const expenseCategories: ExpenseCategory[] = [
  "Shakken",
  "Fuel",
  "Part Order",
  "Transport/Delivery",
  "Repair",
  "Product",
  "Custom Expense",
];

export default function ExpenseManager({
  car,
  onUpdateCar,
  onClose,
}: ExpenseManagerProps) {
  const [category, setCategory] =
    useState<ExpenseCategory>("Repair");

  const [description, setDescription] =
    useState("");

  const [amount, setAmount] = useState("");

  const [paidBy, setPaidBy] =
    useState<ExpensePayer>("Me");

  const [expenseDate, setExpenseDate] =
    useState("");

  const [notes, setNotes] = useState("");

  const [
    editingExpenseId,
    setEditingExpenseId,
  ] = useState<number | null>(null);

  useEffect(() => {
    clearForm();
  }, [car.id]);

  function clearForm() {
    setCategory("Repair");
    setDescription("");
    setAmount("");
    setPaidBy("Me");
    setExpenseDate("");
    setNotes("");
    setEditingExpenseId(null);
  }

  function validateForm() {
    if (!description.trim()) {
      alert(
        "Please enter an expense description."
      );

      return false;
    }

    if (!amount || Number(amount) <= 0) {
      alert(
        "Please enter a valid expense amount."
      );

      return false;
    }

    if (!expenseDate) {
      alert("Please enter the expense date.");

      return false;
    }

    return true;
  }

  function saveExpense() {
    if (!validateForm()) {
      return;
    }

    if (editingExpenseId !== null) {
      const updatedExpenses =
        car.expenses.map((expense) => {
          if (
            expense.id !== editingExpenseId
          ) {
            return expense;
          }

          return {
            ...expense,
            category,
            name: description.trim(),
            amount,
            paidBy,
            date: expenseDate,
            notes: notes.trim(),
          };
        });

      onUpdateCar({
        ...car,
        expenses: updatedExpenses,
      });
    } else {
      const newExpense: Expense = {
        id: Date.now(),
        category,
        name: description.trim(),
        amount,
        paidBy,
        date: expenseDate,
        notes: notes.trim(),
      };

      onUpdateCar({
        ...car,
        expenses: [
          ...car.expenses,
          newExpense,
        ],
      });
    }

    clearForm();
  }

  function startEditing(
    expense: Expense
  ) {
    const savedCategory =
      expenseCategories.includes(
        expense.category as ExpenseCategory
      )
        ? (expense.category as ExpenseCategory)
        : "Custom Expense";

    setCategory(savedCategory);
    setDescription(expense.name);
    setAmount(expense.amount);
    setPaidBy(expense.paidBy);
    setExpenseDate(expense.date || "");
    setNotes(expense.notes || "");
    setEditingExpenseId(expense.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function deleteExpense(
    expenseId: number
  ) {
    const confirmed = window.confirm(
      "Delete this expense?"
    );

    if (!confirmed) {
      return;
    }

    onUpdateCar({
      ...car,
      expenses: car.expenses.filter(
        (expense) =>
          expense.id !== expenseId
      ),
    });

    if (
      editingExpenseId === expenseId
    ) {
      clearForm();
    }
  }

  function formatDate(
    date: string | undefined
  ) {
    if (!date) {
      return "No date";
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString();
  }

  const totalExpenses =
    getExpenseTotal(car);

  const paidByMe = getExpensesPaidBy(
    car,
    "Me"
  );

  const paidByPartner =
    getExpensesPaidBy(
      car,
      "Business Partner"
    );

  const sortedExpenses = [
    ...car.expenses,
  ].sort((a, b) => {
    const dateA = a.date || "";
    const dateB = b.date || "";

    return dateB.localeCompare(dateA);
  });

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: 11,
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 15,
    marginBottom: 14,
  };

  const labelStyle = {
    display: "block",
    marginBottom: 7,
    fontWeight: 700,
    color: "#374151",
  };

  const buttonStyle = {
    border: "none",
    borderRadius: 8,
    padding: "9px 13px",
    cursor: "pointer",
    fontWeight: 700,
    color: "white",
  };

  const summaryBoxStyle = {
    borderRadius: 10,
    padding: 15,
    flex: 1,
    minWidth: 190,
  };

  return (
    <section
      style={{
        background: "white",
        border:
          "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 22,
        boxShadow:
          "0 4px 14px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "flex-start",
          gap: 15,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              marginTop: 0,
              marginBottom: 5,
            }}
          >
            Expenses
          </h2>

          <p
            style={{
              color: "#6b7280",
              marginTop: 0,
            }}
          >
            {car.year} {car.make}{" "}
            {car.model}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            ...buttonStyle,
            background: "#6b7280",
          }}
        >
          Close
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          margin: "20px 0",
        }}
      >
        <div
          style={{
            ...summaryBoxStyle,
            background: "#f3f4f6",
          }}
        >
          <div
            style={{
              color: "#6b7280",
            }}
          >
            Total Expenses
          </div>

          <strong
            style={{
              display: "block",
              fontSize: 23,
              marginTop: 6,
            }}
          >
            {formatYen(totalExpenses)}
          </strong>
        </div>

        <div
          style={{
            ...summaryBoxStyle,
            background: "#eff6ff",
          }}
        >
          <div
            style={{
              color: "#6b7280",
            }}
          >
            Paid by Me
          </div>

          <strong
            style={{
              display: "block",
              fontSize: 23,
              marginTop: 6,
              color: "#2563eb",
            }}
          >
            {formatYen(paidByMe)}
          </strong>
        </div>

        <div
          style={{
            ...summaryBoxStyle,
            background: "#fff7ed",
          }}
        >
          <div
            style={{
              color: "#6b7280",
            }}
          >
            Paid by Partner
          </div>

          <strong
            style={{
              display: "block",
              fontSize: 23,
              marginTop: 6,
              color: "#ea580c",
            }}
          >
            {formatYen(paidByPartner)}
          </strong>
        </div>
      </div>

      <div
        style={{
          background: "#f9fafb",
          border:
            "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 18,
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {editingExpenseId !== null
            ? "Edit Expense"
            : "Add Expense"}
        </h3>

        <label style={labelStyle}>
          Category
        </label>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          {expenseCategories.map(
            (expenseCategory) => (
              <button
                key={expenseCategory}
                type="button"
                onClick={() =>
                  setCategory(
                    expenseCategory
                  )
                }
                style={{
                  border:
                    category ===
                    expenseCategory
                      ? "2px solid #2563eb"
                      : "1px solid #d1d5db",
                  background:
                    category ===
                    expenseCategory
                      ? "#dbeafe"
                      : "white",
                  color:
                    category ===
                    expenseCategory
                      ? "#1e40af"
                      : "#374151",
                  padding:
                    "9px 13px",
                  borderRadius: 20,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {expenseCategory}
              </button>
            )
          )}
        </div>

        <label style={labelStyle}>
          Description
        </label>

        <input
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          placeholder="For example: front bumper repair"
          style={inputStyle}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 14,
          }}
        >
          <div>
            <label style={labelStyle}>
              Amount
            </label>

            <input
              type="number"
              value={amount}
              onChange={(event) =>
                setAmount(
                  event.target.value
                )
              }
              placeholder="Amount in yen"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              Expense date
            </label>

            <input
              type="date"
              value={expenseDate}
              onChange={(event) =>
                setExpenseDate(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </div>
        </div>

        <label style={labelStyle}>
          Who paid?
        </label>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <button
            type="button"
            onClick={() =>
              setPaidBy("Me")
            }
            style={{
              border:
                paidBy === "Me"
                  ? "2px solid #2563eb"
                  : "1px solid #d1d5db",
              background:
                paidBy === "Me"
                  ? "#dbeafe"
                  : "white",
              color:
                paidBy === "Me"
                  ? "#1e40af"
                  : "#374151",
              padding: "10px 16px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Me
          </button>

          <button
            type="button"
            onClick={() =>
              setPaidBy(
                "Business Partner"
              )
            }
            style={{
              border:
                paidBy ===
                "Business Partner"
                  ? "2px solid #ea580c"
                  : "1px solid #d1d5db",
              background:
                paidBy ===
                "Business Partner"
                  ? "#ffedd5"
                  : "white",
              color:
                paidBy ===
                "Business Partner"
                  ? "#9a3412"
                  : "#374151",
              padding: "10px 16px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Business Partner
          </button>
        </div>

        <label style={labelStyle}>
          Notes
        </label>

        <textarea
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          rows={3}
          placeholder="Optional notes"
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
            type="button"
            onClick={saveExpense}
            style={{
              ...buttonStyle,
              background:
                editingExpenseId !== null
                  ? "#2563eb"
                  : "#16a34a",
            }}
          >
            {editingExpenseId !== null
              ? "Save Expense Changes"
              : "Add Expense"}
          </button>

          {editingExpenseId !== null && (
            <button
              type="button"
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
      </div>

      <div style={{ marginTop: 25 }}>
        <h3>Expense History</h3>

        {sortedExpenses.length === 0 ? (
          <p
            style={{
              color: "#6b7280",
            }}
          >
            No expenses have been
            recorded for this vehicle.
          </p>
        ) : (
          sortedExpenses.map(
            (expense) => (
              <div
                key={expense.id}
                style={{
                  background: "#f9fafb",
                  border:
                    "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 15,
                  marginBottom: 10,
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-start",
                  gap: 15,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems:
                        "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <strong>
                      {expense.name}
                    </strong>

                    <span
                      style={{
                        background:
                          "#e5e7eb",
                        color: "#374151",
                        borderRadius: 20,
                        padding:
                          "4px 9px",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {expense.category ||
                        "Custom Expense"}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 19,
                      fontWeight: 800,
                      marginTop: 7,
                    }}
                  >
                    {formatYen(
                      expense.amount
                    )}
                  </div>

                  <div
                    style={{
                      color: "#6b7280",
                      marginTop: 5,
                      fontSize: 14,
                    }}
                  >
                    Paid by{" "}
                    {expense.paidBy} ·{" "}
                    {formatDate(
                      expense.date
                    )}
                  </div>

                  {expense.notes && (
                    <div
                      style={{
                        color: "#4b5563",
                        marginTop: 7,
                      }}
                    >
                      {expense.notes}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      startEditing(
                        expense
                      )
                    }
                    style={{
                      ...buttonStyle,
                      background:
                        "#2563eb",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteExpense(
                        expense.id
                      )
                    }
                    style={{
                      ...buttonStyle,
                      background:
                        "#dc2626",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>
    </section>
  );
}