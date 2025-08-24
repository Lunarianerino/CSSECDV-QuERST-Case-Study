// Change from "use server" to "use client" since this component uses interactive elements
"use client";

import { ReactNode, useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountType } from "@/models/account";
import { getSessionUserType } from "@/lib/queries/getSessionUserType";
import { signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const [userType, setUserType] = useState<AccountType | null>(null);

  const { data } = useQuery({
    queryKey: ['userType'],
    queryFn: getSessionUserType,
  });

  useEffect(() => {
    setUserType(userType);
  }, [data]);

  if (!userType) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar
      <div className="w-64 border-r bg-card hidden md:block">
        <div className="h-16 border-b flex items-center px-6">
          <Link href="/" className="font-semibold text-lg">Examination Platform</Link>
        </div>
        <div className="py-4">
          <nav className="space-y-1 px-3">
            {links.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                className="flex items-center py-2 px-3 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <span className="mr-3">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div> */}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b flex items-center justify-between px-6">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold">{title}</h1>
            <span className="ml-2 px-2 py-1 text-xs text-primary-foreground bg-primary rounded-full uppercase">
              {userType}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;