import { redirect } from "next/navigation";

export default function AdminFailuresPage() {
  redirect("/admin/activity#issues");
}
