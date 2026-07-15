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
      className="cf-stat"
      style={{ ["--stat-accent" as string]: color }}
    >
      <div className="cf-stat-label">{title}</div>

      <div className="cf-stat-value num" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
