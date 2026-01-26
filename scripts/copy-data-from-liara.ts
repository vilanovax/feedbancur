import { PrismaClient } from "@prisma/client";

// Liara database (using IP due to DNS issues)
const liaraPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://root:54EIo4e6un4txsQzllqNyrMK@2.189.44.44:33591/postgres?schema=public",
    },
  },
});

// Local database
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://feedbancur:feedbancur123@localhost:5433/feedbancur?schema=public",
    },
  },
});

async function copyData() {
  try {
    console.log("🔄 Starting data copy from Liara to Local...\n");

    // Order matters for foreign keys!
    const tables = [
      "settings",
      "departments",
      "user_statuses",
      "users",
      "projects",
      "project_members",
      "feedbacks",
      "feedback_messages",
      "feedback_notes",
      "feedback_checklist_items",
      "notifications",
      "announcements",
      "announcement_viewers",
      "polls",
      "poll_options",
      "poll_votes",
      "updates",
      "tasks",
      "assessments",
      "assessment_questions",
      "assessment_options",
      "assessment_assignments",
      "assessment_results",
      "assessment_answers",
      "analytics_keywords",
      "analytics_keyword_scores",
      "files",
    ];

    for (const table of tables) {
      try {
        console.log(`📋 Copying ${table}...`);

        // @ts-ignore
        const data = await liaraPrisma[table]?.findMany();

        if (!data || data.length === 0) {
          console.log(`   ⏭️  ${table}: No data found`);
          continue;
        }

        // @ts-ignore
        await localPrisma[table]?.createMany({
          data: data,
          skipDuplicates: true,
        });

        console.log(`   ✅ ${table}: ${data.length} records copied`);
      } catch (error: any) {
        if (error.code === "P2002") {
          console.log(`   ⚠️  ${table}: Skipped (duplicates)`);
        } else {
          console.error(`   ❌ ${table}: Error - ${error.message}`);
        }
      }
    }

    console.log("\n✨ Data copy completed!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await liaraPrisma.$disconnect();
    await localPrisma.$disconnect();
  }
}

copyData();
