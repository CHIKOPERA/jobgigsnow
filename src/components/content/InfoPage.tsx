import type { ReactNode } from "react";

interface InfoPageProps {
  title: string;
  intro: string;
  children: ReactNode;
}

export function InfoPage({ title, intro, children }: InfoPageProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <article className="rounded-md border border-line bg-surface p-6 md:p-8">
        <h1 className="text-h2">{title}</h1>
        <p className="mt-4 text-body leading-relaxed text-ink-muted">{intro}</p>
        <div className="info-content mt-8 text-body leading-relaxed">{children}</div>
      </article>
    </div>
  );
}
