"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navLinks = [
  { href: "/word-sets", label: "Word Sets" },
  { href: "/table", label: "Table" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/progress", label: "Progress" },
  { href: "/generate", label: "Generate" },
  { href: "/import", label: "Import" },
];

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="flex h-12 items-center px-4 md:px-6">
        <Link href="/" className="mr-8 text-[15px] font-semibold tracking-tight text-primary">
          Lexica
        </Link>

        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative px-3 py-1.5 text-[13px] rounded-md transition-colors",
                pathname.startsWith(link.href)
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
              {pathname.startsWith(link.href) && (
                <span className="absolute bottom-[-9px] left-3 right-3 h-[2px] bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/settings"
            className={cn(
              "hidden md:flex text-[13px] transition-colors px-3 py-1.5 rounded-md relative",
              pathname.startsWith("/settings")
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Settings
            {pathname.startsWith("/settings") && (
              <span className="absolute bottom-[-9px] left-3 right-3 h-[2px] bg-primary rounded-full" />
            )}
          </Link>

          <ThemeToggle />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger aria-label="Open navigation menu" className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetTitle className="font-semibold text-primary mb-4">
                Lexica
              </SheetTitle>
              <nav className="flex flex-col gap-0.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "px-3 py-2 text-sm rounded-md transition-colors",
                      pathname.startsWith(link.href)
                        ? "text-foreground font-medium bg-primary/10 border-l-2 border-primary"
                        : "text-muted-foreground hover:text-foreground border-l-2 border-transparent",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-md transition-colors",
                    pathname.startsWith("/settings")
                      ? "text-foreground font-medium bg-primary/10 border-l-2 border-primary"
                      : "text-muted-foreground hover:text-foreground border-l-2 border-transparent",
                  )}
                >
                  Settings
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
