"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Users,
  GraduationCap,
  FileText,
  BarChart,
  Calendar,
  UserCog,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { AccountType } from "@/models/account"
import { Skeleton } from "./ui/skeleton"

// Navigation data based on user type
const getNavigationData = (userType: string | undefined) => {
  // Default user data
  const userData = {
    name: "User",
    email: "user@example.com",
    avatar: "user-avatar-glad.svg",
  }

  // Admin navigation
  const adminNavigation = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
        {
          title: "Analytics",
          url: "/dashboard/analytics",
        },
      ],
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Pairings",
      url: "/admin/pairings",
      icon: GalleryVerticalEnd,
    },
    {
      title: "Exams",
      url: "/exams",
      icon: FileText,
      items: [
        {
          title: "All Exams",
          url: "/exams",
        },
        {
          title: "Create Exam",
          url: "/exams/create",
        },
        {
          title: "VARK",
          url: "/admin/vark",
        },
        {
          title: "BFI",
          url: "/admin/bfi",
        },
      ],
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/admin/settings",
        },
        {
          title: "System",
          url: "/admin/settings/system",
        },
      ],
    },
  ]

  // Tutor navigation
  const tutorNavigation = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
        {
          title: "My Students",
          url: "/students",
        },
      ],
    },
    {
      title: "Assessments",
      url: "/exams",
      icon: FileText,
      items: [
        {
          title: "All Assessments",
          url: "/exams",
        },
        {
          title: "Create Assessment",
          url: "/exams/create",
        },
        {
          title: "Submissions",
          url: "/exams/submissions",
        }
      ],
    },
    {
      title: "Schedule",
      url: "/schedule",
      icon: Calendar,
    },
    // {
    //   title: "Profile",
    //   url: "/profile",
    //   icon: UserCog,
    //   items: [
    //     {
    //       title: "Settings",
    //       url: "/profile",
    //     },
    //     {
    //       title: "Preferences",
    //       url: "/profile/preferences",
    //     },
    //   ],
    // },
  ]

  // Student navigation
  const studentNavigation = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart,
      isActive: true,
      // items: [
      //   {
      //     title: "Overview",
      //     url: "/dashboard",
      //   },
      //   {
      //     title: "Progress",
      //     url: "/dashboard/progress",
      //   },
      // ],
    },
    {
      title: "Schedule",
      url: "/schedule",
      icon: Calendar,
    }
    // {
    //   title: "Exams",
    //   url: "/exams",
    //   icon: FileText,
    //   items: [
    //     {
    //       title: "Available Exams",
    //       url: "/exams",
    //     },
    //     // {
    //     //   title: "My Results",
    //     //   url: "/exams/results",
    //     // },
    //   ],
    // },
    // {
    //   title: "My Tutor",
    //   url: "/tutor",
    //   icon: GraduationCap,
    //   items: [
    //     {
    //       title: "View Tutor",
    //       url: "/tutor",
    //     },
    //     {
    //       title: "Schedule",
    //       url: "/tutor/schedule",
    //     },
    //   ],
    // },
    // {
    //   title: "Profile",
    //   url: "/profile",
    //   icon: UserCog,
    //   items: [
    //     {
    //       title: "Settings",
    //       url: "/profile",
    //     },
    //     {
    //       title: "Preferences",
    //       url: "/profile/preferences",
    //     },
    //   ],
    // },
  ]

  // Projects based on user type
  const adminProjects = [
    {
      name: "System Administration",
      url: "/admin/system",
      icon: Command,
    },
    {
      name: "User Management",
      url: "/admin/users",
      icon: Users,
    },
    {
      name: "Analytics",
      url: "/admin/analytics",
      icon: PieChart,
    },
  ]

  const tutorProjects = [
    {
      name: "Teaching Materials",
      url: "/materials",
      icon: BookOpen,
    },
    {
      name: "Student Progress",
      url: "/progress",
      icon: BarChart,
    },
    {
      name: "Exam Creation",
      url: "/exams/create",
      icon: FileText,
    },
  ]

  const studentProjects = [
    {
      name: "Study Materials",
      url: "/materials",
      icon: BookOpen,
    },
    {
      name: "Practice Tests",
      url: "/practice",
      icon: FileText,
    },
    {
      name: "Learning Path",
      url: "/path",
      icon: Map,
    },
  ]

  // Return the appropriate navigation based on user type
  switch (userType) {
    case AccountType.ADMIN:
      return {
        user: userData,
        navMain: adminNavigation,
        projects: adminProjects,
      }
    case AccountType.TUTOR:
      return {
        user: userData,
        navMain: tutorNavigation,
        projects: tutorProjects,
      }
    case AccountType.STUDENT:
      return {
        user: userData,
        navMain: studentNavigation,
        projects: studentProjects,
      }
    default:
      return {
        user: userData,
        navMain: studentNavigation, // Default to student view
        projects: studentProjects,
      }
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Get the current user session
  const { data: session, status } = useSession()
  
  // Only proceed if session is loaded
  const isLoading = status === "loading"
  
  // Get navigation data based on user type
  const data = getNavigationData(session?.user?.type)
  
  // Set user data from session if available
  const userData = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "user@example.com",
    avatar: "user-avatar-glad.svg", // Default avatar
  }

  // Return null or loading state while session is loading
  if (isLoading) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <Skeleton className="h-12 w-full rounded-lg" />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {/* Skeleton for main navigation */}
          <SidebarGroup>
            <Skeleton className="h-5 w-24 mb-2" />
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full mb-2 rounded-lg" />
            ))}
          </SidebarGroup>
          
          {/* Skeleton for projects */}
          {/* <SidebarGroup className="mt-6">
            <Skeleton className="h-5 w-24 mb-2" />
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full mb-2 rounded-lg" />
            ))}
          </SidebarGroup> */}
        </SidebarContent>
        <SidebarFooter>
          <Skeleton className="h-5 w-48" />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    )
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser user={userData} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        {/* QuERST Matchmaking System © {new Date().getFullYear()} */}
        😎
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
