import { DashboardHome } from "@/components/dashboard-home";

export const dynamic = "force-dynamic";
export default function Home() {
  return <DashboardHome initialData={null} initialProjects={[]} />;
}
