import { useMemo, useState } from "react";

import type {
  Car,
  CustomerType,
  NameTransferStatus,
} from "../types";

import {
  loadCars,
  saveCars,
} from "../utils/storage";

import { formatYen } from "../utils/finance";

type CustomerFilter =
  | "All"
  | CustomerType;

type TransferFilter =
  | "All"
  | "Pending"
  | "Completed";

function formatDate(date: string) {
  if (!date) {
    return "Not entered";
  }

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString();
}

export default function Customers() {
  const [cars, setCars] =
    useState<Car[]>(() => loadCars());

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    customerTypeFilter,
    setCustomerTypeFilter,
  ] = useState<CustomerFilter>("All");

  const [
    transferFilter,
    setTransferFilter,
  ] = useState<TransferFilter>("All");

  function updateCars(updatedCars: Car[]) {
    setCars(updatedCars);
    saveCars(updatedCars);
  }

  function changeTransferStatus(
    carId: number,
    newStatus: NameTransferStatus
  ) {
    const transferDate =
      newStatus === "Completed"
        ? new Date()
            .toISOString()
            .slice(0, 10)
        : "";

    updateCars(
      cars.map((car) => {
        if (car.id !== carId) {
          return car;
        }

        return {
          ...car,
          nameTransferStatus: newStatus,
          nameTransferDate: transferDate,
        };
      })
    );
  }

  const soldCars = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return cars
      .filter(
        (car) =>
          car.status === "Sold" &&
          Boolean(car.buyerName.trim())
      )
      .filter((car) => {
        const searchableText = [
          car.buyerName,
          car.make,
          car.model,
          car.year,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !search ||
          searchableText.includes(search);

        const matchesCustomerType =
          customerTypeFilter === "All" ||
          car.customerType ===
            customerTypeFilter;

        const matchesTransfer =
          transferFilter === "All" ||
          (car.customerType === "Local" &&
            car.nameTransferStatus ===
              transferFilter);

        return (
          matchesSearch &&
          matchesCustomerType &&
          matchesTransfer
        );
      })
      .sort((a, b) =>
        b.saleDate.localeCompare(a.saleDate)
      );
  }, [
    cars,
    searchTerm,
    customerTypeFilter,
    transferFilter,
  ]);

  const pendingTransfers =
    cars.filter(
      (car) =>
        car.status === "Sold" &&
        car.customerType === "Local" &&
        car.nameTransferStatus === "Pending"
    ).length;

  const completedTransfers =
    cars.filter(
      (car) =>
        car.status === "Sold" &&
        car.customerType === "Local" &&
        car.nameTransferStatus ===
          "Completed"
    ).length;

  const exportSales =
    cars.filter(
      (car) =>
        car.status === "Sold" &&
        car.customerType === "Export"
    ).length;

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: 12,
    border: "1px solid rgba(148, 163, 184, 0.35)",
    borderRadius: 12,
    fontSize: 15,
    background: "rgba(255,255,255,0.96)",
    color: "#0f172a",
  };

  const buttonStyle = {
    border: "none",
    borderRadius: 999,
    padding: "9px 13px",
    cursor: "pointer",
    fontWeight: 700,
    color: "white",
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            marginTop: 0,
            marginBottom: 5,
            color: "#0f172a",
          }}
        >
          Customers
        </h1>

        <p
          style={{
            margin: 0,
            color: "#6b7280",
          }}
        >
          Sold vehicles, buyers and name
          transfers
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 14,
          marginBottom: 25,
        }}
      >
        <div
          style={{
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: 16,
            padding: 18,
          }}
        >
          <div style={{ color: "#92400e" }}>
            Pending Transfers
          </div>

          <strong
            style={{
              display: "block",
              fontSize: 27,
              marginTop: 7,
              color: "#92400e",
            }}
          >
            {pendingTransfers}
          </strong>
        </div>

        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 16,
            padding: 18,
          }}
        >
          <div style={{ color: "#166534" }}>
            Completed Transfers
          </div>

          <strong
            style={{
              display: "block",
              fontSize: 27,
              marginTop: 7,
              color: "#166534",
            }}
          >
            {completedTransfers}
          </strong>
        </div>

        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 16,
            padding: 18,
          }}
        >
          <div style={{ color: "#1e40af" }}>
            Export Sales
          </div>

          <strong
            style={{
              display: "block",
              fontSize: 27,
              marginTop: 7,
              color: "#1e40af",
            }}
          >
            {exportSales}
          </strong>
        </div>
      </div>

      <section
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)",
          border: "1px solid rgba(148, 163, 184, 0.24)",
          borderRadius: 20,
          padding: 20,
          boxShadow: "0 20px 50px -24px rgba(15, 23, 42, 0.28)",
          marginBottom: 25,
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
            placeholder="Search buyer or vehicle"
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
            value={customerTypeFilter}
            onChange={(event) =>
              setCustomerTypeFilter(
                event.target
                  .value as CustomerFilter
              )
            }
            style={inputStyle}
          >
            <option value="All">
              All sale types
            </option>

            <option value="Local">
              Local
            </option>

            <option value="Export">
              Export
            </option>
          </select>

          <select
            value={transferFilter}
            onChange={(event) =>
              setTransferFilter(
                event.target
                  .value as TransferFilter
              )
            }
            style={inputStyle}
          >
            <option value="All">
              All transfer statuses
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Completed">
              Completed
            </option>
          </select>
        </div>
      </section>

      <h2>Customer Sales</h2>

      {soldCars.length === 0 ? (
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)",
            border: "1px solid rgba(148, 163, 184, 0.24)",
            borderRadius: 18,
            padding: 25,
            color: "#64748b",
            textAlign: "center",
          }}
        >
          No sold vehicles match the current
          filters.
        </div>
      ) : (
        soldCars.map((car) => (
          <article
            key={car.id}
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)",
              border: "1px solid rgba(148, 163, 184, 0.24)",
              borderRadius: 18,
              padding: 20,
              marginBottom: 15,
              boxShadow: "0 16px 35px -24px rgba(15, 23, 42, 0.22)",
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
                    marginBottom: 7,
                  }}
                >
                  {car.buyerName}
                </h2>

                <div
                  style={{
                    color: "#4b5563",
                    fontWeight: 700,
                  }}
                >
                  {car.year} {car.make}{" "}
                  {car.model}
                </div>
              </div>

              <span
                style={{
                  background:
                    car.customerType === "Local"
                      ? "#dcfce7"
                      : "#dbeafe",
                  color:
                    car.customerType === "Local"
                      ? "#166534"
                      : "#1e40af",
                  borderRadius: 20,
                  padding: "7px 12px",
                  fontWeight: 700,
                }}
              >
                {car.customerType || "Not entered"}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(170px, 1fr))",
                gap: 12,
                marginTop: 18,
              }}
            >
              <div>
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: 13,
                  }}
                >
                  Sale Price
                </div>

                <strong
                  style={{
                    display: "block",
                    fontSize: 20,
                    marginTop: 4,
                  }}
                >
                  {formatYen(car.salePrice)}
                </strong>
              </div>

              <div>
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: 13,
                  }}
                >
                  Sale Date
                </div>

                <strong
                  style={{
                    display: "block",
                    marginTop: 4,
                  }}
                >
                  {formatDate(car.saleDate)}
                </strong>
              </div>

              <div>
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: 13,
                  }}
                >
                  Name Transfer
                </div>

                <strong
                  style={{
                    display: "block",
                    marginTop: 4,
                    color:
                      car.nameTransferStatus ===
                      "Completed"
                        ? "#166534"
                        : car.nameTransferStatus ===
                            "Pending"
                          ? "#92400e"
                          : "#4b5563",
                  }}
                >
                  {car.nameTransferStatus}
                </strong>

                {car.nameTransferDate && (
                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    {formatDate(
                      car.nameTransferDate
                    )}
                  </div>
                )}
              </div>
            </div>

            {car.customerType === "Local" && (
              <div
                style={{
                  display: "flex",
                  gap: 9,
                  flexWrap: "wrap",
                  marginTop: 18,
                }}
              >
                {car.nameTransferStatus !==
                  "Completed" && (
                  <button
                    type="button"
                    onClick={() =>
                      changeTransferStatus(
                        car.id,
                        "Completed"
                      )
                    }
                    style={{
                      ...buttonStyle,
                      background: "#16a34a",
                    }}
                  >
                    Mark Transfer Completed
                  </button>
                )}

                {car.nameTransferStatus ===
                  "Completed" && (
                  <button
                    type="button"
                    onClick={() =>
                      changeTransferStatus(
                        car.id,
                        "Pending"
                      )
                    }
                    style={{
                      ...buttonStyle,
                      background: "#ca8a04",
                    }}
                  >
                    Mark Transfer Pending
                  </button>
                )}
              </div>
            )}
          </article>
        ))
      )}
    </div>
  );
}