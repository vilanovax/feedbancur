import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FILE_SHARE_SETTINGS } from "@/lib/file-validation";

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
      siteDescription: dbSettings?.siteDescription || "سیستم مدیریت و اندازه‌گیری فیدبک کارمندان",
      language: dbSettings?.language || "fa",
      timezone: dbSettings?.timezone || "Asia/Tehran",
      emailNotifications: dbSettings?.emailNotifications ?? true,
      smsNotifications: dbSettings?.smsNotifications ?? false,
      pushNotifications: dbSettings?.pushNotifications ?? true,
      requirePasswordChange: dbSettings?.requirePasswordChange ?? false,
      sessionTimeout: dbSettings?.sessionTimeout ?? 30,
      twoFactorAuth: dbSettings?.twoFactorAuth ?? false,
      allowAnonymous: dbSettings?.allowAnonymous ?? true,
      autoArchiveDays: dbSettings?.autoArchiveDays ?? 90,
      maxFeedbackLength: dbSettings?.maxFeedbackLength ?? 5000,
      itemsPerPage: dbSettings?.itemsPerPage ?? 20,
      theme: dbSettings?.theme || "light",
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
      chatSettings: dbSettings?.chatSettings
        ? (typeof dbSettings.chatSettings === 'string'
            ? JSON.parse(dbSettings.chatSettings)
            : dbSettings.chatSettings)
        : {
            maxFileSize: 5,
            allowedFileTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
          },
      objectStorageSettings: dbSettings?.objectStorageSettings
        ? (typeof dbSettings.objectStorageSettings === 'string'
            ? JSON.parse(dbSettings.objectStorageSettings)
            : dbSettings.objectStorageSettings)
        : {
            enabled: false,
            endpoint: "https://storage.c2.liara.space",
            accessKeyId: "3ipqq41nabtsqsdh",
            secretAccessKey: "49ae07a8-d515-4700-8daa-65ef98da8cab",
            bucket: "feedban",
            region: "us-east-1",
          },
      workingHoursSettings: dbSettings?.workingHoursSettings
        ? (typeof dbSettings.workingHoursSettings === 'string'
            ? JSON.parse(dbSettings.workingHoursSettings)
            : dbSettings.workingHoursSettings)
        : {
            enabled: false,
            startHour: 8,
            endHour: 17,
            workingDays: [6, 0, 1, 2, 3], // شنبه تا چهارشنبه
            holidays: [],
          },
      openAISettings: dbSettings?.openAISettings
        ? (typeof dbSettings.openAISettings === 'string'
            ? JSON.parse(dbSettings.openAISettings)
            : dbSettings.openAISettings)
        : {
            enabled: false,
            apiKey: "",
            model: "gpt-3.5-turbo",
          },
      teamStatusSettings: dbSettings?.teamStatusSettings
        ? (typeof dbSettings.teamStatusSettings === 'string'
            ? JSON.parse(dbSettings.teamStatusSettings)
            : dbSettings.teamStatusSettings)
        : {
            enabled: true,
            onlineThresholdMinutes: 5,
            managerAccess: {
              canViewOwnDepartment: true,
              canViewOtherDepartments: false,
              allowedDepartments: [],
            },
            employeeAccess: {
              canViewOwnDepartment: true,
              canViewOtherDepartments: false,
              allowedDepartments: [],
            },
          },
      fileShareSettings: dbSettings?.fileShareSettings
        ? (typeof dbSettings.fileShareSettings === 'string'
            ? JSON.parse(dbSettings.fileShareSettings)
            : {
                ...DEFAULT_FILE_SHARE_SETTINGS,
                ...(dbSettings.fileShareSettings as any),
              })
        : DEFAULT_FILE_SHARE_SETTINGS,
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

    // دریافت تنظیمات موجود یا ایجاد جدید
    let existingSettings;
    try {
      existingSettings = await prisma.settings.findFirst();
    } catch (dbError) {
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

    // ذخیره chatSettings
    if (body.chatSettings && typeof body.chatSettings === 'object') {
      const maxFileSize = Number(body.chatSettings.maxFileSize) || 5;
      const allowedFileTypes = Array.isArray(body.chatSettings.allowedFileTypes) 
        ? body.chatSettings.allowedFileTypes.filter((t: string) => typeof t === 'string')
        : ["image/jpeg"];
      
      // حداقل یک نوع باید وجود داشته باشد
      if (allowedFileTypes.length > 0) {
        updateData.chatSettings = {
          maxFileSize: Math.max(1, Math.min(50, maxFileSize)), // بین 1 تا 50 مگابایت
          allowedFileTypes: allowedFileTypes,
        };
      }
    } else if (!existingSettings) {
      updateData.chatSettings = {
        maxFileSize: 5,
        allowedFileTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      };
    }

    // ذخیره objectStorageSettings
    if (body.objectStorageSettings && typeof body.objectStorageSettings === 'object') {
      updateData.objectStorageSettings = {
        enabled: Boolean(body.objectStorageSettings.enabled),
        endpoint: String(body.objectStorageSettings.endpoint || ""),
        accessKeyId: String(body.objectStorageSettings.accessKeyId || ""),
        secretAccessKey: String(body.objectStorageSettings.secretAccessKey || ""),
        bucket: String(body.objectStorageSettings.bucket || ""),
        region: String(body.objectStorageSettings.region || "us-east-1"),
      };
    } else if (!existingSettings) {
      updateData.objectStorageSettings = {
        enabled: false,
        endpoint: "",
        accessKeyId: "",
        secretAccessKey: "",
        bucket: "",
        region: "us-east-1",
      };
    }

    // ذخیره workingHoursSettings
    if (body.workingHoursSettings && typeof body.workingHoursSettings === 'object') {
      updateData.workingHoursSettings = {
        enabled: Boolean(body.workingHoursSettings.enabled),
        startHour: Number(body.workingHoursSettings.startHour) || 8,
        endHour: Number(body.workingHoursSettings.endHour) || 17,
        workingDays: Array.isArray(body.workingHoursSettings.workingDays)
          ? body.workingHoursSettings.workingDays.filter((d: any) => typeof d === 'number')
          : [6, 0, 1, 2, 3],
        holidays: Array.isArray(body.workingHoursSettings.holidays)
          ? body.workingHoursSettings.holidays.filter((h: any) => typeof h === 'string')
          : [],
      };
    } else if (!existingSettings) {
      updateData.workingHoursSettings = {
        enabled: false,
        startHour: 8,
        endHour: 17,
        workingDays: [6, 0, 1, 2, 3],
        holidays: [],
      };
    }

    // ذخیره openAISettings
    if (body.openAISettings && typeof body.openAISettings === 'object') {
      updateData.openAISettings = {
        enabled: Boolean(body.openAISettings.enabled),
        apiKey: String(body.openAISettings.apiKey || ""),
        model: String(body.openAISettings.model || "gpt-3.5-turbo"),
      };
    } else if (!existingSettings) {
      updateData.openAISettings = {
        enabled: false,
        apiKey: "",
        model: "gpt-3.5-turbo",
      };
    }

    // ذخیره teamStatusSettings
    if (body.teamStatusSettings && typeof body.teamStatusSettings === 'object') {
      updateData.teamStatusSettings = {
        enabled: body.teamStatusSettings.enabled !== undefined
          ? Boolean(body.teamStatusSettings.enabled)
          : true,
        onlineThresholdMinutes: Number(body.teamStatusSettings.onlineThresholdMinutes) || 5,
        managerAccess: body.teamStatusSettings.managerAccess
          ? {
              canViewOwnDepartment: Boolean(body.teamStatusSettings.managerAccess.canViewOwnDepartment),
              canViewOtherDepartments: Boolean(body.teamStatusSettings.managerAccess.canViewOtherDepartments),
              allowedDepartments: Array.isArray(body.teamStatusSettings.managerAccess.allowedDepartments)
                ? body.teamStatusSettings.managerAccess.allowedDepartments.filter((d: any) => typeof d === 'string')
                : [],
            }
          : {
              canViewOwnDepartment: true,
              canViewOtherDepartments: false,
              allowedDepartments: [],
            },
        employeeAccess: body.teamStatusSettings.employeeAccess
          ? {
              canViewOwnDepartment: Boolean(body.teamStatusSettings.employeeAccess.canViewOwnDepartment),
              canViewOtherDepartments: Boolean(body.teamStatusSettings.employeeAccess.canViewOtherDepartments),
              allowedDepartments: Array.isArray(body.teamStatusSettings.employeeAccess.allowedDepartments)
                ? body.teamStatusSettings.employeeAccess.allowedDepartments.filter((d: any) => typeof d === 'string')
                : [],
            }
          : {
              canViewOwnDepartment: true,
              canViewOtherDepartments: false,
              allowedDepartments: [],
            },
      };
    } else if (!existingSettings) {
      updateData.teamStatusSettings = {
        enabled: true,
        onlineThresholdMinutes: 5,
        managerAccess: {
          canViewOwnDepartment: true,
          canViewOtherDepartments: false,
          allowedDepartments: [],
        },
        employeeAccess: {
          canViewOwnDepartment: true,
          canViewOtherDepartments: false,
          allowedDepartments: [],
        },
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

    // ذخیره یا به‌روزرسانی در دیتابیس
    if (existingSettings) {
      // فقط فیلدهایی که واقعاً تغییر کرده‌اند را به‌روزرسانی کن
      if (Object.keys(updateData).length > 0) {
        await prisma.settings.update({
          where: { id: existingSettings.id },
          data: updateData,
        });
      }
    } else {
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
        notificationSettings: updateData.notificationSettings || {
          directFeedbackToManager: true,
          feedbackCompletedByManager: true,
        },
        chatSettings: updateData.chatSettings || {
          maxFileSize: 5,
          allowedFileTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
        },
        objectStorageSettings: updateData.objectStorageSettings || {
          enabled: false,
          endpoint: "",
          accessKeyId: "",
          secretAccessKey: "",
          bucket: "",
          region: "us-east-1",
        },
        workingHoursSettings: updateData.workingHoursSettings || {
          enabled: false,
          startHour: 8,
          endHour: 17,
          workingDays: [6, 0, 1, 2, 3],
          holidays: [],
        },
        openAISettings: updateData.openAISettings || {
          enabled: false,
          apiKey: "",
          model: "gpt-3.5-turbo",
        },
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
      await prisma.settings.create({
        data: createData,
      });
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

