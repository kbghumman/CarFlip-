type StatCardProps = {
  title: string;
  value: string | number;
  color?: string;
};

export default function StatCard({
  title,
  value,
  color = "#2563eb",
}: StatCardProps) {
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)",
        border: "1px solid rgba(15, 23, 42, 0.07)",
        borderRadius: 20,
        padding: 22,
        boxShadow: "0 20px 50px -24px rgba(15, 23, 42, 0.34)",
        minWidth: 220,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          padding: "6px 10px",
          borderRadius: 999,
          background: `${color}14`,
          color,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: "#0f172a",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}