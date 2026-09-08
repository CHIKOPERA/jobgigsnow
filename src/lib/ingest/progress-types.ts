export type ImportStage =
  | "discovering"
  | "found"
  | "capturing"
  | "rewriting"
  | "image"
  | "publishing"
  | "published"
  | "skipped"
  | "failed";

export interface ImportProgressEvent {
  type: "progress";
  stage: ImportStage;
  message: string;
  runId?: string;
  sourceName?: string;
  jobTitle?: string;
  found: number;
  processed: number;
  published: number;
  skipped: number;
  failed: number;
  current?: number;
  total?: number;
}

export interface ImportCompleteEvent<T = unknown> {
  type: "complete";
  result: T;
}

export interface ImportErrorEvent {
  type: "error";
  message: string;
}

export type ImportStreamEvent<T = unknown> = ImportProgressEvent | ImportCompleteEvent<T> | ImportErrorEvent;
export type ImportProgressReporter = (event: ImportProgressEvent) => void;
