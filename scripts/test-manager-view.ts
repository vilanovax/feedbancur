import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testManagerView() {
  console.log("=== Testing Manager View ===\n");

  // Get a manager user
  const manager = await prisma.user.findFirst({
    where: { role: "MANAGER" },
    include: {
      department: true,
    },
  });

  if (!manager) {
    console.log("No manager found!");
    await prisma.$disconnect();
    return;
  }

  console.log(`Testing with manager: ${manager.name}`);
  console.log(`Department: ${manager.department?.name || "NONE"}\n`);

  if (!manager.departmentId) {
    console.log("Manager has no department, should see 0 assessments");
    await prisma.$disconnect();
    return;
  }

  // Get assignments for manager's department with allowManagerView = true
  const assignments = await prisma.assessmentAssignment.findMany({
    where: {
      departmentId: manager.departmentId,
      allowManagerView: true,
    },
    include: {
      assessment: {
        select: {
          title: true,
          type: true,
          isActive: true,
        },
      },
    },
  });

  console.log(
    `Assignments with allowManagerView=true for ${manager.department?.name}:`
  );
  if (assignments.length === 0) {
    console.log("  NO ASSIGNMENTS WITH MANAGER VIEW PERMISSION!");
  } else {
    assignments.forEach((a) => {
      console.log(`  ✓ ${a.assessment.title} (${a.assessment.type})`);
      console.log(
        `    Active: ${a.assessment.isActive}, AllowManagerView: ${a.allowManagerView}`
      );
    });
  }

  console.log(
    `\nManager should see ${assignments.length} assessment(s) in their panel.`
  );

  await prisma.$disconnect();
}

testManagerView().catch(console.error);
