import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Mapping از camelCase به snake_case
const modelMappings: { [key: string]: string } = {
  'prisma.user': 'prisma.users',
  'prisma.department': 'prisma.departments',
  'prisma.feedback': 'prisma.feedbacks',
  'prisma.announcement': 'prisma.announcements',
  'prisma.notification': 'prisma.notifications',
  'prisma.message': 'prisma.messages',
  'prisma.task': 'prisma.tasks',
  'prisma.poll': 'prisma.polls',
  'prisma.employee': 'prisma.employees',
  'prisma.assessment': 'prisma.assessments',
  'prisma.settings': 'prisma.settings', // این یکی درست است
};

async function fixPrismaModelNames() {
  console.log('🔧 شروع اصلاح نام مدل‌های Prisma...\n');

  // پیدا کردن همه فایل‌های TypeScript در app/api
  const files = await glob('app/api/**/*.ts', { ignore: ['**/node_modules/**'] });

  let totalFixed = 0;
  let filesModified = 0;

  for (const filePath of files) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      let modified = false;
      let fileFixed = 0;

      // جایگزینی همه موارد
      for (const [oldName, newName] of Object.entries(modelMappings)) {
        if (oldName === newName) continue; // skip if same

        // استفاده از regex برای جایگزینی دقیق
        const regex = new RegExp(`\\b${oldName.replace(/\./g, '\\.')}\\b`, 'g');
        const matches = content.match(regex);
        
        if (matches) {
          content = content.replace(regex, newName);
          fileFixed += matches.length;
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        filesModified++;
        totalFixed += fileFixed;
        console.log(`✅ ${filePath}: ${fileFixed} مورد اصلاح شد`);
      }
    } catch (error) {
      console.error(`❌ خطا در پردازش ${filePath}:`, error);
    }
  }

  console.log(`\n🎉 اصلاحات کامل شد!`);
  console.log(`   - ${filesModified} فایل اصلاح شد`);
  console.log(`   - ${totalFixed} مورد جایگزینی انجام شد`);
}

fixPrismaModelNames()
  .then(() => {
    console.log('\n✅ اسکریپت با موفقیت اجرا شد');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ خطا در اجرای اسکریپت:', error);
    process.exit(1);
  });

