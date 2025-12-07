import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Default status texts
const DEFAULT_STATUS_TEXTS = {
  PENDING: "در انتظار",
  REVIEWED: "بررسی شده",
  ARCHIVED: "آرشیو شده",
  DEFERRED: "رسیدگی آینده",
  COMPLETED: "انجام شد",
};

// Default feedback types
const DEFAULT_FEEDBACK_TYPES = [
  { key: "SUGGESTION", label: "پیشنهادی" },
  { key: "CRITICAL", label: "انتقادی" },
  { key: "SURVEY", label: "نظرسنجی" },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // همه کاربران می‌توانند feedbackTypes را ببینند (برای فرم ثبت فیدبک)
    // اما فقط ADMIN و MANAGER می‌توانند تنظیمات کامل را ببینند

    // Check if Prisma client is properly initialized
    if (!prisma) {
      console.error("Prisma client is not initialized");
      // Return default settings if Prisma is not available
      return NextResponse.json({
        statusTexts: DEFAULT_STATUS_TEXTS,
      });
    }

    // Try to access settings model
    try {
      if (typeof prisma.settings === 'undefined' || prisma.settings === null) {
        console.error("Prisma settings model is not available");
        // Return default settings if Settings model is not available
        return NextResponse.json({
          statusTexts: DEFAULT_STATUS_TEXTS,
        });
      }
    } catch (checkError) {
      console.error("Error checking Prisma settings model:", checkError);
      // Return default settings on error
      return NextResponse.json({
        statusTexts: DEFAULT_STATUS_TEXTS,
      });
    }

    // دریافت تنظیمات از دیتابیس
    const dbSettings = await prisma.settings.findFirst();
    
    // تنظیمات پیش‌فرض
    const settings = {
      logoUrl: dbSettings?.logoUrl || "/logo.png",
      siteName: dbSettings?.siteName || "سیستم فیدبک کارمندان",
      statusTexts: dbSettings?.statusTexts 
        ? (Array.isArray(dbSettings.statusTexts)
            ? dbSettings.statusTexts
            : typeof dbSettings.statusTexts === 'object' 
            ? (() => {
                // تبدیل object به array با ترتیب پیش‌فرض
                const order = ["PENDING", "REVIEWED", "ARCHIVED", "DEFERRED", "COMPLETED"];
                return order.map((key) => ({
                  key,
                  label: dbSettings.statusTexts[key] || DEFAULT_STATUS_TEXTS[key] || key,
                }));
              })()
            : typeof dbSettings.statusTexts === 'string'
            ? JSON.parse(dbSettings.statusTexts)
            : (() => {
                // تبدیل DEFAULT_STATUS_TEXTS به array
                return Object.entries(DEFAULT_STATUS_TEXTS).map(([key, label]) => ({
                  key,
                  label,
                }));
              })())
        : (() => {
            // تبدیل DEFAULT_STATUS_TEXTS به array
            return Object.entries(DEFAULT_STATUS_TEXTS).map(([key, label]) => ({
              key,
              label,
            }));
          })(),
      feedbackTypes: dbSettings?.feedbackTypes
        ? (Array.isArray(dbSettings.feedbackTypes)
            ? dbSettings.feedbackTypes
            : typeof dbSettings.feedbackTypes === 'string'
            ? JSON.parse(dbSettings.feedbackTypes)
            : DEFAULT_FEEDBACK_TYPES)
        : DEFAULT_FEEDBACK_TYPES,
      notificationSettings: dbSettings?.notificationSettings
        ? (typeof dbSettings.notificationSettings === 'string'
            ? JSON.parse(dbSettings.notificationSettings)
            : dbSettings.notificationSettings)
        : {
            directFeedbackToManager: true,
            feedbackCompletedByManager: true,
          },
    };

    // اگر ADMIN است، همه تنظیمات را برگردان
    // اگر MANAGER است، statusTexts و feedbackTypes را برگردان
    // اگر EMPLOYEE است، فقط feedbackTypes را برگردان
    if (session.user.role === "ADMIN") {
      return NextResponse.json(settings);
    } else if (session.user.role === "MANAGER") {
      return NextResponse.json({
        statusTexts: settings.statusTexts,
        feedbackTypes: settings.feedbackTypes,
      });
    } else {
      // EMPLOYEE: فقط feedbackTypes را برگردان
      return NextResponse.json({
        feedbackTypes: settings.feedbackTypes,
      });
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    // در صورت خطا، فقط statusTexts پیش‌فرض را برگردان
    return NextResponse.json({
      statusTexts: DEFAULT_STATUS_TEXTS,
    }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if Prisma client is properly initialized
    if (!prisma) {
      console.error("Prisma client is not initialized");
      return NextResponse.json(
        { error: "Database connection error", message: "Prisma client is not initialized" },
        { status: 500 }
      );
    }

    // Debug: Log available Prisma models
    console.log("Prisma client available models:", Object.keys(prisma).filter(key => !key.startsWith('_') && typeof prisma[key as keyof typeof prisma] === 'object'));

    // Try to access settings model - if it doesn't exist, it will be undefined
    // This can happen if Prisma client wasn't regenerated or server needs restart
    try {
      if (typeof prisma.settings === 'undefined' || prisma.settings === null) {
        const availableModels = Object.keys(prisma).filter(key => !key.startsWith('_') && typeof prisma[key as keyof typeof prisma] === 'object');
        console.error("Prisma settings model is not available. Available models:", availableModels);
        return NextResponse.json(
          { error: "Database connection error", message: "Settings model is not available. Please restart the development server after running 'npx prisma generate'" },
          { status: 500 }
        );
      }
    } catch (checkError: any) {
      console.error("Error checking Prisma settings model:", checkError);
      console.error("Error stack:", checkError?.stack);
      return NextResponse.json(
        { error: "Database connection error", message: "Error accessing Settings model. Please restart the development server." },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log("Received body keys:", Object.keys(body));
    console.log("Body statusTexts:", body.statusTexts);

    // دریافت تنظیمات موجود یا ایجاد جدید
    let existingSettings;
    try {
      existingSettings = await prisma.settings.findFirst();
      console.log("Existing settings found:", !!existingSettings);
    } catch (dbError) {
      console.error("Error fetching existing settings:", dbError);
      throw dbError;
    }
    
    // آماده‌سازی داده‌ها برای ذخیره
    const updateData: any = {};

    // ذخیره siteName (اجباری)
    if (body.siteName !== undefined && body.siteName !== null) {
      updateData.siteName = body.siteName;
    } else if (!existingSettings) {
      updateData.siteName = "سیستم فیدبک کارمندان";
    }

    // ذخیره لوگو
    if (body.logoUrl !== undefined) {
      updateData.logoUrl = body.logoUrl || null;
    }

    // ذخیره siteDescription
    if (body.siteDescription !== undefined) {
      updateData.siteDescription = body.siteDescription || null;
    }

    // ذخیره statusTexts
    if (body.statusTexts) {
      if (Array.isArray(body.statusTexts)) {
        // اگر array است، همان را ذخیره کن (ترتیب حفظ می‌شود)
        updateData.statusTexts = body.statusTexts;
      } else if (typeof body.statusTexts === 'object' && !Array.isArray(body.statusTexts)) {
        // اگر object است، به array تبدیل کن با ترتیب پیش‌فرض
        const validStatuses: Array<keyof typeof DEFAULT_STATUS_TEXTS> = ["PENDING", "REVIEWED", "ARCHIVED", "DEFERRED", "COMPLETED"];
        const statusTextsArray = validStatuses.map((status) => ({
          key: status,
          label: body.statusTexts[status] && typeof body.statusTexts[status] === "string" 
            ? body.statusTexts[status] 
            : DEFAULT_STATUS_TEXTS[status],
        }));
        updateData.statusTexts = statusTextsArray;
      }
    } else if (!existingSettings) {
      // تبدیل DEFAULT_STATUS_TEXTS به array
      const defaultArray = Object.entries(DEFAULT_STATUS_TEXTS).map(([key, label]) => ({
        key,
        label,
      }));
      updateData.statusTexts = defaultArray;
    }

    // ذخیره feedbackTypes
    if (body.feedbackTypes && Array.isArray(body.feedbackTypes)) {
      // اعتبارسنجی ساختار feedbackTypes
      const validFeedbackTypes: Array<{ key: string; label: string }> = [];
      
      for (const item of body.feedbackTypes) {
        if (
          item &&
          typeof item === 'object' &&
          typeof item.key === 'string' &&
          typeof item.label === 'string' &&
          item.key.trim() !== '' &&
          item.label.trim() !== ''
        ) {
          validFeedbackTypes.push({
            key: item.key.trim().toUpperCase(),
            label: item.label, // حفظ فاصله‌ها در label
          });
        }
      }

      // حداقل یک نوع باید وجود داشته باشد
      if (validFeedbackTypes.length > 0) {
        updateData.feedbackTypes = validFeedbackTypes;
      } else if (!existingSettings) {
        updateData.feedbackTypes = DEFAULT_FEEDBACK_TYPES;
      }
    } else if (!existingSettings) {
      updateData.feedbackTypes = DEFAULT_FEEDBACK_TYPES;
    }

    // ذخیره notificationSettings
    if (body.notificationSettings && typeof body.notificationSettings === 'object') {
      updateData.notificationSettings = {
        directFeedbackToManager: body.notificationSettings.directFeedbackToManager !== undefined 
          ? Boolean(body.notificationSettings.directFeedbackToManager)
          : true,
        feedbackCompletedByManager: body.notificationSettings.feedbackCompletedByManager !== undefined
          ? Boolean(body.notificationSettings.feedbackCompletedByManager)
          : true,
      };
    } else if (!existingSettings) {
      updateData.notificationSettings = {
        directFeedbackToManager: true,
        feedbackCompletedByManager: true,
      };
    }

    // ذخیره سایر فیلدها
    if (body.language !== undefined) updateData.language = body.language;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.emailNotifications !== undefined) updateData.emailNotifications = Boolean(body.emailNotifications);
    if (body.smsNotifications !== undefined) updateData.smsNotifications = Boolean(body.smsNotifications);
    if (body.pushNotifications !== undefined) updateData.pushNotifications = Boolean(body.pushNotifications);
    if (body.requirePasswordChange !== undefined) updateData.requirePasswordChange = Boolean(body.requirePasswordChange);
    if (body.sessionTimeout !== undefined) updateData.sessionTimeout = Number(body.sessionTimeout);
    if (body.twoFactorAuth !== undefined) updateData.twoFactorAuth = Boolean(body.twoFactorAuth);
    if (body.allowAnonymous !== undefined) updateData.allowAnonymous = Boolean(body.allowAnonymous);
    if (body.autoArchiveDays !== undefined) updateData.autoArchiveDays = Number(body.autoArchiveDays);
    if (body.maxFeedbackLength !== undefined) updateData.maxFeedbackLength = Number(body.maxFeedbackLength);
    if (body.itemsPerPage !== undefined) updateData.itemsPerPage = Number(body.itemsPerPage);
    if (body.theme !== undefined) updateData.theme = body.theme;

    console.log("Update data keys:", Object.keys(updateData));

    // ذخیره یا به‌روزرسانی در دیتابیس
    if (existingSettings) {
      // فقط فیلدهایی که واقعاً تغییر کرده‌اند را به‌روزرسانی کن
      if (Object.keys(updateData).length > 0) {
        console.log("Updating settings with data:", JSON.stringify(updateData, null, 2));
        await prisma.settings.update({
          where: { id: existingSettings.id },
          data: updateData,
        });
        console.log("Settings updated successfully");
      }
    } else {
      console.log("Creating new settings");
      // ایجاد تنظیمات جدید با مقادیر پیش‌فرض
      const createData: any = {
        siteName: updateData.siteName || "سیستم فیدبک کارمندان",
        siteDescription: updateData.siteDescription || null,
        logoUrl: updateData.logoUrl || null,
        statusTexts: updateData.statusTexts || (() => {
          // تبدیل DEFAULT_STATUS_TEXTS به array
          return Object.entries(DEFAULT_STATUS_TEXTS).map(([key, label]) => ({
            key,
            label,
          }));
        })(),
        feedbackTypes: updateData.feedbackTypes || DEFAULT_FEEDBACK_TYPES,
        language: updateData.language || "fa",
        timezone: updateData.timezone || "Asia/Tehran",
        emailNotifications: updateData.emailNotifications !== undefined ? updateData.emailNotifications : true,
        smsNotifications: updateData.smsNotifications !== undefined ? updateData.smsNotifications : false,
        pushNotifications: updateData.pushNotifications !== undefined ? updateData.pushNotifications : true,
        requirePasswordChange: updateData.requirePasswordChange !== undefined ? updateData.requirePasswordChange : false,
        sessionTimeout: updateData.sessionTimeout !== undefined ? updateData.sessionTimeout : 30,
        twoFactorAuth: updateData.twoFactorAuth !== undefined ? updateData.twoFactorAuth : false,
        allowAnonymous: updateData.allowAnonymous !== undefined ? updateData.allowAnonymous : true,
        autoArchiveDays: updateData.autoArchiveDays !== undefined ? updateData.autoArchiveDays : 90,
        maxFeedbackLength: updateData.maxFeedbackLength !== undefined ? updateData.maxFeedbackLength : 5000,
        itemsPerPage: updateData.itemsPerPage !== undefined ? updateData.itemsPerPage : 20,
        theme: updateData.theme || "light",
      };
      console.log("Creating settings with data:", JSON.stringify(createData, null, 2));
      await prisma.settings.create({
        data: createData,
      });
      console.log("Settings created successfully");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving settings:", error);
    console.error("Error details:", error?.message || String(error));
    console.error("Error code:", error?.code);
    console.error("Error meta:", error?.meta);
    console.error("Error stack:", error?.stack);
    
    // Return detailed error for debugging
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error?.message || String(error),
        code: error?.code,
        meta: error?.meta
      },
      { status: 500 }
    );
  }
}

