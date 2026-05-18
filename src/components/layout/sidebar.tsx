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
  PanelLeftClose,
  PanelLeftOpen,
  GitFork,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/table", label: "Table", icon: Table2 },
  { href: "/word-sets", label: "Word Sets", icon: Layers },
  { href: "/flashcards", label: "Study", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/generate", label: "Generate", icon: Sparkles },
  { href: "/import", label: "Import", icon: Import },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

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
          "md:hidden fixed top-12 left-0 bottom-0 z-40 w-56 bg-sidebar border-r border-sidebar-border transition-transform duration-200 flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="flex flex-col gap-0.5 p-2 pt-3 flex-1">
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
        <div className="flex items-center gap-0.5 px-2 pb-3 border-t border-sidebar-border pt-2">
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
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
          <a
            href="https://github.com/ozencb/lexica"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <GitFork className="size-4" />
          </a>
          <ThemeToggle />
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col shrink-0 h-screen sticky top-0 bg-sidebar border-r border-sidebar-border transition-[width] duration-200",
          collapsed ? "w-14" : "w-52"
        )}
      >
        <div className="flex items-center h-12 px-3">
          {!collapsed && (
            <Link href="/" className="text-sm font-bold tracking-tight text-foreground">
              Lexica
            </Link>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
              collapsed ? "mx-auto" : "ml-auto"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 px-2 flex-1">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                title={collapsed ? link.label : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md text-[13px] transition-colors",
                  collapsed ? "justify-center px-0 py-1.5" : "px-2.5 py-1.5",
                  active
                    ? "bg-primary/10 text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <link.icon className="size-4 shrink-0" />
                {!collapsed && link.label}
              </Link>
            );
          })}
        </nav>

        <div className={cn(
          "flex items-center gap-0.5 px-2 pb-3 border-t border-sidebar-border pt-2",
          collapsed && "flex-col"
        )}>
          <Link
            href="/settings"
            title={collapsed ? "Settings" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md text-[13px] transition-colors",
              collapsed ? "justify-center px-0 py-1.5" : "px-2.5 py-1.5 flex-1",
              pathname.startsWith("/settings")
                ? "bg-primary/10 text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Settings className="size-4 shrink-0" />
            {!collapsed && "Settings"}
          </Link>
          <a
            href="https://github.com/ozencb/lexica"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <GitFork className="size-4" />
          </a>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
