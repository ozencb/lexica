"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Table2,
  Layers,
  BarChart3,
  Sparkles,
  Import,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navLinks = [
  { href: "/word-sets", label: "Word Sets", icon: Layers },
  { href: "/table", label: "Table", icon: Table2 },
  { href: "/flashcards", label: "Study", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/generate", label: "Generate", icon: Sparkles },
  { href: "/import", label: "Import", icon: Import },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center h-12 px-4 bg-background/90 backdrop-blur-lg border-b border-border">
        <Link href="/" className="text-sm font-bold tracking-tight text-foreground">
          Lexica
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="ml-auto p-2 rounded-md hover:bg-muted transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "md:hidden fixed top-12 left-0 bottom-0 z-40 w-56 bg-sidebar border-r border-sidebar-border transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="flex flex-col gap-0.5 p-2 pt-3">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors",
                  active
                    ? "bg-primary/10 text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <link.icon className="size-4 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 h-screen sticky top-0 bg-sidebar border-r border-sidebar-border">
        <div className="flex items-center h-12 px-4">
          <Link href="/" className="text-sm font-bold tracking-tight text-foreground">
            Lexica
          </Link>
        </div>

        <nav className="flex flex-col gap-0.5 px-2 flex-1">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors",
                  active
                    ? "bg-primary/10 text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <link.icon className="size-4 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-0.5 px-2 pb-3 border-t border-sidebar-border pt-2">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors flex-1",
              pathname.startsWith("/settings")
                ? "bg-primary/10 text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Settings className="size-4 shrink-0" />
            Settings
          </Link>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
