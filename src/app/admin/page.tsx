import { redirect } from "next/navigation";

/**
 * `/admin` has no screen of its own - it sends the admin straight to the
 * dashboard, which is what the legacy app's `/Admin` index route did.
 */
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
