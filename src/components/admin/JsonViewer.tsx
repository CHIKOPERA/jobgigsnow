export function JsonViewer({ label, value, defaultOpen }: { label: string; value: unknown; defaultOpen?: boolean }) {
  return (
    <details className="rounded-md border border-line" open={defaultOpen}>
      <summary className="focus-ring cursor-pointer rounded-md px-3 py-2 text-meta font-medium text-ink hover:bg-surface-sunk">
        {label}
      </summary>
      <pre className="max-h-96 overflow-auto border-t border-line bg-surface-sunk p-3 text-[12px] leading-relaxed text-ink-muted">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}
