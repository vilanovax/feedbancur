import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// کش کوتاه‌مدت برای دادهٔ کاربر در session تا در هر درخواست به DB نزنیم
const SESSION_USER_CACHE_TTL_MS = 60 * 1000; // ۱ دقیقه
const sessionUserCache = new Map<
  string,
  { avatar: string | null; name: string; email: string | null; mustChangePassword: boolean; timestamp: number }
>();

function getCachedSessionUser(userId: string) {
  const entry = sessionUserCache.get(userId);
  if (!entry || Date.now() - entry.timestamp > SESSION_USER_CACHE_TTL_MS) {
    return null;
  }
  return entry;
}

function setCachedSessionUser(
  userId: string,
  data: { avatar: string | null; name: string; email: string | null; mustChangePassword: boolean }
) {
  sessionUserCache.set(userId, { ...data, timestamp: Date.now() });
  // محدود کردن اندازه کش (حداکثر ۵۰۰ کاربر)
  if (sessionUserCache.size > 500) {
    const oldest = [...sessionUserCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    oldest.slice(0, 100).forEach(([k]) => sessionUserCache.delete(k));
  }
}

/** بعد از به‌روزرسانی پروفایل از API (بدون session.update) این را صدا بزن تا کش یک کاربر پاک شود */
export function invalidateSessionUserCache(userId: string) {
  sessionUserCache.delete(userId);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        mobile: { label: "Mobile", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.mobile || !credentials?.password) {
            return null;
          }

          const user = await prisma.users.findUnique({
            where: { mobile: credentials.mobile },
            include: { departments: true },
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // بررسی فعال بودن کاربر (اگر فیلد وجود نداشت، به عنوان فعال در نظر بگیر)
          if (user.isActive === false) {
            throw new Error("حساب کاربری شما غیرفعال است. لطفاً با مدیر سیستم تماس بگیرید.");
          }

          const userObject = {
            id: user.id,
            mobile: user.mobile,
            email: user.email ?? undefined,
            name: user.name,
            role: user.role,
            departmentId: user.departmentId ?? null,
            statusId: (user as any).statusId ?? null, // استفاده از type assertion برای جلوگیری از خطای TypeScript
            mustChangePassword: user.mustChangePassword ?? false,
            // avatar را در JWT token نگه نمی‌داریم چون base64 string خیلی بزرگ است
          };
          return userObject;
        } catch (error) {
          console.error("❌ Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.mobile = user.mobile;
        token.role = user.role;
        token.departmentId = user.departmentId;
        token.statusId = (user as any).statusId ?? null;
        token.mustChangePassword = (user as any).mustChangePassword ?? false;
        // avatar را در JWT token نگه نمی‌داریم چون base64 string خیلی بزرگ است
        // و باعث خطای 431 (Request Header Fields Too Large) می‌شود
      }
      
      // وقتی update() فراخوانی می‌شود، اطلاعات کاربر را از دیتابیس بخوان و کش session را هم به‌روز کن
      if (trigger === "update" && token.id) {
        try {
          const updatedUser = await prisma.users.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              name: true,
              mobile: true,
              email: true,
              role: true,
              departmentId: true,
              statusId: true,
              mustChangePassword: true,
              avatar: true,
              departments: { select: { id: true, name: true } },
            },
          });
          
          if (updatedUser) {
            token.name = updatedUser.name;
            token.mobile = updatedUser.mobile;
            token.email = updatedUser.email ?? undefined;
            token.role = updatedUser.role;
            token.departmentId = updatedUser.departmentId ?? null;
            token.statusId = updatedUser.statusId ?? null;
            token.mustChangePassword = updatedUser.mustChangePassword ?? false;
            setCachedSessionUser(updatedUser.id, {
              avatar: updatedUser.avatar,
              name: updatedUser.name,
              email: updatedUser.email,
              mustChangePassword: updatedUser.mustChangePassword ?? false,
            });
          }
        } catch (error) {
          console.error("Error updating JWT token from DB:", error);
        }
      }
      
      // avatar را از JWT token حذف می‌کنیم
      if (token.avatar) {
        delete token.avatar;
      }
      
      return token;
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.name = (token.name as string) || session.user.name;
          session.user.mobile = token.mobile as string;
          session.user.email = (token.email as string) || session.user.email;
          session.user.role = token.role as string;
          session.user.departmentId = token.departmentId as string | null;
          (session.user as any).statusId = token.statusId as string | null;
          session.user.mustChangePassword = token.mustChangePassword ?? false;
          // avatar و فیلدهای به‌روز: اول از کش می‌خوانیم تا در هر درخواست به DB نزنیم
          if (token.id) {
            const userId = token.id as string;
            const cached = getCachedSessionUser(userId);
            if (cached) {
              (session.user as any).avatar = cached.avatar ?? undefined;
              session.user.name = cached.name;
              session.user.email = cached.email ?? undefined;
              session.user.mustChangePassword = cached.mustChangePassword;
            } else {
              try {
                const user = await prisma.users.findUnique({
                  where: { id: userId },
                  select: {
                    avatar: true,
                    mustChangePassword: true,
                    name: true,
                    email: true,
                  },
                });
                if (user) {
                  setCachedSessionUser(userId, {
                    avatar: user.avatar,
                    name: user.name,
                    email: user.email,
                    mustChangePassword: user.mustChangePassword ?? false,
                  });
                  (session.user as any).avatar = user.avatar ?? undefined;
                  session.user.name = user.name;
                  session.user.email = user.email ?? undefined;
                  session.user.mustChangePassword = user.mustChangePassword ?? false;
                }
                (session.user as any).statusId = token.statusId ?? null;
              } catch (dbError) {
                console.error("Error fetching user in session callback:", dbError);
                (session.user as any).statusId = token.statusId ?? null;
              }
            }
          } else {
            (session.user as any).statusId = token.statusId ?? null;
          }
        }
        return session;
      } catch (error) {
        console.error("Error in session callback:", error);
        return session;
      }
    },
  },
};

