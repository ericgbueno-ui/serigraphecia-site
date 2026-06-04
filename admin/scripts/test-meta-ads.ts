import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { fetchMetaAdInsights, toBrtDateString, brtDateMinus } from "../src/lib/meta-ads";

async function main() {
  console.log("Testing Meta Ads API...");
  console.log("ACCOUNT ID:", process.env.META_ADS_ACCOUNT_ID);
  console.log("TOKEN length:", process.env.META_ADS_ACCESS_TOKEN?.length ?? 0);
  
  const today = toBrtDateString();
  const since = brtDateMinus(30); // 30 days
  
  try {
    const data = await fetchMetaAdInsights(since, today);
    console.log("SUCCESS! Retrieved rows:", data.length);
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
  } catch (error) {
    console.error("ERROR querying Meta Ads:", error);
  }
}

main();
