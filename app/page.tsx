import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // اگر کاربر باید رمز عبور را تغییر دهد، به صفحه تغییر رمز redirect کن
  if (session.user.mustChangePassword) {
    redirect("/change-password");
  }

  // هدایت کارمند و مدیر به صفحات موبایل
  if (session.user.role === "EMPLOYEE") {
    redirect("/mobile/employee");
  }

  if (session.user.role === "MANAGER") {
    redirect("/mobile/manager");
  }

  // ادمین به داشبورد معمولی
  return <Dashboard />;
}

