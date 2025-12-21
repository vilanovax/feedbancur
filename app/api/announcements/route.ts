import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { uploadToLiara } from '@/lib/liara-storage';
import { randomUUID } from 'crypto';

const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  content: z.string().min(1, 'محتوا الزامی است'),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  departmentId: z.string().optional().nullable(), // null = برای همه
  isActive: z.boolean().optional(),
  scheduledAt: z.string().optional().nullable(),
});

// دریافت لیست اعلانات
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get('showAll') === 'true'; // برای صفحه مدیریت

    const where: any = {
      AND: [
        showAll ? {} : { isActive: true }, // فقط اعلانات فعال (مگر در حالت مدیریت)
        showAll ? {} : {
          OR: [
            { scheduledAt: null }, // اعلانات بدون زمان‌بندی
            { scheduledAt: { lte: new Date() } }, // اعلانات که زمانشان رسیده
          ],
        },
        {
          OR: [
            { departmentId: null }, // اعلانات عمومی
          ],
        },
      ],
    };

    // اگر کاربر در بخشی است، اعلانات آن بخش را هم نشان بده
    if (session.user.departmentId) {
      where.AND[2].OR.push({ departmentId: session.user.departmentId });
    }

    const announcements = await prisma.announcements.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        departments: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // آخرین 50 اعلان
    });

    // تبدیل به فرمت frontend
    const responseAnnouncements = announcements.map((announcement: any) => ({
      ...announcement,
      createdBy: announcement.users,
      department: announcement.departments,
      users: undefined,
      departments: undefined,
    }));

    return NextResponse.json(responseAnnouncements);
  } catch (error) {
    console.error('Get announcements error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اعلانات' },
      { status: 500 }
    );
  }
}

// بررسی نوع فایل مجاز
function isAllowedFileType(fileType: string): boolean {
  const allowedTypes = [
    'image/', // همه تصاویر
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/zip',
    'application/x-rar-compressed',
  ];
  
  return allowedTypes.some(type => fileType.startsWith(type));
}

// ایجاد اعلان جدید
export async function POST(req: NextRequest) {
  try {
    console.log('=== POST /api/announcements ===');
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // فقط ادمین و مدیران می‌توانند اعلان ایجاد کنند
    if (session.user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // بررسی مجوز مدیر برای ایجاد اعلان
    let managerDepartment = null;
    if (session.user.role === 'MANAGER') {
      if (!session.user.departmentId) {
        return NextResponse.json(
          { error: 'شما به هیچ بخشی تعلق ندارید' },
          { status: 403 }
        );
      }

      // دریافت اطلاعات بخش برای بررسی مجوز
      managerDepartment = await prisma.departments.findUnique({
        where: { id: session.user.departmentId },
        select: {
          canCreateAnnouncement: true,
          allowedAnnouncementDepartments: true
        },
      });

      if (!managerDepartment || !managerDepartment.canCreateAnnouncement) {
        return NextResponse.json(
          { error: 'شما مجوز ایجاد اعلان ندارید. لطفاً با مدیرعامل تماس بگیرید.' },
          { status: 403 }
        );
      }
    }

    // بررسی اینکه آیا FormData است یا JSON
    const contentType = req.headers.get('content-type') || '';
    let data: any;
    let attachments: Array<{ url: string; name: string }> = [];

    // بررسی اینکه آیا FormData است (ممکن است boundary هم داشته باشد)
    // در Next.js، وقتی FormData ارسال می‌شود، contentType شامل multipart/form-data است
    const isFormData = contentType.includes('multipart/form-data');
    
    console.log('Content-Type:', contentType);
    console.log('Is FormData:', isFormData);
    
    // اگر FormData است، آن را بخوان
    if (isFormData) {
      const formData = await req.formData();
      // اگر FormData است، فایل‌ها را آپلود کن
      
      // پردازش همه فایل‌های ارسال شده
      const fileCountStr = formData.get('fileCount');
      const fileCount = fileCountStr ? parseInt(fileCountStr as string) : 0;
      
      console.log('File count:', fileCount);
      
      // فقط ADMIN می‌تواند فایل اضافه کند
      if (session.user.role === 'ADMIN' && fileCount > 0) {
        // دریافت تنظیمات Object Storage
        const settings = await prisma.settings.findFirst();
        const objectStorageSettings = settings?.objectStorageSettings
          ? (typeof settings.objectStorageSettings === 'string'
              ? JSON.parse(settings.objectStorageSettings)
              : settings.objectStorageSettings)
          : { enabled: false };

        // بررسی فعال بودن Object Storage
        if (!objectStorageSettings.enabled) {
          return NextResponse.json(
            { error: 'Object Storage غیرفعال است. لطفاً در تنظیمات فعال کنید.' },
            { status: 400 }
          );
        }

        // پردازش همه فایل‌های ارسال شده
        for (let i = 0; i < fileCount; i++) {
          const file = formData.get(`attachment_${i}`) as File | null;
          
          if (file && file.size > 0) {
            // بررسی نوع فایل
            if (!isAllowedFileType(file.type)) {
              return NextResponse.json(
                { error: `نوع فایل "${file.name}" مجاز نیست. فایل‌های مجاز: تصاویر، PDF، Word، ZIP، RAR` },
                { status: 400 }
              );
            }

            // بررسی حجم فایل (حداکثر 10MB)
            if (file.size > 10 * 1024 * 1024) {
              return NextResponse.json(
                { error: `حجم فایل "${file.name}" نباید بیشتر از 10 مگابایت باشد` },
                { status: 400 }
              );
            }

            // آپلود فایل
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const fileExtension = file.name.split('.').pop() || 'bin';
            const fileName = `announcement-${timestamp}-${i}-${randomString}.${fileExtension}`;

            try {
              const fileUrl = await uploadToLiara(
                buffer,
                fileName,
                file.type,
                objectStorageSettings,
                'announcements'
              );
              attachments.push({
                url: fileUrl,
                name: file.name,
              });
              console.log('Announcement attachment uploaded to Liara:', fileUrl);
            } catch (uploadError: any) {
              console.error('Error uploading attachment to Liara:', uploadError);
              return NextResponse.json(
                { error: `خطا در آپلود فایل "${file.name}": ${uploadError.message || 'خطای نامشخص'}` },
                { status: 500 }
              );
            }
          }
        }
      }

      // استخراج داده‌های فرم
      const title = formData.get('title') as string;
      const content = formData.get('content') as string;
      
      console.log('Form data extracted:', {
        title: title?.substring(0, 50),
        content: content?.substring(0, 50),
        hasTitle: !!title,
        hasContent: !!content,
      });
      
      if (!title || !content) {
        return NextResponse.json(
          { error: 'عنوان و محتوا الزامی هستند' },
          { status: 400 }
        );
      }
      
      const priority = (formData.get('priority') as string) || 'MEDIUM';
      const departmentIdValue = formData.get('departmentId') as string | null;
      const departmentId = departmentIdValue && departmentIdValue.trim() !== '' ? departmentIdValue : null;
      const isActiveValue = formData.get('isActive');
      const isActive = isActiveValue === 'true' || isActiveValue === true || isActiveValue === '1';
      const scheduledAtValue = formData.get('scheduledAt') as string | null;
      
      data = {
        title,
        content,
        priority,
        departmentId: departmentId || null,
        isActive,
        scheduledAt: scheduledAtValue || null,
      };
      
      console.log('Parsed form data:', {
        title: data.title?.substring(0, 30),
        contentLength: data.content?.length,
        priority: data.priority,
        departmentId: data.departmentId,
        isActive: data.isActive,
        scheduledAt: data.scheduledAt,
      });
    } else {
      // اگر JSON است
      const body = await req.json();
      data = createAnnouncementSchema.parse(body);
    }

    // مدیران فقط برای بخش‌های مجاز اعلان ایجاد کنند
    if (session.user.role === 'MANAGER' && managerDepartment) {
      // MANAGER نمی‌تواند اعلان عمومی (برای همه) ایجاد کند
      if (data.departmentId === null) {
        return NextResponse.json(
          { error: 'فقط مدیرعامل می‌تواند اعلان عمومی ایجاد کند' },
          { status: 403 }
        );
      }

      // اگر بخشی مشخص نشده، خطا بده
      if (!data.departmentId) {
        return NextResponse.json(
          { error: 'لطفاً بخش مقصد را مشخص کنید' },
          { status: 400 }
        );
      }

      // بررسی دسترسی به بخش انتخاب شده
      const allowedDepts = managerDepartment.allowedAnnouncementDepartments || [];

      // اگر لیست بخش‌های مجاز خالی است، فقط به بخش خودش دسترسی دارد
      if (allowedDepts.length === 0) {
        if (data.departmentId !== session.user.departmentId) {
          return NextResponse.json(
            { error: 'شما فقط مجاز به ایجاد اعلان برای بخش خود هستید' },
            { status: 403 }
          );
        }
      } else {
        // اگر لیست مشخص شده، فقط برای بخش‌های مجاز می‌تواند اعلان بدهد
        if (!allowedDepts.includes(data.departmentId)) {
          return NextResponse.json(
            { error: 'شما مجاز به ایجاد اعلان برای این بخش نیستید' },
            { status: 403 }
          );
        }
      }
    }

    // تنظیم زمان انتشار
    const finalIsActive = data.isActive !== undefined ? data.isActive : true;
    let scheduledAt: Date | null = null;
    if (data.scheduledAt) {
      try {
        scheduledAt = new Date(data.scheduledAt);
        if (isNaN(scheduledAt.getTime())) {
          scheduledAt = null;
        }
      } catch (e) {
        scheduledAt = null;
      }
    }
    const publishedAt = finalIsActive && !scheduledAt ? new Date() : null;

    // آماده‌سازی attachments برای ذخیره
    let attachmentsData: any = null;
    if (attachments.length > 0) {
      attachmentsData = attachments;
    }

    const finalDepartmentId = data.departmentId === null || data.departmentId === undefined || data.departmentId === '' ? null : data.departmentId;

    console.log('Creating announcement with data:', {
      title: data.title?.substring(0, 50),
      contentLength: data.content?.length,
      priority: data.priority,
      departmentId: data.departmentId,
      finalDepartmentId,
      isActive: finalIsActive,
      scheduledAt,
      hasAttachments: attachments.length > 0,
      attachmentsCount: attachments.length,
      createdById: session.user.id,
      userRole: session.user.role,
    });

    try {
      const announcement = await prisma.announcements.create({
        data: {
          id: randomUUID(),
          updatedAt: new Date(),
          title: data.title,
          content: data.content,
          priority: data.priority || 'MEDIUM',
          departmentId: finalDepartmentId,
          isActive: finalIsActive,
          scheduledAt,
          publishedAt,
          createdById: session.user.id,
          attachments: attachmentsData,
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          departments: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      console.log('Announcement created successfully:', announcement.id);

      // تبدیل به فرمت frontend
      const responseAnnouncement = {
        ...announcement,
        createdBy: (announcement as any).users,
        department: (announcement as any).departments,
        users: undefined,
        departments: undefined,
      };

      return NextResponse.json(responseAnnouncement, { status: 201 });
    } catch (dbError: any) {
      console.error('Database error creating announcement:', dbError);
      console.error('Error code:', dbError.code);
      console.error('Error message:', dbError.message);
      console.error('Error meta:', dbError.meta);
      throw dbError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Create announcement error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: 'خطا در ایجاد اعلان',
        details: error instanceof Error ? error.message : 'خطای نامشخص'
      },
      { status: 500 }
    );
  }
}
