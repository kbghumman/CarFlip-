import { useMemo, useState } from "react";

import type {
  BusinessType,
  Car,
  CarStatus,
  Investor,
  VehicleOwnership,
} from "../../types";

import {
  loadCars,
  loadInvestors,
  saveCars,
} from "../../utils/storage";

import CarCard from "./CarCard";
import CarForm from "./CarForm";
import ExpenseManager from "./ExpenseManager";

type StatusFilter = "All" | CarStatus;
type BusinessFilter = "All" | BusinessType;
type OwnershipFilter = "All" | VehicleOwnership;
type InvestorFilter = "All" | "Self-funded" | number;

export default function InventoryPage() {
  const [cars, setCars] = useState<Car[]>(() => loadCars());

  const [investors] = useState<Investor[]>(() =>
    loadInvestors()
  );

  const [editingCar, setEditingCar] =
    useState<Car | null>(null);

  const [expenseCarId, setExpenseCarId] =
    useState<number | null>(null);

  const [showCarForm, setShowCarForm] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");

  const [businessFilter, setBusinessFilter] =
    useState<BusinessFilter>("All");

  const [ownershipFilter, setOwnershipFilter] =
    useState<OwnershipFilter>("All");

  const [investorFilter, setInvestorFilter] =
    useState<InvestorFilter>("All");

  function updateCars(updatedCars: Car[]) {
    setCars(updatedCars);
    saveCars(updatedCars);
  }

  function saveCar(savedCar: Car) {
    const existingCar = cars.find(
      (car) => car.id === savedCar.id
    );

    if (existingCar) {
      updateCars(
        cars.map((car) =>
          car.id === savedCar.id ? savedCar : car
        )
      );
    } else {
      updateCars([...cars, savedCar]);
    }

    setEditingCar(null);
    setShowCarForm(false);
  }

  function startAddingCar() {
    setEditingCar(null);
    setExpenseCarId(null);
    setShowCarForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function startEditingCar(car: Car) {
    setEditingCar(car);
    setExpenseCarId(null);
    setShowCarForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelCarForm() {
    setEditingCar(null);
    setShowCarForm(false);
  }

  function deleteCar(carId: number) {
    updateCars(
      cars.filter((car) => car.id !== carId)
    );

    if (editingCar?.id === carId) {
      cancelCarForm();
    }

    if (expenseCarId === carId) {
      setExpenseCarId(null);
    }
  }

  function updateCar(updatedCar: Car) {
    updateCars(
      cars.map((car) =>
        car.id === updatedCar.id ? updatedCar : car
      )
    );
  }

  function manageExpenses(car: Car) {
    setExpenseCarId(car.id);
    setEditingCar(null);
    setShowCarForm(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeInvestment(carId: number) {
    updateCars(
      cars.map((car) =>
        car.id === carId
          ? {
              ...car,
              fundingStatus: "Closed",
            }
          : car
      )
    );
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("All");
    setBusinessFilter("All");
    setOwnershipFilter("All");
    setInvestorFilter("All");
  }

  const selectedExpenseCar =
    cars.find((car) => car.id === expenseCarId) ?? null;

  const filteredCars = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return cars.filter((car) => {
      const vehicleText = [
        car.make,
        car.model,
        car.year,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        vehicleText.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All" ||
        car.status === statusFilter;

      const matchesBusiness =
        businessFilter === "All" ||
        car.saleType === businessFilter;

      const matchesOwnership =
        ownershipFilter === "All" ||
        car.ownership === ownershipFilter;

      const matchesInvestor =
        investorFilter === "All"
          ? true
          : investorFilter === "Self-funded"
            ? car.investorId === null
            : car.investorId === investorFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesBusiness &&
        matchesOwnership &&
        matchesInvestor
      );
    });
  }, [
    cars,
    searchTerm,
    statusFilter,
    businessFilter,
    ownershipFilter,
    investorFilter,
  ]);

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: 12,
    border: "1px solid rgba(148, 163, 184, 0.35)",
    borderRadius: 12,
    fontSize: 15,
    background: "rgba(255,255,255,0.92)",
    color: "#0f172a",
  };

  const buttonStyle = {
    border: "none",
    borderRadius: 999,
    padding: "10px 15px",
    cursor: "pointer",
    fontWeight: 700,
    color: "white",
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 25,
        }}
      >
        <div>
          <h1
            style={{
              marginTop: 0,
              marginBottom: 5,
            }}
          >
            Inventory
          </h1>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
            }}
          >
            Manage vehicles, ownership, funding,
            expenses and profit
          </p>
        </div>

        <button
          type="button"
          onClick={startAddingCar}
          style={{
            ...buttonStyle,
            background: "#16a34a",
          }}
        >
          + Add Vehicle
        </button>
      </div>

      {showCarForm && (
        <div style={{ marginBottom: 28 }}>
          <CarForm
            cars={cars}
            investors={investors}
            editingCar={editingCar}
            onSave={saveCar}
            onCancelEdit={cancelCarForm}
          />
        </div>
      )}

      {selectedExpenseCar && (
        <div style={{ marginBottom: 28 }}>
          <ExpenseManager
            car={selectedExpenseCar}
            onUpdateCar={updateCar}
            onClose={() => setExpenseCarId(null)}
          />
        </div>
      )}

      <section
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)",
          border: "1px solid rgba(148, 163, 184, 0.24)",
          borderRadius: 20,
          padding: 20,
          boxShadow: "0 20px 50px -24px rgba(15, 23, 42, 0.28)",
          marginBottom: 28,
        }}
      >
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>
          Search and Filters
        </h2>

        <div style={{ marginBottom: 14 }}>
          <input
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search by make, model or year"
            style={inputStyle}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 12,
          }}
        >
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as StatusFilter
              )
            }
            style={inputStyle}
          >
            <option value="All">
              All inventory statuses
            </option>
            <option value="In Stock">
              In Stock
            </option>
            <option value="Reserved">
              Reserved
            </option>
            <option value="Shipping">
              Shipping
            </option>
            <option value="Sold">
              Sold
            </option>
          </select>

          <select
            value={businessFilter}
            onChange={(event) =>
              setBusinessFilter(
                event.target.value as BusinessFilter
              )
            }
            style={inputStyle}
          >
            <option value="All">
              All business types
            </option>
            <option value="Not decided">
              Not decided
            </option>
            <option value="Local">
              Local Trading
            </option>
            <option value="Export">
              Export Trading
            </option>
          </select>

          <select
            value={ownershipFilter}
            onChange={(event) =>
              setOwnershipFilter(
                event.target.value as OwnershipFilter
              )
            }
            style={inputStyle}
          >
            <option value="All">
              All ownership types
            </option>
            <option value="Mine Only">
              Mine Only
            </option>
            <option value="Me + Partner">
              Me + Partner
            </option>
          </select>

          <select
            value={investorFilter}
            onChange={(event) => {
              const value = event.target.value;

              setInvestorFilter(
                value === "All" ||
                value === "Self-funded"
                  ? value
                  : Number(value)
              );
            }}
            style={inputStyle}
          >
            <option value="All">
              All investors
            </option>

            <option value="Self-funded">
              Self-funded
            </option>

            {investors.map((investor) => (
              <option
                key={investor.id}
                value={investor.id}
              >
                {investor.name}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 16,
          }}
        >
          <span style={{ color: "#6b7280" }}>
            Showing {filteredCars.length} of{" "}
            {cars.length} vehicles
          </span>

          <button
            type="button"
            onClick={clearFilters}
            style={{
              ...buttonStyle,
              background: "#475569",
            }}
          >
            Clear Filters
          </button>
        </div>
      </section>

      <section>
        <h2 style={{ color: "#0f172a" }}>Vehicle List</h2>

        {cars.length === 0 && (
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 25,
              color: "#6b7280",
              textAlign: "center",
            }}
          >
            No vehicles have been added yet.
          </div>
        )}

        {cars.length > 0 &&
          filteredCars.length === 0 && (
            <div
              style={{
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                color: "#9a2c00",
                borderRadius: 16,
                padding: 18,
              }}
            >
              No vehicles match the current search
              and filters.
            </div>
          )}

        {filteredCars.map((car) => (
          <CarCard
            key={car.id}
            car={car}
            investors={investors}
            onEdit={startEditingCar}
            onDelete={deleteCar}
            onManageExpenses={manageExpenses}
            onCloseInvestment={closeInvestment}
          />
        ))}
      </section>
    </div>
  );
}