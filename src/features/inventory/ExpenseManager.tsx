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

  return (
    <section className="cf-panel">
      <div className="cf-flex-between" style={{ alignItems: "flex-start" }}>
        <div>
          <h2>Expenses</h2>
          <p className="cf-muted" style={{ marginTop: 4 }}>
            {car.year} {car.make} {car.model}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="cf-btn cf-btn-ghost cf-btn-sm"
        >
          Close
        </button>
      </div>

      <div
        className="cf-grid cf-grid-auto-sm"
        style={{ margin: "20px 0" }}
      >
        <div className="cf-inset">
          <div className="cf-mini-label">Total Expenses</div>
          <strong className="num" style={{ fontSize: "1.4rem" }}>
            {formatYen(totalExpenses)}
          </strong>
        </div>

        <div className="cf-inset">
          <div className="cf-mini-label">Paid by Me</div>
          <strong className="num cf-brand-text" style={{ fontSize: "1.4rem" }}>
            {formatYen(paidByMe)}
          </strong>
        </div>

        <div className="cf-inset">
          <div className="cf-mini-label">Paid by Partner</div>
          <strong className="num" style={{ fontSize: "1.4rem", color: "#ea580c" }}>
            {formatYen(paidByPartner)}
          </strong>
        </div>
      </div>

      <div className="cf-inset">
        <h3 style={{ marginBottom: 14 }}>
          {editingExpenseId !== null ? "Edit Expense" : "Add Expense"}
        </h3>

        <label className="cf-label">Category</label>

        <div className="cf-choices" style={{ marginBottom: 16 }}>
          {expenseCategories.map((expenseCategory) => (
            <button
              key={expenseCategory}
              type="button"
              onClick={() => setCategory(expenseCategory)}
              className="cf-chip"
              aria-pressed={category === expenseCategory}
            >
              {expenseCategory}
            </button>
          ))}
        </div>

        <div className="cf-field">
          <label className="cf-label">Description</label>
          <input
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="For example: front bumper repair"
            className="cf-input"
          />
        </div>

        <div className="cf-grid cf-grid-auto-sm">
          <div className="cf-field">
            <label className="cf-label">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
              placeholder="Amount in yen"
              className="cf-input"
            />
          </div>

          <div className="cf-field">
            <label className="cf-label">Expense date</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(event) =>
                setExpenseDate(event.target.value)
              }
              className="cf-input"
            />
          </div>
        </div>

        <label className="cf-label">Who paid?</label>

        <div className="cf-choices" style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setPaidBy("Me")}
            className="cf-chip"
            aria-pressed={paidBy === "Me"}
          >
            Me
          </button>

          <button
            type="button"
            onClick={() => setPaidBy("Business Partner")}
            className="cf-chip cf-chip-warn"
            aria-pressed={paidBy === "Business Partner"}
          >
            Business Partner
          </button>
        </div>

        <div className="cf-field">
          <label className="cf-label">Notes</label>
          <textarea
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            rows={3}
            placeholder="Optional notes"
            className="cf-textarea"
          />
        </div>

        <div className="cf-actions">
          <button
            type="button"
            onClick={saveExpense}
            className={
              "cf-btn " +
              (editingExpenseId !== null
                ? "cf-btn-primary"
                : "cf-btn-success")
            }
          >
            {editingExpenseId !== null
              ? "Save Expense Changes"
              : "Add Expense"}
          </button>

          {editingExpenseId !== null && (
            <button
              type="button"
              onClick={clearForm}
              className="cf-btn cf-btn-ghost"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 25 }}>
        <h3 style={{ marginBottom: 14 }}>Expense History</h3>

        {sortedExpenses.length === 0 ? (
          <p className="cf-muted">
            No expenses have been recorded for this vehicle.
          </p>
        ) : (
          sortedExpenses.map((expense) => (
            <div
              key={expense.id}
              className="cf-inset"
              style={{
                marginBottom: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 15,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div className="cf-flex" style={{ gap: 8, alignItems: "center" }}>
                  <strong>{expense.name}</strong>
                  <span className="cf-badge cf-badge-slate">
                    {expense.category || "Custom Expense"}
                  </span>
                </div>

                <div className="num" style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: 7 }}>
                  {formatYen(expense.amount)}
                </div>

                <div className="cf-muted" style={{ marginTop: 5, fontSize: "0.85rem" }}>
                  Paid by {expense.paidBy} · {formatDate(expense.date)}
                </div>

                {expense.notes && (
                  <div style={{ marginTop: 7, color: "var(--ink-2)" }}>
                    {expense.notes}
                  </div>
                )}
              </div>

              <div className="cf-actions">
                <button
                  type="button"
                  onClick={() => startEditing(expense)}
                  className="cf-btn cf-btn-primary cf-btn-sm"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => deleteExpense(expense.id)}
                  className="cf-btn cf-btn-danger cf-btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
