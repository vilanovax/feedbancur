import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function importData(backupFile?: string) {
  console.log('📥 Starting data import...\n');

  try {
    // Determine which backup file to use
    const backupDir = path.join(process.cwd(), 'prisma', 'backups');
    let filepath: string;

    if (backupFile) {
      filepath = path.join(backupDir, backupFile);
    } else {
      filepath = path.join(backupDir, 'latest.json');
    }

    // Check if file exists
    if (!fs.existsSync(filepath)) {
      console.error(`❌ Backup file not found: ${filepath}`);
      console.log('\n💡 Available backups:');
      const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
      files.forEach(f => console.log(`   - ${f}`));
      process.exit(1);
    }

    console.log(`📂 Loading backup from: ${filepath}\n`);

    // Read backup file
    const fileContent = fs.readFileSync(filepath, 'utf-8');
    const backup = JSON.parse(fileContent);

    console.log(`📅 Backup date: ${backup.exportDate}`);
    console.log(`📌 Version: ${backup.version}\n`);

    // Ask for confirmation
    console.log('⚠️  WARNING: This will DELETE all existing data and restore from backup!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🗑️  Deleting existing data...\n');

    // Delete all data in reverse order of dependencies
    await prisma.analytics_keywords.deleteMany({});
    await prisma.otps.deleteMany({});

    await prisma.shared_files.deleteMany({});
    await prisma.shared_folders.deleteMany({});
    await prisma.project_feedbacks.deleteMany({});
    await prisma.project_members.deleteMany({});
    await prisma.projects.deleteMany({});

    await prisma.poll_responses.deleteMany({});
    await prisma.poll_options.deleteMany({});
    await prisma.polls.deleteMany({});

    await prisma.announcement_messages.deleteMany({});
    await prisma.announcement_views.deleteMany({});
    await prisma.announcements.deleteMany({});

    await prisma.assessment_results.deleteMany({});
    await prisma.assessment_progress.deleteMany({});
    await prisma.assessment_assignments.deleteMany({});
    await prisma.assessment_questions.deleteMany({});
    await prisma.assessments.deleteMany({});

    await prisma.task_comments.deleteMany({});
    await prisma.task_assignments.deleteMany({});
    await prisma.tasks.deleteMany({});

    await prisma.checklist_items.deleteMany({});
    await prisma.messages.deleteMany({});
    await prisma.feedbacks.deleteMany({});

    await prisma.notifications.deleteMany({});
    await prisma.updates.deleteMany({});

    await prisma.users.deleteMany({});
    await prisma.departments.deleteMany({});
    await prisma.user_statuses.deleteMany({});
    await prisma.settings.deleteMany({});

    console.log('✅ Existing data deleted\n');
    console.log('📥 Importing data...\n');

    // Import data in correct order
    const data = backup.data;

    // Settings
    if (data.settings?.length) {
      await prisma.settings.createMany({ data: data.settings, skipDuplicates: true });
      console.log(`   ✓ Settings: ${data.settings.length}`);
    }

    // User statuses
    if (data.user_statuses?.length) {
      await prisma.user_statuses.createMany({ data: data.user_statuses, skipDuplicates: true });
      console.log(`   ✓ User statuses: ${data.user_statuses.length}`);
    }

    // Departments
    if (data.departments?.length) {
      await prisma.departments.createMany({ data: data.departments, skipDuplicates: true });
      console.log(`   ✓ Departments: ${data.departments.length}`);
    }

    // Users
    if (data.users?.length) {
      await prisma.users.createMany({ data: data.users, skipDuplicates: true });
      console.log(`   ✓ Users: ${data.users.length}`);
    }

    // Updates
    if (data.updates?.length) {
      await prisma.updates.createMany({ data: data.updates, skipDuplicates: true });
      console.log(`   ✓ Updates: ${data.updates.length}`);
    }

    // Notifications
    if (data.notifications?.length) {
      await prisma.notifications.createMany({ data: data.notifications, skipDuplicates: true });
      console.log(`   ✓ Notifications: ${data.notifications.length}`);
    }

    // Feedbacks
    if (data.feedbacks?.length) {
      await prisma.feedbacks.createMany({ data: data.feedbacks, skipDuplicates: true });
      console.log(`   ✓ Feedbacks: ${data.feedbacks.length}`);
    }

    // Messages
    if (data.messages?.length) {
      await prisma.messages.createMany({ data: data.messages, skipDuplicates: true });
      console.log(`   ✓ Messages: ${data.messages.length}`);
    }

    // Checklist items
    if (data.checklist_items?.length) {
      await prisma.checklist_items.createMany({ data: data.checklist_items, skipDuplicates: true });
      console.log(`   ✓ Checklist items: ${data.checklist_items.length}`);
    }

    // Tasks
    if (data.tasks?.length) {
      await prisma.tasks.createMany({ data: data.tasks, skipDuplicates: true });
      console.log(`   ✓ Tasks: ${data.tasks.length}`);
    }

    // Task assignments
    if (data.task_assignments?.length) {
      await prisma.task_assignments.createMany({ data: data.task_assignments, skipDuplicates: true });
      console.log(`   ✓ Task assignments: ${data.task_assignments.length}`);
    }

    // Task comments
    if (data.task_comments?.length) {
      await prisma.task_comments.createMany({ data: data.task_comments, skipDuplicates: true });
      console.log(`   ✓ Task comments: ${data.task_comments.length}`);
    }

    // Assessments
    if (data.assessments?.length) {
      await prisma.assessments.createMany({ data: data.assessments, skipDuplicates: true });
      console.log(`   ✓ Assessments: ${data.assessments.length}`);
    }

    // Assessment questions
    if (data.assessment_questions?.length) {
      await prisma.assessment_questions.createMany({ data: data.assessment_questions, skipDuplicates: true });
      console.log(`   ✓ Assessment questions: ${data.assessment_questions.length}`);
    }

    // Assessment assignments
    if (data.assessment_assignments?.length) {
      await prisma.assessment_assignments.createMany({ data: data.assessment_assignments, skipDuplicates: true });
      console.log(`   ✓ Assessment assignments: ${data.assessment_assignments.length}`);
    }

    // Assessment progress
    if (data.assessment_progress?.length) {
      await prisma.assessment_progress.createMany({ data: data.assessment_progress, skipDuplicates: true });
      console.log(`   ✓ Assessment progress: ${data.assessment_progress.length}`);
    }

    // Assessment results
    if (data.assessment_results?.length) {
      await prisma.assessment_results.createMany({ data: data.assessment_results, skipDuplicates: true });
      console.log(`   ✓ Assessment results: ${data.assessment_results.length}`);
    }

    // Announcements
    if (data.announcements?.length) {
      await prisma.announcements.createMany({ data: data.announcements, skipDuplicates: true });
      console.log(`   ✓ Announcements: ${data.announcements.length}`);
    }

    // Announcement views
    if (data.announcement_views?.length) {
      await prisma.announcement_views.createMany({ data: data.announcement_views, skipDuplicates: true });
      console.log(`   ✓ Announcement views: ${data.announcement_views.length}`);
    }

    // Announcement messages
    if (data.announcement_messages?.length) {
      await prisma.announcement_messages.createMany({ data: data.announcement_messages, skipDuplicates: true });
      console.log(`   ✓ Announcement messages: ${data.announcement_messages.length}`);
    }

    // Polls
    if (data.polls?.length) {
      await prisma.polls.createMany({ data: data.polls, skipDuplicates: true });
      console.log(`   ✓ Polls: ${data.polls.length}`);
    }

    // Poll options
    if (data.poll_options?.length) {
      await prisma.poll_options.createMany({ data: data.poll_options, skipDuplicates: true });
      console.log(`   ✓ Poll options: ${data.poll_options.length}`);
    }

    // Poll responses
    if (data.poll_responses?.length) {
      await prisma.poll_responses.createMany({ data: data.poll_responses, skipDuplicates: true });
      console.log(`   ✓ Poll responses: ${data.poll_responses.length}`);
    }

    // Projects
    if (data.projects?.length) {
      await prisma.projects.createMany({ data: data.projects, skipDuplicates: true });
      console.log(`   ✓ Projects: ${data.projects.length}`);
    }

    // Project members
    if (data.project_members?.length) {
      await prisma.project_members.createMany({ data: data.project_members, skipDuplicates: true });
      console.log(`   ✓ Project members: ${data.project_members.length}`);
    }

    // Project feedbacks
    if (data.project_feedbacks?.length) {
      await prisma.project_feedbacks.createMany({ data: data.project_feedbacks, skipDuplicates: true });
      console.log(`   ✓ Project feedbacks: ${data.project_feedbacks.length}`);
    }

    // Shared folders
    if (data.shared_folders?.length) {
      await prisma.shared_folders.createMany({ data: data.shared_folders, skipDuplicates: true });
      console.log(`   ✓ Shared folders: ${data.shared_folders.length}`);
    }

    // Shared files
    if (data.shared_files?.length) {
      await prisma.shared_files.createMany({ data: data.shared_files, skipDuplicates: true });
      console.log(`   ✓ Shared files: ${data.shared_files.length}`);
    }

    // Analytics keywords
    if (data.analytics_keywords?.length) {
      await prisma.analytics_keywords.createMany({ data: data.analytics_keywords, skipDuplicates: true });
      console.log(`   ✓ Analytics keywords: ${data.analytics_keywords.length}`);
    }

    // OTPs
    if (data.otps?.length) {
      await prisma.otps.createMany({ data: data.otps, skipDuplicates: true });
      console.log(`   ✓ OTPs: ${data.otps.length}`);
    }

    console.log('\n✅ Import completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error importing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get backup file from command line argument
const backupFile = process.argv[2];

// Run import
importData(backupFile)
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
