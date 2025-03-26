"use client"
import QueryProvider from "@/providers/query-provider";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { usePathname } from "next/navigation";

function shouldShowSidebar(pathname: string): boolean {
  // Paths where sidebar should NOT appear (auth pages, landing page, etc.)
  const sidebarPaths = ['/dashboard', '/exams'];
  // Check if current path starts with any of the no-sidebar paths
  return sidebarPaths.some(path => pathname.startsWith(path));
}

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showSidebar = shouldShowSidebar(pathname);
  console.log("showSidebar", showSidebar); // Add this line to log the value of showSidebar
  const theme = "dark";
  if (showSidebar)
  {
    return (
      <html lang="en" className={theme}>
        <body>
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
  
        </body>
      </html>
    );
  }

  return (
      <html lang="en" className={theme}>
        <body>
            <main className="w-full">
              <QueryProvider>
                <TooltipProvider>
                  <Toaster position="bottom-right" />
                  {children}
                </TooltipProvider>
              </QueryProvider>
            </main>
        </body>
      </html>
  );
}
