"use client";

import { usePathname } from "next/navigation";
import Navbar from "./navbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNavbar = pathname !== "/login";

  return (
    <>
      {children}
    </>
  );
}