export default function AdminLoading() {
  return <div className="animate-pulse space-y-5" aria-label="Loading admin page"><div className="h-8 w-56 rounded-md bg-surface-sunk" /><div className="grid gap-3 sm:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 rounded-lg bg-surface-sunk" />)}</div><div className="h-72 rounded-xl bg-surface-sunk" /></div>;
}
