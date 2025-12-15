import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkMBTIData() {
  console.log("🔍 Checking MBTI Assessment Data...\n");

  // چک کردن آزمون
  const assessment = await prisma.assessment.findUnique({
    where: { id: "mbti-standard-assessment" },
    include: {
      _count: {
        select: { questions: true },
      },
    },
  });

  if (!assessment) {
    console.log("❌ MBTI Assessment not found!");
    return;
  }

  console.log(`✅ Assessment found: ${assessment.title}`);
  console.log(`   Questions count: ${assessment._count.questions}\n`);

  // چک کردن چند سوال اول
  const questions = await prisma.assessmentQuestion.findMany({
    where: { assessmentId: "mbti-standard-assessment" },
    orderBy: { order: "asc" },
    take: 3,
  });

  console.log("📋 First 3 questions:\n");
  questions.forEach((q, index) => {
    console.log(`Question ${index + 1}:`);
    console.log(`  Text: ${q.questionText}`);
    console.log(`  Type: ${q.questionType}`);
    console.log(`  Options type: ${typeof q.options}`);
    console.log(`  Options value:`, q.options);
    console.log(`  Options stringified:`, JSON.stringify(q.options, null, 2));
    console.log("");
  });
}

checkMBTIData()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
