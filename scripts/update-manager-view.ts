import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateManagerView() {
  console.log("=== Updating AllowManagerView for All Assignments ===\n");

  // Update all existing assignments to allow manager view
  const result = await prisma.assessmentAssignment.updateMany({
    data: {
      allowManagerView: true,
    },
  });

  console.log(`✅ Updated ${result.count} assignments to allowManagerView: true`);

  // Verify
  const assignments = await prisma.assessmentAssignment.findMany({
    include: {
      assessment: {
        select: {
          title: true,
          type: true,
        },
      },
      department: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log("\nAll assignments:");
  assignments.forEach((a) => {
    console.log(
      `  ${a.assessment.title} → ${a.department?.name}: allowManagerView=${a.allowManagerView}`
    );
  });

  await prisma.$disconnect();
}

updateManagerView().catch(console.error);
