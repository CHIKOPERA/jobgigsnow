interface SearchBarProps {
  defaultValue?: string;
  hiddenParams?: Record<string, string>;
}

export function SearchBar({ defaultValue = "", hiddenParams = {} }: SearchBarProps) {
  return (
    <form action="/jobs" method="GET" role="search" aria-label="Search jobs">
      {Object.entries(hiddenParams).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <div className="flex h-13 items-center gap-3 rounded-pill border border-line bg-surface px-4.5 focus-within:border-ink focus-within:[box-shadow:var(--ring)]">
        <span aria-hidden="true" className="text-ink-muted">
          ⌕
        </span>
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="Role, company or skill"
          className="h-full flex-1 bg-transparent text-body outline-none placeholder:text-ink-muted"
          style={{ fontSize: "16px" }}
        />
      </div>
    </form>
  );
}
