import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function TestCasesPage() {
  redirect("/test-suites");
}
