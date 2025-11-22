"use client"
import QueryProvider from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";

function shouldShowSidebar(pathname: string): boolean {
  // Paths where sidebar should appear
  const sidebarPaths = ['/dashboard', '/exams', '/admin', '/schedule', '/students', '/profile'];
  // Check if current path starts with any of the sidebar paths
  return sidebarPaths.some(path => pathname.startsWith(path));
}

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showSidebar = shouldShowSidebar(pathname);

  if (showSidebar) {
    return (
      <SessionProvider>
        <SidebarProvider>
          <AppSidebar />
          <main className="w-full">
            <SidebarTrigger />
            <QueryProvider>
              <TooltipProvider>
                <Toaster position="bottom-right" />
                {children}
              </TooltipProvider>
            </QueryProvider>
          </main>
        </SidebarProvider>
      </SessionProvider>
    );
  }

  return (
    <SessionProvider>
      <QueryProvider>
        <TooltipProvider>
          <Toaster position="bottom-right" />
          {children}
        </TooltipProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
