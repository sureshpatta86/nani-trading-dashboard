"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  LogOut,
  Settings,
  ChevronDown,
  Sparkles,
  Upload,
  Menu,
  FileBarChart,
  Wrench,
  Calculator,
  Search,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/language-selector";
import { useState } from "react";

const navigationItems = [
  { nameKey: "dashboard", href: "/", icon: LayoutDashboard },
  { nameKey: "intraday", href: "/intraday", icon: TrendingUp },
  { nameKey: "portfolio", href: "/portfolio", icon: Briefcase },
  { nameKey: "reports", href: "/reports", icon: FileBarChart },
  { nameKey: "import", href: "/import", icon: Upload },
  { nameKey: "insights", href: "/insights", icon: Sparkles },
];

const screenerItems = [
  {
    nameKey: "swingScreener",
    href: "https://chartink.com/screener/fin-viraj-swing-trading-n",
    descriptionKey: "swingDescription",
  },
  {
    nameKey: "longTermScreener",
    href: "https://chartink.com/screener/weekly-long-term-suresh",
    descriptionKey: "longTermDescription",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = useTranslations("nav");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const isToolsActive = pathname === "/tools";

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="w-[95%] max-w-[1800px] mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary rounded-lg blur-sm opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative h-9 w-9 bg-primary rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-tight">{t("brandName")}</span>
                <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">{t("brandTagline")}</span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.nameKey}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
                    {t(item.nameKey)}
                  </Link>
                );
              })}
              
              {/* Tools Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 h-auto",
                      isToolsActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Wrench className={cn("h-4 w-4", isToolsActive && "text-primary")} />
                    {t("tools")}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    {t("tradingTools")}
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/tools" className="cursor-pointer">
                      <Wrench className="h-4 w-4 mr-2" />
                      {t("calculators")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    {t("screeners")}
                  </DropdownMenuLabel>
                  {screenerItems.map((screener) => (
                    <DropdownMenuItem key={screener.nameKey} asChild>
                      <a
                        href={screener.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer flex items-center justify-between"
                      >
                        <span className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          {t(screener.nameKey)}
                        </span>
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            <ThemeToggle />
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {session?.user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-muted">
                    <div className="hidden md:flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                        {(session.user.name?.[0] || session.user.email?.[0] || 'U').toUpperCase()}
                      </div>
                      <span className="text-sm font-medium max-w-[120px] truncate">
                        {session.user.name || session.user.email}
                      </span>
                    </div>
                    <div className="md:hidden">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                        {(session.user.name?.[0] || session.user.email?.[0] || 'U').toUpperCase()}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50 hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user.name || t("user")}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      {t("profileSettings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border/40">
            <div className="flex flex-col space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.nameKey}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                    {t(item.nameKey)}
                  </Link>
                );
              })}
              
              {/* Mobile Tools Section */}
              <div className="pt-2">
                <button
                  onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                    isToolsActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Wrench className={cn("h-5 w-5", isToolsActive && "text-primary")} />
                    {t("tools")}
                  </span>
                  <ChevronRight className={cn("h-4 w-4 transition-transform", mobileToolsOpen && "rotate-90")} />
                </button>
                
                {mobileToolsOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-border/50 pl-4">
                    <Link
                      href="/tools"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                        isToolsActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Calculator className="h-4 w-4" />
                      {t("calculators")}
                    </Link>
                    
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("screeners")}
                    </div>
                    
                    {screenerItems.map((screener) => (
                      <a
                        key={screener.nameKey}
                        href={screener.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <span className="flex items-center gap-3">
                          <Search className="h-4 w-4" />
                          {t(screener.nameKey)}
                        </span>
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
