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

      return (
        matchesSearch &&
        matchesStatus &&
        matchesBusiness &&
        matchesOwnership
      );
    });
  }, [
    cars,
    searchTerm,
    statusFilter,
    businessFilter,
    ownershipFilter,
  ]);

  return (
    <div>
      <div className="cf-page-head">
        <div>
          <div className="cf-eyebrow">Inventory</div>
          <h1>Vehicles</h1>
          <p>Manage vehicles, ownership, funding, expenses and profit</p>
        </div>

        <button
          type="button"
          onClick={startAddingCar}
          className="cf-btn cf-btn-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Vehicle
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

      <section className="cf-panel" style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 14 }}>Search and Filters</h2>

        <div style={{ marginBottom: 14 }}>
          <input
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search by make, model or year"
            className="cf-input"
          />
        </div>

        <div className="cf-grid cf-grid-auto-sm">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as StatusFilter
              )
            }
            className="cf-select"
          >
            <option value="All">All inventory statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Reserved">Reserved</option>
            <option value="Shipping">Shipping</option>
            <option value="Sold">Sold</option>
          </select>

          <select
            value={businessFilter}
            onChange={(event) =>
              setBusinessFilter(
                event.target.value as BusinessFilter
              )
            }
            className="cf-select"
          >
            <option value="All">All business types</option>
            <option value="Not decided">Not decided</option>
            <option value="Local">Local Trading</option>
            <option value="Export">Export Trading</option>
          </select>

          <select
            value={ownershipFilter}
            onChange={(event) =>
              setOwnershipFilter(
                event.target.value as OwnershipFilter
              )
            }
            className="cf-select"
          >
            <option value="All">All ownership types</option>
            <option value="Mine Only">Mine Only</option>
            <option value="Me + Partner">Me + Partner</option>
          </select>
        </div>

        <div className="cf-flex-between" style={{ marginTop: 16 }}>
          <span className="cf-muted">
            Showing {filteredCars.length} of {cars.length} vehicles
          </span>

          <button
            type="button"
            onClick={clearFilters}
            className="cf-btn cf-btn-ghost cf-btn-sm"
          >
            Clear Filters
          </button>
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: 16 }}>Vehicle List</h2>

        {cars.length === 0 && (
          <div className="cf-empty">
            No vehicles have been added yet.
          </div>
        )}

        {cars.length > 0 &&
          filteredCars.length === 0 && (
            <div className="cf-callout cf-callout-amber">
              No vehicles match the current search and filters.
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
