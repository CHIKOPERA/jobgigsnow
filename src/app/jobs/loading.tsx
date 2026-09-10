export default function JobsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:px-6" aria-busy="true" aria-label="Loading jobs">
      <div className="h-13 animate-pulse rounded-pill bg-surface" />
      <div className="mt-3 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 w-24 flex-none animate-pulse rounded-pill bg-surface" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:ml-[270px]">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-60 animate-pulse rounded-md border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
