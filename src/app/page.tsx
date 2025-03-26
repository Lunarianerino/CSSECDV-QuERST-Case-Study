import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import Link from "next/link"

export default function Page() {
  return (
    <main>
      {/* <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header> */}
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center max-w-2xl animate-fade-in">
          <h1 className="text-4xl font-medium mb-6 tracking-tight">QuERST-SyMM</h1>
          <p className="text-xl text-muted-foreground mb-8">
            A platform for students to receive aid from top-tier tutors.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button className="text-primary-foreground bg-primary hover:bg-primary/90 transition-all">
                Register
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="hover:bg-primary/10 transition-all">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>

  )
}
