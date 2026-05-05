import { Suspense } from "react";
import { DashboardHome } from "@/components/dashboard-home";
import { DashboardSkeleton } from "@/components/skeleton";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

async function DashboardData() {
  try {
    const data = await getDashboardData();
    return <DashboardHome initialData={data} initialProjects={[]} />;
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
