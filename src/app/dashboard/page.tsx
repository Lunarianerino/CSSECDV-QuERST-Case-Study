import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import StudentDashboard from "@/components/dashboard/student/StudentDashboard";
import TutorDashboard from "@/components/dashboard/tutor/TutorDashboard";
import AdminDashboard from "@/components/dashboard/admin/AdminDashboard";
import DashboardLayout from "@/components/dashboard-layout";

export default async function Page() {
  // get auth user
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }
  
  // TODO: add error messages on redirects (toast context?)
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

  switch(user.type) {
   case "student":
    return (
      <main>
        <DashboardLayout title="Student Dashboard">
          <StudentDashboard />
        </DashboardLayout>
      </main>
    ) 
   case "tutor":
    return (
      <main>
        <DashboardLayout title="Tutor Dashboard">
          <TutorDashboard />
        </DashboardLayout>
      </main>
    )
   case "admin":
    return (
      <main>
        <DashboardLayout title="Admin Dashboard">
          <AdminDashboard />
        </DashboardLayout>
      </main>
    )
    default:
      redirect("/");
  }
}