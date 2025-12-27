import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
      
      // وقتی update() فراخوانی می‌شود، اطلاعات کاربر را از دیتابیس بخوان
      if (trigger === "update" && token.id) {
        try {
          const updatedUser = await prisma.users.findUnique({
            where: { id: token.id as string },
            include: { departments: true },
          });
          
          if (updatedUser) {
            token.name = updatedUser.name;
            token.mobile = updatedUser.mobile;
            token.email = updatedUser.email ?? undefined;
            token.role = updatedUser.role;
            token.departmentId = updatedUser.departmentId ?? null;
            token.statusId = updatedUser.statusId ?? null;
            token.mustChangePassword = updatedUser.mustChangePassword ?? false;
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
          // avatar را از دیتابیس می‌خوانیم (نه از token)
          if (token.id) {
            try {
              const user = await prisma.users.findUnique({
                where: { id: token.id as string },
                select: {
                  avatar: true,
                  mustChangePassword: true,
                  name: true,
                  email: true,
                },
              });
              (session.user as any).avatar = user?.avatar ?? undefined;
              // به‌روزرسانی اطلاعات از دیتابیس
              if (user) {
                session.user.name = user.name;
                session.user.email = user.email ?? undefined;
                session.user.mustChangePassword = user.mustChangePassword ?? false;
              }
              // statusId و status را از token می‌گیریم (از JWT callback که قبلاً از دیتابیس خوانده شده)
              (session.user as any).statusId = token.statusId ?? null;
            } catch (dbError) {
              console.error("Error fetching user in session callback:", dbError);
              // در صورت خطا، از مقدار token استفاده کن
              (session.user as any).statusId = token.statusId ?? null;
            }
          } else {
            // اگر token.id وجود نداشت، از token استفاده کن
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

