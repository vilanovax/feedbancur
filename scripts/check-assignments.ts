import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAssignments() {
  console.log("=== Checking Assessment Assignments ===\n");

  // Check users and their departments
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  console.log("Users:");
  users.forEach((user) => {
    console.log(
      `  - ${user.name} (${user.email}) - ${user.role} - Department: ${
        user.department?.name || "NONE"
      }`
    );
  });

  console.log("\n=== Assessments ===\n");

  // Check assessments
  const assessments = await prisma.assessment.findMany({
    select: {
      id: true,
      title: true,
      type: true,
      isActive: true,
      _count: {
        select: {
          assignments: true,
          questions: true,
        },
      },
    },
  });

  console.log("Assessments:");
  assessments.forEach((assessment) => {
    console.log(
      `  - ${assessment.title} (${assessment.type}) - Active: ${assessment.isActive} - Assignments: ${assessment._count.assignments} - Questions: ${assessment._count.questions}`
    );
  });

  console.log("\n=== Assessment Assignments ===\n");

  // Check assignments
  const assignments = await prisma.assessmentAssignment.findMany({
    include: {
      assessment: {
        select: {
          title: true,
          type: true,
          isActive: true,
        },
      },
      department: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log("Assignments:");
  if (assignments.length === 0) {
    console.log("  NO ASSIGNMENTS FOUND!");
  } else {
    assignments.forEach((assignment) => {
      console.log(
        `  - ${assignment.assessment.title} → ${assignment.department?.name || "NULL DEPARTMENT"}`
      );
      console.log(
        `    Required: ${assignment.isRequired}, Start: ${assignment.startDate || "none"}, End: ${assignment.endDate || "none"}`
      );
      console.log(`    Active: ${assignment.assessment.isActive}`);
    });
  }

  await prisma.$disconnect();
}

checkAssignments().catch(console.error);
