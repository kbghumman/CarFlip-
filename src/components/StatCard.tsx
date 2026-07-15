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
        background: "white",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        minWidth: 220,
        flex: 1,
      }}
    >
      <div
        style={{
          color: "#6b7280",
          marginBottom: 12,
          fontWeight: 600,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 32,
          fontWeight: "bold",
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}