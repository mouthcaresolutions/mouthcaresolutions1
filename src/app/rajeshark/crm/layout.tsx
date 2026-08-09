"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Receipt,
  Stethoscope,
  UserCog,
  ArrowLeft,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  isBack?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/rajeshark/crm", icon: LayoutDashboard },
  { label: "Patients", href: "/rajeshark/crm/patients", icon: Users },
  { label: "Appointments", href: "/rajeshark/crm/appointments", icon: Calendar },
  { label: "Billing", href: "/rajeshark/crm/billing", icon: Receipt },
  { label: "Treatments", href: "/rajeshark/crm/treatments", icon: Stethoscope },
  { label: "Doctors", href: "/rajeshark/crm/doctors", icon: UserCog },
];

const backItem: NavItem = {
  label: "Back to Admin",
  href: "/rajeshark",
  icon: ArrowLeft,
  isBack: true,
};

function getPageTitle(pathname: string): string {
  if (pathname === "/rajeshark/crm") return "Dashboard";
  const segment = pathname.replace("/rajeshark/crm/", "");
  const match = navItems.find(
    (item) => item.href === `/rajeshark/crm/${segment}`
  );
  return match ? match.label : "CRM";
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo / Branding */}
      <div className="flex items-center gap-3 border-b border-teal-800 px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
          <ShieldCheck className="h-6 w-6 text-teal-200" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-white">MCS</h1>
          <p className="truncate text-xs text-teal-300">Dental Clinic CRM</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/rajeshark/crm"
              ? pathname === "/rajeshark/crm" || pathname === "/rajeshark/crm/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-teal-700 text-white shadow-md shadow-teal-900/30"
                  : "text-teal-100 hover:bg-teal-800/60 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-300" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Back to Admin */}
      <div className="border-t border-teal-800 px-3 py-4">
        <Link
          href={backItem.href}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-teal-300 transition-all duration-200 hover:bg-teal-800/60 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5 shrink-0" />
          <span>{backItem.label}</span>
        </Link>
      </div>
    </div>
  );
}

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Desktop: Fixed, Mobile: Off-canvas */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-teal-900 transition-transform duration-300 ease-in-out",
          isMobile && !sidebarOpen && "-translate-x-full",
          !isMobile && "translate-x-0"
        )}
      >
        <SidebarContent pathname={pathname} onNavigate={closeSidebar} />
      </aside>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          !isMobile ? "ml-64" : "ml-0"
        )}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm md:px-6">
          <div className="flex items-center gap-3">
            {/* Hamburger Button - Mobile Only */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="h-10 w-10 text-gray-600 hover:text-gray-900"
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{pageTitle}</h2>
              <p className="hidden text-xs text-gray-500 sm:block">
                MCS Dental Clinic
              </p>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                A
              </div>
              <span className="text-sm font-medium text-gray-700">Admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
