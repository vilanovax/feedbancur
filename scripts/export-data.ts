import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function exportData() {
  console.log('📦 Starting data export...\n');

  try {
    // Export all data from database
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      data: {
        // Users and Authentication
        users: await prisma.users.findMany(),
        user_statuses: await prisma.user_statuses.findMany(),

        // Departments
        departments: await prisma.departments.findMany(),

        // Feedbacks
        feedbacks: await prisma.feedbacks.findMany(),
        messages: await prisma.messages.findMany(),
        checklist_items: await prisma.checklist_items.findMany(),

        // Tasks
        tasks: await prisma.tasks.findMany(),
        task_assignments: await prisma.task_assignments.findMany(),
        task_comments: await prisma.task_comments.findMany(),

        // Assessments
        assessments: await prisma.assessments.findMany(),
        assessment_questions: await prisma.assessment_questions.findMany(),
        assessment_assignments: await prisma.assessment_assignments.findMany(),
        assessment_results: await prisma.assessment_results.findMany(),
        assessment_progress: await prisma.assessment_progress.findMany(),

        // Announcements
        announcements: await prisma.announcements.findMany(),
        announcement_views: await prisma.announcement_views.findMany(),
        announcement_messages: await prisma.announcement_messages.findMany(),

        // Polls
        polls: await prisma.polls.findMany(),
        poll_options: await prisma.poll_options.findMany(),
        poll_responses: await prisma.poll_responses.findMany(),

        // Projects and Files
        projects: await prisma.projects.findMany(),
        project_members: await prisma.project_members.findMany(),
        project_feedbacks: await prisma.project_feedbacks.findMany(),
        shared_folders: await prisma.shared_folders.findMany(),
        shared_files: await prisma.shared_files.findMany(),

        // Analytics
        analytics_keywords: await prisma.analytics_keywords.findMany(),

        // OTPs
        otps: await prisma.otps.findMany(),

        // Updates
        updates: await prisma.updates.findMany(),

        // Notifications
        notifications: await prisma.notifications.findMany(),

        // Settings
        settings: await prisma.settings.findMany(),
      }
    };

    // Calculate statistics
    const stats = {
      users: data.data.users.length,
      departments: data.data.departments.length,
      feedbacks: data.data.feedbacks.length,
      messages: data.data.messages.length,
      tasks: data.data.tasks.length,
      assessments: data.data.assessments.length,
      announcements: data.data.announcements.length,
      polls: data.data.polls.length,
      projects: data.data.projects.length,
      files: data.data.shared_files.length,
      notifications: data.data.notifications.length,
    };

    // Create backup directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'prisma', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    // Write data to file
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');

    console.log('✅ Export completed successfully!\n');
    console.log('📊 Statistics:');
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log(`\n💾 Backup saved to: ${filepath}`);
    console.log(`📦 File size: ${(fs.statSync(filepath).size / 1024 / 1024).toFixed(2)} MB\n`);

    // Also create a "latest" symlink/copy
    const latestPath = path.join(backupDir, 'latest.json');
    fs.copyFileSync(filepath, latestPath);
    console.log(`🔗 Latest backup: ${latestPath}\n`);

  } catch (error) {
    console.error('❌ Error exporting data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run export
exportData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
