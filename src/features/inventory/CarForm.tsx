import { useEffect, useMemo, useState } from "react";

import type {
  BusinessType,
  Car,
  CarStatus,
  CustomerType,
  FundingStatus,
  Investor,
  NameTransferStatus,
  VehicleOwnership,
} from "../../types";

import {
  formatYen,
  getInvestorAllocation,
  getInvestorAvailableCapital,
} from "../../utils/finance";

type CarFormProps = {
  cars: Car[];
  investors: Investor[];
  editingCar: Car | null;
  onSave: (car: Car) => void;
  onCancelEdit: () => void;
};

type CarFormData = {
  make: string;
  model: string;
  year: string;
  purchaseDate: string;
  saleDate: string;
  bidPrice: string;
  auctionFinalPrice: string;
  salePrice: string;
  targetProfit: string;
  notes: string;
  status: CarStatus;
  saleType: BusinessType;
  ownership: VehicleOwnership;
  investorId: number | null;
  fundingStatus: FundingStatus;
  buyerName: string;
  customerType: CustomerType;
  nameTransferStatus: NameTransferStatus;
  nameTransferDate: string;
};

const emptyForm: CarFormData = {
  make: "",
  model: "",
  year: "",
  purchaseDate: "",
  saleDate: "",
  bidPrice: "",
  auctionFinalPrice: "",
  salePrice: "",
  targetProfit: "",
  notes: "",
  status: "In Stock",
  saleType: "Not decided",
  ownership: "Me + Partner",
  investorId: null,
  fundingStatus: "Not Allocated",
  buyerName: "",
  customerType: "",
  nameTransferStatus: "Pending",
  nameTransferDate: "",
};

export default function CarForm({
  cars,
  investors,
  editingCar,
  onSave,
  onCancelEdit,
}: CarFormProps) {
  const [form, setForm] = useState<CarFormData>(emptyForm);

  useEffect(() => {
    if (!editingCar) {
      setForm(emptyForm);
      return;
    }

    setForm({
      make: editingCar.make,
      model: editingCar.model,
      year: editingCar.year,
      purchaseDate: editingCar.purchaseDate,
      saleDate: editingCar.saleDate,
      bidPrice: editingCar.bidPrice,
      auctionFinalPrice: editingCar.auctionFinalPrice,
      salePrice: editingCar.salePrice,
      targetProfit: editingCar.targetProfit,
      notes: editingCar.notes,
      status: editingCar.status,
      saleType: editingCar.saleType,
      ownership: editingCar.ownership,
      investorId: editingCar.investorId,
      fundingStatus: editingCar.fundingStatus,
      buyerName: editingCar.buyerName,
      customerType: editingCar.customerType,
      nameTransferStatus: editingCar.nameTransferStatus,
      nameTransferDate: editingCar.nameTransferDate,
    });
  }, [editingCar]);

  const selectedInvestor = investors.find(
    (investor) => investor.id === form.investorId
  );

  const previewCar = useMemo<Car>(() => {
    return {
      id: editingCar?.id ?? Date.now(),
      make: form.make,
      model: form.model,
      year: form.year,
      purchaseDate: form.purchaseDate,
      saleDate: form.saleDate,
      bidPrice: form.bidPrice,
      auctionFinalPrice: form.auctionFinalPrice,
      salePrice: form.salePrice,
      targetProfit: form.targetProfit,
      notes: form.notes,
      status: form.status,
      saleType: form.saleType,
      ownership: form.ownership,
      investorId: form.investorId,
      fundingStatus: form.fundingStatus,
      buyerName: form.buyerName,
      customerType: form.customerType,
      nameTransferStatus:
        form.customerType === "Export"
          ? "Not Applicable"
          : form.nameTransferStatus,
      nameTransferDate:
        form.customerType === "Local" &&
        form.nameTransferStatus === "Completed"
          ? form.nameTransferDate
          : "",
      expenses: editingCar?.expenses ?? [],
      timeline: editingCar?.timeline ?? [],
    };
  }, [editingCar, form]);

  const investorAllocation = getInvestorAllocation(previewCar);

  const investorAvailableCapital = useMemo(() => {
    if (!selectedInvestor || form.saleType === "Not decided") {
      return 0;
    }

    const otherCars = cars.filter(
      (car) => car.id !== editingCar?.id
    );

    return getInvestorAvailableCapital(
      selectedInvestor,
      otherCars,
      form.saleType
    );
  }, [
    cars,
    editingCar,
    form.saleType,
    selectedInvestor,
  ]);

  const capitalShortfall =
    selectedInvestor && form.saleType !== "Not decided"
      ? investorAllocation - investorAvailableCapital
      : 0;

  function updateField<K extends keyof CarFormData>(
    field: K,
    value: CarFormData[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function selectInvestor(investorId: number | null) {
    setForm((current) => ({
      ...current,
      investorId,
      fundingStatus:
        investorId === null
          ? "Not Allocated"
          : current.fundingStatus === "Closed"
            ? "Closed"
            : "Allocated",
    }));
  }

  function selectCustomerType(customerType: CustomerType) {
    setForm((current) => ({
      ...current,
      customerType,
      nameTransferStatus:
        customerType === "Export"
          ? "Not Applicable"
          : current.nameTransferStatus === "Not Applicable"
            ? "Pending"
            : current.nameTransferStatus,
      nameTransferDate:
        customerType === "Export"
          ? ""
          : current.nameTransferDate,
    }));
  }

  function selectTransferStatus(
    nameTransferStatus: NameTransferStatus
  ) {
    setForm((current) => ({
      ...current,
      nameTransferStatus,
      nameTransferDate:
        nameTransferStatus === "Completed"
          ? current.nameTransferDate
          : "",
    }));
  }

  function validateForm() {
    if (
      !form.make.trim() ||
      !form.model.trim() ||
      !form.year.trim()
    ) {
      alert("Please enter the make, model and year.");
      return false;
    }

    if (!form.purchaseDate) {
      alert("Please enter the purchase date.");
      return false;
    }

    if (
      !form.auctionFinalPrice ||
      Number(form.auctionFinalPrice) <= 0
    ) {
      alert("Please enter a valid final auction price.");
      return false;
    }

    if (
      form.investorId !== null &&
      form.saleType === "Not decided"
    ) {
      alert(
        "Choose Local Trading or Export Trading before assigning an investor."
      );
      return false;
    }

    if (form.status === "Sold") {
      if (!form.saleDate || Number(form.salePrice) <= 0) {
        alert(
          "A sold vehicle must have a sale date and sale price."
        );
        return false;
      }

      if (!form.buyerName.trim()) {
        alert("Please enter the buyer name.");
        return false;
      }

      if (!form.customerType) {
        alert("Please choose whether the sale is Local or Export.");
        return false;
      }

      if (
        form.customerType === "Local" &&
        form.nameTransferStatus === "Completed" &&
        !form.nameTransferDate
      ) {
        alert(
          "Please enter the name-transfer date."
        );
        return false;
      }
    }

    if (
      form.saleDate &&
      form.purchaseDate &&
      form.saleDate < form.purchaseDate
    ) {
      alert(
        "The sale date cannot be earlier than the purchase date."
      );
      return false;
    }

    return true;
  }

  function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    if (selectedInvestor && capitalShortfall > 0) {
      const confirmed = window.confirm(
        `${selectedInvestor.name} does not have enough available ${
          form.saleType
        } capital.\n\nRequired: ${formatYen(
          investorAllocation
        )}\nAvailable: ${formatYen(
          investorAvailableCapital
        )}\nShortfall: ${formatYen(
          capitalShortfall
        )}\n\nSave the vehicle anyway?`
      );

      if (!confirmed) {
        return;
      }
    }

    const isSold = form.status === "Sold";

    const savedCar: Car = {
      id: editingCar?.id ?? Date.now(),
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year.trim(),
      purchaseDate: form.purchaseDate,
      saleDate: isSold ? form.saleDate : "",
      bidPrice: form.bidPrice.trim(),
      auctionFinalPrice: form.auctionFinalPrice.trim(),
      salePrice: isSold ? form.salePrice.trim() : "",
      targetProfit: form.targetProfit.trim(),
      notes: form.notes.trim(),
      status: form.status,
      saleType: form.saleType,
      ownership: form.ownership,
      investorId: form.investorId,
      fundingStatus:
        form.investorId === null
          ? "Not Allocated"
          : form.fundingStatus,
      buyerName: isSold ? form.buyerName.trim() : "",
      customerType: isSold ? form.customerType : "",
      nameTransferStatus:
        !isSold
          ? "Pending"
          : form.customerType === "Export"
            ? "Not Applicable"
            : form.nameTransferStatus,
      nameTransferDate:
        isSold &&
        form.customerType === "Local" &&
        form.nameTransferStatus === "Completed"
          ? form.nameTransferDate
          : "",
      expenses: editingCar?.expenses ?? [],
      timeline: editingCar?.timeline ?? [],
    };

    onSave(savedCar);

    if (!editingCar) {
      setForm(emptyForm);
    }
  }

  function handleCancel() {
    setForm(emptyForm);
    onCancelEdit();
  }

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

  const labelStyle = {
    display: "block",
    marginBottom: 7,
    fontWeight: 700,
    color: "#475569",
  };

  const fieldStyle = {
    marginBottom: 16,
  };

  const buttonStyle = {
    border: "none",
    borderRadius: 999,
    padding: "10px 15px",
    cursor: "pointer",
    fontWeight: 700,
  };

  return (
    <section
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)",
        border: "1px solid rgba(148, 163, 184, 0.24)",
        borderRadius: 20,
        padding: 22,
        boxShadow: "0 20px 50px -24px rgba(15, 23, 42, 0.28)",
      }}
    >
      <h2 style={{ marginTop: 0, color: "#0f172a" }}>
        {editingCar ? "Edit Vehicle" : "Add Vehicle"}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
        }}
      >
        <div style={fieldStyle}>
          <label style={labelStyle}>Make</label>
          <input
            value={form.make}
            onChange={(event) =>
              updateField("make", event.target.value)
            }
            placeholder="Toyota"
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Model</label>
          <input
            value={form.model}
            onChange={(event) =>
              updateField("model", event.target.value)
            }
            placeholder="Prius"
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Year</label>
          <input
            type="number"
            value={form.year}
            onChange={(event) =>
              updateField("year", event.target.value)
            }
            placeholder="2017"
            style={inputStyle}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
        }}
      >
        <div style={fieldStyle}>
          <label style={labelStyle}>Purchase date</label>
          <input
            type="date"
            value={form.purchaseDate}
            onChange={(event) =>
              updateField("purchaseDate", event.target.value)
            }
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Sale date</label>
          <input
            type="date"
            value={form.saleDate}
            onChange={(event) =>
              updateField("saleDate", event.target.value)
            }
            style={inputStyle}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
        }}
      >
        <div style={fieldStyle}>
          <label style={labelStyle}>Bid price</label>
          <input
            type="number"
            value={form.bidPrice}
            onChange={(event) =>
              updateField("bidPrice", event.target.value)
            }
            placeholder="Auction bid"
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Final auction price</label>
          <input
            type="number"
            value={form.auctionFinalPrice}
            onChange={(event) =>
              updateField(
                "auctionFinalPrice",
                event.target.value
              )
            }
            placeholder="Final invoice total"
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Sale price</label>
          <input
            type="number"
            value={form.salePrice}
            onChange={(event) =>
              updateField("salePrice", event.target.value)
            }
            placeholder="Final sale price"
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Target profit</label>
          <input
            type="number"
            value={form.targetProfit}
            onChange={(event) =>
              updateField(
                "targetProfit",
                event.target.value
              )
            }
            placeholder="Expected profit"
            style={inputStyle}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
        }}
      >
        <div style={fieldStyle}>
          <label style={labelStyle}>Inventory status</label>
          <select
            value={form.status}
            onChange={(event) =>
              updateField(
                "status",
                event.target.value as CarStatus
              )
            }
            style={inputStyle}
          >
            <option value="In Stock">In Stock</option>
            <option value="Reserved">Reserved</option>
            <option value="Shipping">Shipping</option>
            <option value="Sold">Sold</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Business type</label>
          <select
            value={form.saleType}
            onChange={(event) =>
              updateField(
                "saleType",
                event.target.value as BusinessType
              )
            }
            style={inputStyle}
          >
            <option value="Not decided">Not decided</option>
            <option value="Local">Local Trading</option>
            <option value="Export">Export Trading</option>
          </select>
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Ownership</label>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {(
            [
              "Mine Only",
              "Me + Partner",
            ] as VehicleOwnership[]
          ).map((ownership) => (
            <button
              key={ownership}
              type="button"
              onClick={() =>
                updateField("ownership", ownership)
              }
              style={{
                ...buttonStyle,
                border:
                  form.ownership === ownership
                    ? "2px solid #2563eb"
                    : "1px solid #d1d5db",
                background:
                  form.ownership === ownership
                    ? "#dbeafe"
                    : "white",
                color:
                  form.ownership === ownership
                    ? "#1e40af"
                    : "#374151",
              }}
            >
              {ownership}
            </button>
          ))}
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Investor funding</label>

        <select
          value={form.investorId ?? ""}
          onChange={(event) =>
            selectInvestor(
              event.target.value
                ? Number(event.target.value)
                : null
            )
          }
          style={inputStyle}
        >
          <option value="">
            Self-funded — no investor
          </option>

          {investors.map((investor) => (
            <option
              key={investor.id}
              value={investor.id}
            >
              {investor.name} — {investor.profitShare}% profit share
            </option>
          ))}
        </select>
      </div>

      {selectedInvestor && (
        <div
          style={{
            background:
              capitalShortfall > 0
                ? "#fef2f2"
                : "#f5f3ff",
            border:
              capitalShortfall > 0
                ? "1px solid #fecaca"
                : "1px solid #ddd6fe",
            borderRadius: 16,
            padding: 16,
            marginBottom: 18,
          }}
        >
          <strong
            style={{
              display: "block",
              color:
                capitalShortfall > 0
                  ? "#991b1b"
                  : "#5b21b6",
              marginBottom: 9,
            }}
          >
            Investor capital preview
          </strong>

          <p style={{ margin: "5px 0" }}>
            Investor: <strong>{selectedInvestor.name}</strong>
          </p>

          <p style={{ margin: "5px 0" }}>
            Capital category:{" "}
            <strong>
              {form.saleType === "Local"
                ? "Local Trading"
                : form.saleType === "Export"
                  ? "Export Trading"
                  : "Choose business type"}
            </strong>
          </p>

          <p style={{ margin: "5px 0" }}>
            Allocation required:{" "}
            <strong>{formatYen(investorAllocation)}</strong>
          </p>

          <p style={{ margin: "5px 0" }}>
            Available capital:{" "}
            <strong>
              {form.saleType === "Not decided"
                ? "Choose business type"
                : formatYen(investorAvailableCapital)}
            </strong>
          </p>

          {capitalShortfall > 0 && (
            <p
              style={{
                marginBottom: 0,
                color: "#991b1b",
                fontWeight: 700,
              }}
            >
              Warning: available capital is short by{" "}
              {formatYen(capitalShortfall)}.
            </p>
          )}
        </div>
      )}

      {form.status === "Sold" && (
        <section
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)",
            border: "1px solid rgba(148, 163, 184, 0.24)",
            borderRadius: 16,
            padding: 18,
            marginBottom: 18,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Sale Information</h3>

          <div style={fieldStyle}>
            <label style={labelStyle}>Buyer</label>
            <input
              value={form.buyerName}
              onChange={(event) =>
                updateField("buyerName", event.target.value)
              }
              placeholder="Buyer name or company name"
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Sale type</label>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              {(["Local", "Export"] as CustomerType[]).map(
                (customerType) => (
                  <button
                    key={customerType}
                    type="button"
                    onClick={() =>
                      selectCustomerType(customerType)
                    }
                    style={{
                      ...buttonStyle,
                      border:
                        form.customerType === customerType
                          ? "2px solid #2563eb"
                          : "1px solid #d1d5db",
                      background:
                        form.customerType === customerType
                          ? "#dbeafe"
                          : "white",
                      color:
                        form.customerType === customerType
                          ? "#1e40af"
                          : "#374151",
                    }}
                  >
                    {customerType}
                  </button>
                )
              )}
            </div>
          </div>

          {form.customerType === "Local" && (
            <>
              <div style={fieldStyle}>
                <label style={labelStyle}>
                  Name transfer status
                </label>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  {(
                    [
                      "Pending",
                      "Completed",
                    ] as NameTransferStatus[]
                  ).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        selectTransferStatus(status)
                      }
                      style={{
                        ...buttonStyle,
                        border:
                          form.nameTransferStatus === status
                            ? "2px solid #2563eb"
                            : "1px solid #d1d5db",
                        background:
                          form.nameTransferStatus === status
                            ? status === "Completed"
                              ? "#dcfce7"
                              : "#fef3c7"
                            : "white",
                        color:
                          form.nameTransferStatus === status
                            ? status === "Completed"
                              ? "#166534"
                              : "#92400e"
                            : "#374151",
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {form.nameTransferStatus === "Completed" && (
                <div style={fieldStyle}>
                  <label style={labelStyle}>
                    Name transfer date
                  </label>

                  <input
                    type="date"
                    value={form.nameTransferDate}
                    onChange={(event) =>
                      updateField(
                        "nameTransferDate",
                        event.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </div>
              )}
            </>
          )}

          {form.customerType === "Export" && (
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 12,
                padding: 13,
                color: "#1e40af",
                fontWeight: 700,
              }}
            >
              Name transfer: Not Applicable
            </div>
          )}
        </section>
      )}

      <div style={fieldStyle}>
        <label style={labelStyle}>Private business notes</label>

        <textarea
          value={form.notes}
          onChange={(event) =>
            updateField("notes", event.target.value)
          }
          rows={4}
          placeholder="For example: needs polishing, customer interested, do not sell below a certain price..."
          style={{
            ...inputStyle,
            resize: "vertical",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={handleSubmit}
          style={{
            ...buttonStyle,
            background: editingCar
              ? "#2563eb"
              : "#16a34a",
            color: "white",
          }}
        >
          {editingCar
            ? "Save Vehicle Changes"
            : "Add Vehicle"}
        </button>

        {editingCar && (
          <button
            type="button"
            onClick={handleCancel}
            style={{
              ...buttonStyle,
              background: "#6b7280",
              color: "white",
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </section>
  );
}