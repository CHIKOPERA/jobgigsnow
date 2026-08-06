export function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <p className="text-label uppercase tracking-[0.06em] text-ink-muted">{label}</p>
      <p className="mt-1 text-h2 font-medium" style={{ fontSize: "28px" }}>
        {value}
      </p>
    </div>
  );
}
