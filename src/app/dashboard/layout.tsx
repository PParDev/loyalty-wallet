"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const IconChart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5V19a1 1 0 001 1h3V13.5H3zm5.5-5V20h3V8.5h-3zm5.5 3V20h3v-8.5h-3zm5.5-5V20h3V6.5h-3z" />
  </svg>
);

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-1a4 4 0 00-5.916-3.519M15 11a4 4 0 10-8 0 4 4 0 008 0zm-4 8H3v-1a4 4 0 015.916-3.519" />
  </svg>
);

const IconScan = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 8h10M7 12h10M7 16h6" />
  </svg>
);

const IconStar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.91c.969 0 1.372 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.921-.755 1.688-1.538 1.118l-3.97-2.883a1 1 0 00-1.176 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.083 10.1c-.784-.57-.38-1.81.588-1.81h4.91a1 1 0 00.95-.69l1.518-4.674z" />
  </svg>
);

const IconBell = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const IconSettings = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const navItems = [
  { href: "/dashboard", label: "Resumen", icon: IconChart },
  { href: "/dashboard/customers", label: "Clientes", icon: IconUsers },
  { href: "/dashboard/scan", label: "Escanear", icon: IconScan },
  { href: "/dashboard/rewards", label: "Recompensas", icon: IconStar },
  { href: "/dashboard/notifications", label: "Notificaciones", icon: IconBell },
  { href: "/dashboard/settings", label: "Configuración", icon: IconSettings },
];

const cashierNav = [
  { href: "/dashboard/scan", label: "Escanear", icon: IconScan },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/businesses/me")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.isActive === false) {
          signOut({ callbackUrl: "/login?suspended=true" });
        }
      });
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const items = session?.user.role === "admin" ? navItems : cashierNav;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — solo desktop */}
      <aside className="hidden md:flex w-60 bg-white border-r border-gray-100 flex-col shadow-sm">
        <div className="px-5 py-5 border-b border-gray-100">
          <h1 className="text-base font-semibold text-indigo-600 tracking-tight">LoyaltyWallet</h1>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{session?.user.name}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                <Icon />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <IconLogout />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav — solo móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
        {items.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                isActive ? "text-indigo-600" : "text-gray-400"
              }`}
            >
              <Icon />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
