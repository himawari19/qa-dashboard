import { Suspense } from "react";
import { DashboardHome } from "@/components/dashboard-home";
import { DashboardSkeleton } from "@/components/skeleton";
import { getDashboardData, getDashboardProjects } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function DashboardData() {
  try {
    const [data, projects] = await Promise.all([getDashboardData(), getDashboardProjects()]);
    return <DashboardHome initialData={data} initialProjects={projects} />;
  } catch {
    return <DashboardHome initialData={null} initialProjects={[]} />;
  }
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData />
    </Suspense>
  );
}
