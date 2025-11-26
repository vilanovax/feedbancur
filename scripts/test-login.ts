import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const mobile = "09121941532";
  const password = "admin123";

  console.log("🔍 بررسی کاربر...");
  const user = await prisma.user.findUnique({
    where: { mobile },
  });

  if (!user) {
    console.log("❌ کاربر یافت نشد!");
    return;
  }

  console.log("✅ کاربر یافت شد:");
  console.log(`   ID: ${user.id}`);
  console.log(`   نام: ${user.name}`);
  console.log(`   نقش: ${user.role}`);
  console.log(`   فعال: ${user.isActive}`);
  console.log(`   رمز hash شده: ${user.password.substring(0, 20)}...`);

  console.log("\n🔐 تست رمز عبور...");
  const isValid = await bcrypt.compare(password, user.password);
  console.log(`   رمز عبور معتبر: ${isValid ? "✅ بله" : "❌ خیر"}`);

  if (!isValid) {
    console.log("\n🔄 به‌روزرسانی رمز عبور...");
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { mobile },
      data: {
        password: hashedPassword,
        isActive: true,
      },
    });
    console.log("✅ رمز عبور به‌روزرسانی شد");
  }
}

main()
  .catch((e) => {
    console.error("❌ خطا:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

