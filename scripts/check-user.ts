import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const mobile = process.argv[2] || "09123456789";
  const password = process.argv[3] || "admin123";

  console.log("🔍 بررسی کاربر...");
  console.log(`   موبایل: ${mobile}`);
  console.log(`   رمز: ${password}\n`);

  const user = await prisma.users.findUnique({
    where: { mobile },
    include: { departments: true },
  });

  if (!user) {
    console.log("❌ کاربر یافت نشد.");
    return;
  }

  console.log("✅ کاربر یافت شد:");
  console.log(`   ID: ${user.id}`);
  console.log(`   نام: ${user.name}`);
  console.log(`   نقش: ${user.role}`);
  console.log(`   فعال: ${user.isActive}`);
  console.log(`   باید رمز را تغییر دهد: ${user.mustChangePassword ?? false}`);
  console.log(`   بخش: ${user.departments?.name || "ندارد"}`);
  console.log(`   رمز hash شده: ${user.password.substring(0, 30)}...`);

  console.log("\n🔐 تست رمز عبور...");
  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log(`   رمز عبور معتبر: ${isPasswordValid ? "✅ بله" : "❌ خیر"}`);

  if (!isPasswordValid) {
    console.log("\n💡 تست با رمز پیش‌فرض 123456...");
    const isDefaultPasswordValid = await bcrypt.compare("123456", user.password);
    console.log(`   رمز پیش‌فرض معتبر: ${isDefaultPasswordValid ? "✅ بله" : "❌ خیر"}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

