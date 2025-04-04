import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth"; // Import your auth options
import StudentDashboard from "@/components/dashboard/student/StudentDashboard";
// Import missing components
import TeacherDashboard from "@/components/dashboard/teacher/TeacherDashboard";
import AdminDashboard from "@/components/dashboard/admin/AdminDashboard";

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
        <StudentDashboard />
      </main>
    ) 
   case "teacher":
    return (
      <main>
        <TeacherDashboard />
      </main>
    )
   case "admin":
    return (
      <main>
        <AdminDashboard />
      </main>
    )
    default:
      redirect("/");
  }
}