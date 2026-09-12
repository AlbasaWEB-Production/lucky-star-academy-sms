import { redirect } from "next/navigation";

export const metadata = {
  title: "Student",
};

/**
 * `/student` has no content of its own - the dashboard is the portal home, and
 * the sidebar and login redirect both point at it, so this page only forwards.
 */
export default async function StudentIndexPage() {
  redirect("/student/dashboard");
}
