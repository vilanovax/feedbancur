import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateFeedbackTypes() {
  try {
    console.log("🔄 Starting feedback type migration...");
    
    // تبدیل enum values به string
    const feedbacks = await prisma.feedback.findMany({
      select: { id: true, type: true },
    });

    console.log(`📊 Found ${feedbacks.length} feedbacks to migrate`);

    let updated = 0;
    for (const feedback of feedbacks) {
      // اگر type به صورت enum object است، مقدار آن را بگیر
      const typeValue = typeof feedback.type === 'string' 
        ? feedback.type 
        : (feedback.type as any).toString();
      
      // اگر قبلاً string است، نیازی به update نیست
      if (typeof typeValue === 'string') {
        continue;
      }

      await prisma.feedback.update({
        where: { id: feedback.id },
        data: { type: typeValue },
      });
      updated++;
    }

    console.log(`✅ Updated ${updated} feedbacks`);
    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateFeedbackTypes();

