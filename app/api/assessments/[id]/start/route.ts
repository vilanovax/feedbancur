import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// POST /api/assessments/[id]/start - شروع یا ادامه آزمون
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // بررسی دسترسی کاربر به آزمون
    let assessment;
    try {
      assessment = await prisma.assessments.findUnique({
        where: { id },
        include: {
          assessment_questions: {
            orderBy: { order: "asc" },
          },
          assessment_assignments: {
            where: {
              departmentId: session.user.departmentId || undefined,
            },
          },
        },
      });
    } catch (dbError: any) {
      console.error("Database error fetching assessment:", dbError);
      // اگر خطا مربوط به enum است، احتمالاً Prisma Client به‌روز نشده
      if (dbError.message?.includes("not found in enum") || dbError.code === "P2003") {
        return NextResponse.json(
          { 
            error: "Database schema mismatch. Please restart the server.",
            details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
          },
          { status: 500 }
        );
      }
      throw dbError;
    }

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // بررسی فعال بودن آزمون
    if (!assessment.isActive) {
      return NextResponse.json(
        { error: "این آزمون غیرفعال است" },
        { status: 403 }
      );
    }

    // بررسی تخصیص آزمون به بخش کاربر (برای غیر ادمین)
    if (session.user.role !== "ADMIN") {
      if (!session.user.departmentId) {
        return NextResponse.json(
          { error: "شما به هیچ بخشی تخصیص داده نشده‌اید" },
          { status: 403 }
        );
      }

      if (assessment.assessment_assignments.length === 0) {
        return NextResponse.json(
          { error: "این آزمون به بخش شما تخصیص داده نشده است" },
          { status: 403 }
        );
      }
    }

    // بررسی وجود پیشرفت قبلی
    let existingProgress = await prisma.assessment_progress.findFirst({
      where: {
        assessmentId: id,
        userId: session.user.id,
      },
    });

    // بررسی نتیجه قبلی
    const existingResult = await prisma.assessment_results.findFirst({
      where: {
        assessmentId: id,
        userId: session.user.id,
      },
    });

    // اگر قبلاً تکمیل کرده و allowRetake فالس است
    if (existingResult && !assessment.allowRetake) {
      return NextResponse.json(
        { error: "شما قبلاً این آزمون را تکمیل کرده‌اید و امکان تکرار وجود ندارد" },
        { status: 403 }
      );
    }

    // اگر پیشرفت جدیدی شروع می‌شود، progress قبلی را پاک کنیم
    if (existingResult && assessment.allowRetake && existingProgress) {
      try {
        await prisma.assessment_progress.deleteMany({
          where: {
            assessmentId: id,
            userId: session.user.id,
          },
        });
        existingProgress = null;
      } catch (deleteError: any) {
        console.error('Error deleting existing progress:', deleteError);
        // Continue anyway - we'll try to create/update below
      }
    }

    // ایجاد یا به‌روزرسانی پیشرفت
    let progress;
    if (!existingProgress || (existingResult && assessment.allowRetake)) {
      // حذف همه progress های قبلی برای این کاربر و آزمون
      try {
        await prisma.assessment_progress.deleteMany({
          where: {
            assessmentId: id,
            userId: session.user.id,
          },
        });
      } catch (deleteError: any) {
        console.error('Error deleting old progress:', deleteError);
        // Continue anyway
      }
      
      // ایجاد progress جدید
      try {
        progress = await prisma.assessment_progress.create({
          data: {
            id: crypto.randomUUID(),
            assessmentId: id,
            userId: session.user.id,
            startedAt: new Date(),
            answers: {},
            lastQuestion: 0,
            updatedAt: new Date(),
          },
        });
      } catch (createError: any) {
        console.error('Error creating progress:', createError);
        // اگر create با خطا مواجه شد (مثلاً unique constraint)، سعی می‌کنیم update کنیم
        if (createError.code === 'P2002') {
          // Unique constraint violation - try to update existing
          const existing = await prisma.assessment_progress.findFirst({
            where: {
              assessmentId: id,
              userId: session.user.id,
            },
          });
          
          if (existing) {
            progress = await prisma.assessment_progress.update({
              where: { id: existing.id },
              data: {
                startedAt: new Date(),
                answers: {},
                lastQuestion: 0,
              },
            });
          } else {
            throw createError;
          }
        } else {
          throw createError;
        }
      }
    } else {
      progress = existingProgress;
    }

    // Process questions and ensure options are properly formatted
    const processedQuestions = (assessment as any).assessment_questions.map((q: any) => {
      try {
        // Prisma returns Json fields as parsed objects, but we need to ensure it's serializable
        let options: any = q.options;
        
// If options is null or undefined, set to empty array
        if (options === null || options === undefined) {
          options = [];
        }
        
        // If options is already an array, use it directly
        if (Array.isArray(options)) {
          // Ensure all items are serializable
          options = options.map((opt: any, index: number) => {
            if (typeof opt === 'string') {
              return { text: opt, value: String(index) };
            }
            if (typeof opt === 'object' && opt !== null) {
              return {
                text: opt.text || opt.label || opt.content || String(opt),
                value: opt.value || opt.id || String(index),
                score: opt.score || undefined,
              };
            }
            return { text: String(opt), value: String(index) };
          });
        }
        // If options is an object (not array), try to convert
        else if (typeof options === 'object' && options !== null) {
          const keys = Object.keys(options);
          if (keys.length > 0) {
            // Check if first key contains an array
            const firstKey = keys[0];
            if (Array.isArray(options[firstKey])) {
              options = options[firstKey];
            } else {
              // Convert object to array
              options = Object.values(options);
            }
          } else {
            options = [];
          }
        }
        // If options is a string, try to parse
        else if (typeof options === 'string') {
          try {
            const parsed = JSON.parse(options);
            options = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            console.error('Error parsing options string:', e, 'Question ID:', q.id);
            options = [];
          }
        }
        // Fallback to empty array
        else {
          options = [];
        }
        
        return {
          id: q.id,
          questionText: q.questionText || '',
          questionType: q.questionType,
          options: Array.isArray(options) ? options : [],
          order: q.order || 0,
          isRequired: q.isRequired !== undefined ? q.isRequired : true,
          image: q.image || null,
        };
      } catch (error: any) {
        console.error('Error processing question:', q.id, error?.message);
        // Return question with empty options if there's an error
        return {
          id: q.id,
          questionText: q.questionText || '',
          questionType: q.questionType,
          options: [],
          order: q.order || 0,
          isRequired: q.isRequired !== undefined ? q.isRequired : true,
          image: q.image || null,
        };
      }
    });

    // Process progress answers
    let progressAnswers: Record<string, any> = {};
    try {
      if (progress.answers && typeof progress.answers === 'object') {
        progressAnswers = progress.answers as Record<string, any>;
      }
    } catch (e) {
      console.error('Error processing progress answers:', e);
      progressAnswers = {};
    }

    // بازگرداندن داده‌های آزمون
    const responseData = {
      assessment: {
        id: assessment.id,
        title: assessment.title || '',
        description: assessment.description || null,
        type: assessment.type,
        instructions: assessment.instructions || null,
        timeLimit: assessment.timeLimit || null,
        showResults: assessment.showResults !== undefined ? assessment.showResults : true,
        totalQuestions: processedQuestions.length,
      },
      questions: processedQuestions,
      progress: {
        id: progress.id,
        answers: progressAnswers,
        lastQuestion: progress.lastQuestion || 0,
        startedAt: progress.startedAt ? progress.startedAt.toISOString() : new Date().toISOString(),
      },
    };

    // Try to serialize to check for errors
    try {
      JSON.stringify(responseData);
    } catch (serializeError: any) {
      console.error('Error serializing response data:', serializeError);
      throw new Error(`Serialization error: ${serializeError?.message}`);
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error starting assessment:", error);
    console.error("Error stack:", error?.stack);
    console.error("Error message:", error?.message);
    console.error("Error name:", error?.name);
    
    // Try to get more details about the error
    let errorDetails = error?.message || "Unknown error";
    if (error?.cause) {
      errorDetails += ` | Cause: ${error.cause}`;
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}
