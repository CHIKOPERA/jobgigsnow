import { env } from "@/config";
import { AdSenseUnit } from "./AdSenseUnit";

type ContentKind = "article" | "course" | "job";

const minimumCharacters: Record<ContentKind, number> = {
  article: 800,
  course: 500,
  job: 500,
};

const slots: Record<ContentKind, string | undefined> = {
  article: env.ADSENSE_ARTICLE_SLOT,
  course: env.ADSENSE_COURSE_SLOT,
  job: env.ADSENSE_JOB_SLOT,
};

interface ContentAdProps {
  kind: ContentKind;
  pageKey: string;
  text: string;
}

export function ContentAd({ kind, pageKey, text }: ContentAdProps) {
  const slotId = slots[kind];
  const plainText = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!slotId || plainText.length < minimumCharacters[kind]) return null;

  return <AdSenseUnit key={`${kind}:${pageKey}`} clientId={env.ADSENSE_CLIENT_ID} slotId={slotId} />;
}
