import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import StudentDashboard from "@/components/dashboard/student/StudentDashboard";
import TutorDashboard from "@/components/dashboard/tutor/TutorDashboard";
import AdminDashboard from "@/components/dashboard/admin/AdminDashboard";
import DashboardLayout from "@/components/dashboard-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import Link from "next/link";

export default async function Page() {
  // get auth user
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }
  const user = session?.user;
  if (!user) {
    redirect("/");
  }
  if (user?.email === null || user?.email === undefined) {
    redirect("/");
  }

  // Check if user type exists
  if (!user.type) {
    console.error("User type is missing from session");
    redirect("/");
  }

  const prevAttempt = user.prevLoginAttempt as { at?: Date | string; success?: boolean } | undefined;

  const lastUseBanner = prevAttempt?.at ? (
    <Alert className="border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400 [&>svg]:translate-y-0' mb-8">
      <AlertCircleIcon />
      <AlertTitle className="font-bold">
        Last Login
      </AlertTitle>
      <AlertDescription>
        <p className="text-sky-600 dark:border-sky-400">
          Last account use: {new Date(prevAttempt.at).toLocaleString()} ({prevAttempt.success ? "successful" : "failed"} attempt)
        </p>
        <p>Not you? <Link href="/profile"><u>Change Password</u></Link></p>
      </AlertDescription>
    </Alert>
  ) : null;

  switch (user.type) {
    case "student":
      return (
        <main>
          <DashboardLayout title="Student Dashboard">
            {lastUseBanner}
            <StudentDashboard />
          </DashboardLayout>
        </main>
      )
    case "tutor":
      return (
        <main>
          <DashboardLayout title="Tutor Dashboard">
            {lastUseBanner}
            <TutorDashboard />
          </DashboardLayout>
        </main>
      )
    case "admin":
      return (
        <main>
          <DashboardLayout title="Admin Dashboard">
            {lastUseBanner}
            <AdminDashboard />
          </DashboardLayout>
        </main>
      )
    default:
      redirect("/");
  }
}