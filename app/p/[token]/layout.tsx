import { AuthProvider } from "@/components/AuthProvider";

export const metadata = {
  title: "ارسال فیدبک",
  description: "فرم ارسال فیدبک پروژه",
};

export default function PublicFeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
