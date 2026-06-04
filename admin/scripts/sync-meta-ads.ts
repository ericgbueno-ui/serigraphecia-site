import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";
import { fetchMetaAdInsights, toBrtDateString, brtDateMinus } from "../src/lib/meta-ads";

async function main() {
  const prisma = new PrismaClient();
  const accountId = process.env.META_ADS_ACCOUNT_ID;
  
  if (!accountId) {
    console.error("Error: META_ADS_ACCOUNT_ID is not configured in .env.local");
    process.exit(1);
  }

  console.log("Starting Meta Ads manual sync to production database...");
  console.log("Account ID:", accountId);

  const today = toBrtDateString();
  const since = brtDateMinus(30); // Fetch last 30 days of data
  console.log(`Fetching insights from ${since} to ${today}...`);

  try {
    const insights = await fetchMetaAdInsights(since, today);
    console.log(`Successfully fetched ${insights.length} days of insights from Meta Ads.`);

    let upserted = 0;
    for (const insight of insights) {
      await prisma.metaAdSpend.upsert({
        where: {
          date_accountId: { date: insight.date, accountId },
        },
        create: {
          date: insight.date,
          accountId,
          spend: insight.spend,
          impressions: insight.impressions,
          clicks: insight.clicks,
          reach: insight.reach,
          fetchedAt: new Date(),
        },
        update: {
          spend: insight.spend,
          impressions: insight.impressions,
          clicks: insight.clicks,
          reach: insight.reach,
          fetchedAt: new Date(),
        },
      });
      upserted++;
      console.log(`Syncing ${insight.date}: Spend = R$ ${insight.spend}, Clicks = ${insight.clicks}, Reach = ${insight.reach}`);
    }

    console.log(`\nDONE! Successfully synced ${upserted} records into the MetaAdSpend table.`);
  } catch (error) {
    console.error("Error running sync:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
