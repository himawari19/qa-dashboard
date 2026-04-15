import { Dashboard } from "@/components/dashboard";
import { getDashboardData } from "@/lib/data";

export default async function Home() {
  const dataRaw = await getDashboardData();
  const data = JSON.parse(JSON.stringify(dataRaw));
  return <Dashboard {...data} />;
}
