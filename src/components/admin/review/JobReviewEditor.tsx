"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { hasRequiredSocialImage } from "@/lib/ingest/review-policy";

const DEFAULT_PROMPT =
  "Rewrite this job description in clear, welcoming South African English. Keep every factual requirement and remove repetition. Use short sections and useful bullet points. Do not invent salary, benefits, dates, or requirements.";

const CATEGORIES = [
  ["JOB", "Job"],
  ["INTERNSHIP", "Internship"],
  ["LEARNERSHIP", "Learnership"],
  ["APPRENTICESHIP", "Apprenticeship"],
  ["GRADUATE_PROGRAMME", "Graduate programme"],
  ["CALL_FOR_APPLICATIONS", "Call for applications"],
  ["FUNDING", "Funding"],
] as const;

interface ReviewJob {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  status: string;
  category: string;
  location: string;
  remoteType: string;
  employmentType: string;
  descriptionHtml: string;
  highlights: string[];
  applyUrl: string;
  rewritePrompt: string;
  rawUrl: string | null;
  socialImageUrl: string | null;
  socialImageAlt: string | null;
  socialImageCredit: string | null;
  socialImageSourceUrl: string | null;
}

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  thumbnail: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={[
        "focus-ring min-h-9 rounded-md px-2.5 text-[12px] font-semibold transition-colors disabled:opacity-35",
        active ? "bg-ink text-surface" : "text-ink-muted hover:bg-bg hover:text-ink",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export function JobReviewEditor({ initial }: { initial: ReviewJob }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [companyName, setCompanyName] = useState(initial.companyName);
  const [category, setCategory] = useState(initial.category);
  const [location, setLocation] = useState(initial.location);
  const [remoteType, setRemoteType] = useState(initial.remoteType);
  const [employmentType, setEmploymentType] = useState(initial.employmentType);
  const [highlights, setHighlights] = useState(initial.highlights.join("\n"));
  const [applyUrl, setApplyUrl] = useState(initial.applyUrl);
  const [prompt, setPrompt] = useState(initial.rewritePrompt || DEFAULT_PROMPT);
  const [status, setStatus] = useState(initial.status);
  const [busy, setBusy] = useState<"save" | "rewrite" | "publish" | "reject" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageQuery, setImageQuery] = useState(initial.title);
  const [imageResults, setImageResults] = useState<PexelsPhoto[]>([]);
  const [searchingImages, setSearchingImages] = useState(false);
  const [savingPhotoId, setSavingPhotoId] = useState<number | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [socialImage, setSocialImage] = useState({
    url: initial.socialImageUrl,
    alt: initial.socialImageAlt,
    credit: initial.socialImageCredit,
    sourceUrl: initial.socialImageSourceUrl,
  });

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } })],
    content: initial.descriptionHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor min-h-[360px] px-5 py-5 text-body leading-relaxed outline-none",
        "aria-label": "Job description",
      },
    },
  });

  function payload(nextStatus?: "READY" | "PUBLISHED" | "REJECTED") {
    return {
      title,
      companyName,
      category,
      location,
      remoteType,
      employmentType,
      description: editor?.getHTML() ?? initial.descriptionHtml,
      highlights: highlights.split("\n").map((item) => item.trim()).filter(Boolean),
      applyUrl,
      rewritePrompt: prompt,
      ...(nextStatus && { status: nextStatus }),
    };
  }

  async function save(nextStatus: "READY" | "PUBLISHED" | "REJECTED" = "READY") {
    const action = nextStatus === "PUBLISHED" ? "publish" : nextStatus === "REJECTED" ? "reject" : "save";
    setBusy(action);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/jobs/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(nextStatus)),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "The job could not be saved.");
      setStatus(result.status);
      setNotice(
        nextStatus === "PUBLISHED"
          ? "Published — this job is now live on the site."
          : nextStatus === "REJECTED"
            ? "Rejected and removed from the review queue."
            : "Draft changes saved.",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The job could not be saved.");
    } finally {
      setBusy(null);
    }
  }

  async function rewrite() {
    if (!editor) return;
    setBusy("rewrite");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/jobs/${initial.id}/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, description: editor.getHTML() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "The AI rewrite failed.");
      editor.commands.setContent(result.description);
      setStatus("READY");
      setNotice("Rewrite complete. Review the result, then save or publish it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The AI rewrite failed.");
    } finally {
      setBusy(null);
    }
  }

  async function searchImages() {
    if (!imageQuery.trim()) return;
    setSearchingImages(true);
    setImageError(null);
    setImageResults([]);
    try {
      const response = await fetch(`/api/admin/pexels/search?q=${encodeURIComponent(imageQuery.trim())}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "Pexels search failed.");
      setImageResults(result.photos ?? []);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Pexels search failed.");
    } finally {
      setSearchingImages(false);
    }
  }

  async function selectSocialImage(photo: PexelsPhoto) {
    setSavingPhotoId(photo.id);
    setImageError(null);
    try {
      const response = await fetch(`/api/admin/jobs/${initial.id}/social-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId: photo.id,
          url: photo.url,
          alt: photo.alt,
          photographer: photo.photographer,
          photographerUrl: photo.photographerUrl,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "The image could not be saved.");
      setSocialImage({
        url: result.socialImageUrl,
        alt: result.socialImageAlt,
        credit: result.socialImageCredit,
        sourceUrl: result.socialImageSourceUrl,
      });
      setNotice("Social preview image optimized and saved.");
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "The image could not be saved.");
    } finally {
      setSavingPhotoId(null);
    }
  }

  const fieldClass = "focus-ring mt-1.5 h-11 w-full rounded-md border border-line bg-surface px-3 text-meta";
  const canPublish = hasRequiredSocialImage(socialImage.url);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="rounded-lg border border-line bg-surface p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
          <div>
            <p className="text-label uppercase tracking-[0.08em] text-ink-muted">Editorial review</p>
            <h1 className="mt-1 text-title font-semibold">Edit job listing</h1>
          </div>
          <span className="rounded-pill bg-accent-mint px-3 py-1.5 text-label font-semibold">{status}</span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-label uppercase tracking-[0.06em] text-ink-muted sm:col-span-2">
            Job title
            <input value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} />
          </label>
          <label className="text-label uppercase tracking-[0.06em] text-ink-muted">
            Company
            <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} className={fieldClass} />
          </label>
          <label className="text-label uppercase tracking-[0.06em] text-ink-muted">
            Location
            <input value={location} onChange={(event) => setLocation(event.target.value)} className={fieldClass} />
          </label>
          <label className="text-label uppercase tracking-[0.06em] text-ink-muted">
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className={fieldClass}>
              {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-label uppercase tracking-[0.06em] text-ink-muted">
            Work arrangement
            <select value={remoteType} onChange={(event) => setRemoteType(event.target.value)} className={fieldClass}>
              <option value="ONSITE">On-site</option><option value="HYBRID">Hybrid</option><option value="REMOTE">Remote</option>
            </select>
          </label>
          <label className="text-label uppercase tracking-[0.06em] text-ink-muted">
            Employment type
            <select value={employmentType} onChange={(event) => setEmploymentType(event.target.value)} className={fieldClass}>
              <option value="FULL_TIME">Full-time</option><option value="PART_TIME">Part-time</option><option value="CONTRACT">Contract</option><option value="INTERNSHIP">Internship</option><option value="TEMPORARY">Temporary</option>
            </select>
          </label>
          <label className="text-label uppercase tracking-[0.06em] text-ink-muted sm:col-span-2">
            Apply URL
            <input type="url" value={applyUrl} onChange={(event) => setApplyUrl(event.target.value)} className={fieldClass} />
          </label>
        </div>

        <div className="mt-7">
          <p className="text-label uppercase tracking-[0.06em] text-ink-muted">Description</p>
          <div className="mt-2 overflow-hidden rounded-md border border-line bg-white">
            <div className="flex flex-wrap gap-1 border-b border-line bg-surface-sunk p-2">
              <ToolbarButton label="Bold" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()} />
              <ToolbarButton label="Italic" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()} />
              <ToolbarButton label="Heading" active={editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} />
              <ToolbarButton label="Bullets" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()} />
              <ToolbarButton label="Numbers" active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()} />
              <ToolbarButton label="Quote" active={editor?.isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()} />
              <span className="mx-1 w-px bg-line" />
              <ToolbarButton label="Undo" disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()} />
              <ToolbarButton label="Redo" disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()} />
            </div>
            <EditorContent editor={editor} />
          </div>
        </div>

        <label className="mt-6 block text-label uppercase tracking-[0.06em] text-ink-muted">
          Highlights · one per line
          <textarea value={highlights} onChange={(event) => setHighlights(event.target.value)} rows={5} className="focus-ring mt-2 w-full rounded-md border border-line bg-surface px-3 py-2 text-meta normal-case tracking-normal" />
        </label>
      </section>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
        <section className="rounded-lg border border-line bg-ink p-5 text-surface">
          <p className="text-label uppercase tracking-[0.08em] text-surface/55">AI rewrite instruction</p>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={9}
            className="focus-ring mt-3 w-full rounded-md border border-white/15 bg-white/8 p-3 text-meta leading-relaxed text-surface placeholder:text-surface/40"
          />
          <button
            type="button"
            onClick={rewrite}
            disabled={busy !== null || !editor}
            className="focus-ring mt-3 h-11 w-full rounded-pill bg-accent-mint px-4 text-meta font-semibold text-ink hover:bg-surface disabled:opacity-50"
          >
            {busy === "rewrite" ? "Rewriting…" : "Rewrite with AI"}
          </button>
          <p className="mt-3 text-[12px] leading-relaxed text-surface/55">The instruction is saved with this job. AI output is never published automatically.</p>
        </section>

        {initial.rawUrl && (
          <Link href={initial.rawUrl} target="_blank" rel="noopener noreferrer" className="focus-ring rounded-md border border-line bg-surface px-4 py-3 text-meta font-medium hover:bg-surface-sunk">
            Open original source ↗
          </Link>
        )}

        {notice && <p className="rounded-md bg-accent-mint/55 p-3 text-meta text-ink">{notice}</p>}
        {error && <p className="rounded-md bg-danger/10 p-3 text-meta text-danger">{error}</p>}

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => save("READY")} disabled={busy !== null} className="focus-ring h-11 rounded-pill border border-line-strong bg-surface px-4 text-meta font-semibold disabled:opacity-50">
            {busy === "save" ? "Saving…" : "Save draft"}
          </button>
          <button type="button" onClick={() => save("PUBLISHED")} disabled={busy !== null || !canPublish} className="focus-ring h-11 rounded-pill bg-ink px-4 text-meta font-semibold text-surface disabled:opacity-50">
            {busy === "publish" ? "Publishing…" : "Publish"}
          </button>
        </div>
        {!canPublish && (
          <p className="text-center text-[12px] text-ink-muted">Choose a social preview image below before publishing.</p>
        )}
        <button type="button" onClick={() => save("REJECTED")} disabled={busy !== null} className="focus-ring h-10 rounded-pill text-meta font-medium text-danger hover:bg-danger/10 disabled:opacity-50">
          {busy === "reject" ? "Rejecting…" : "Reject listing"}
        </button>
      </aside>
      </div>

      <section className="rounded-lg border border-line bg-surface p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-label uppercase tracking-[0.08em] text-ink-muted">Social preview image</p>
            <h2 className="mt-1 text-title font-semibold">Choose an image from Pexels</h2>
            <p className="mt-1 max-w-2xl text-meta text-ink-muted">
              Saved as an optimized 1200×630 JPEG for link previews. It is not displayed on the public job page.
            </p>
          </div>
          {socialImage.url && (
            <div className="w-full max-w-xs">
              {/* This URL is selected by an admin and served from the configured R2 public domain. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={socialImage.url} alt={socialImage.alt ?? "Current social preview"} className="aspect-[1200/630] w-full rounded-md object-cover" />
              {socialImage.credit && (
                <p className="mt-1 text-[12px] text-ink-muted">
                  {socialImage.sourceUrl ? <a href={socialImage.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{socialImage.credit}</a> : socialImage.credit}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input
            value={imageQuery}
            onChange={(event) => setImageQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") void searchImages(); }}
            aria-label="Pexels search"
            className="focus-ring h-11 flex-1 rounded-md border border-line bg-surface px-3 text-meta"
          />
          <button type="button" onClick={searchImages} disabled={searchingImages || !imageQuery.trim()} className="focus-ring h-11 rounded-pill bg-ink px-6 text-meta font-semibold text-surface disabled:opacity-50">
            {searchingImages ? "Searching…" : "Search Pexels"}
          </button>
        </div>

        {imageError && <p className="mt-3 rounded-md bg-danger/10 p-3 text-meta text-danger">{imageError}</p>}
        {imageResults.length > 0 && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {imageResults.map((photo) => (
              <article key={photo.id} className="overflow-hidden rounded-md border border-line bg-surface-sunk">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.thumbnail} alt={photo.alt} className="aspect-video w-full object-cover" />
                <div className="p-3">
                  <a href={photo.photographerUrl} target="_blank" rel="noopener noreferrer" className="block truncate text-[12px] text-ink-muted hover:underline">
                    {photo.photographer} · Pexels
                  </a>
                  <button type="button" onClick={() => selectSocialImage(photo)} disabled={savingPhotoId !== null} className="focus-ring mt-2 h-9 w-full rounded-pill border border-line-strong bg-surface px-3 text-[12px] font-semibold disabled:opacity-50">
                    {savingPhotoId === photo.id ? "Optimizing & saving…" : "Use for preview"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
