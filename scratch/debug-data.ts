import { getDashboardData } from "../lib/data";

async function test() {
  try {
    console.log("Testing getDashboardData...");
    const data = await getDashboardData();
    console.log("Success! Data keys:", Object.keys(data));
  } catch (error) {
    console.error("CRASH FOUND:", error);
  }
}

test();
