import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixData() {
  console.log("=== Fixing Data ===\n");

  // 1. Assign MBTI assessment to all departments
  const mbtiAssessment = await prisma.assessment.findFirst({
    where: { type: "MBTI" },
  });

  if (mbtiAssessment) {
    console.log("\nAssigning MBTI assessment to all departments...");

    const departments = await prisma.department.findMany();

    for (const dept of departments) {
      // Check if already assigned
      const existing = await prisma.assessmentAssignment.findUnique({
        where: {
          assessmentId_departmentId: {
            assessmentId: mbtiAssessment.id,
            departmentId: dept.id,
          },
        },
      });

      if (!existing) {
        await prisma.assessmentAssignment.create({
          data: {
            assessmentId: mbtiAssessment.id,
            departmentId: dept.id,
            isRequired: false,
            allowManagerView: true,
          },
        });
        console.log(`  ✓ Assigned MBTI to ${dept.name}`);
      } else {
        console.log(`  - MBTI already assigned to ${dept.name}`);
      }
    }
  }

  // 2. Assign DISC assessment to all departments (if not already)
  const discAssessment = await prisma.assessment.findFirst({
    where: { type: "DISC" },
  });

  if (discAssessment) {
    console.log("\nAssigning DISC assessment to all departments...");

    const departments = await prisma.department.findMany();

    for (const dept of departments) {
      const existing = await prisma.assessmentAssignment.findUnique({
        where: {
          assessmentId_departmentId: {
            assessmentId: discAssessment.id,
            departmentId: dept.id,
          },
        },
      });

      if (!existing) {
        await prisma.assessmentAssignment.create({
          data: {
            assessmentId: discAssessment.id,
            departmentId: dept.id,
            isRequired: false,
            allowManagerView: true,
          },
        });
        console.log(`  ✓ Assigned DISC to ${dept.name}`);
      } else {
        console.log(`  - DISC already assigned to ${dept.name}`);
      }
    }
  }

  console.log("\n✅ Data fixed successfully!");

  await prisma.$disconnect();
}

fixData().catch(console.error);
