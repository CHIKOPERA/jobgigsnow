import { redirect } from "next/navigation";

export default function ReviewQueuePage() {
  redirect("/admin/content?status=READY");
}
