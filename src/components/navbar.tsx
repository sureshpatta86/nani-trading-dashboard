"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
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
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Intraday", href: "/intraday", icon: TrendingUp },
  { name: "Portfolio", href: "/portfolio", icon: Briefcase },
  { name: "Reports", href: "/reports", icon: FileBarChart },
  { name: "Import", href: "/import", icon: Upload },
  { name: "AI Insights", href: "/insights", icon: Sparkles },
];

const screeners = [
  {
    name: "Swing Screener",
    href: "https://chartink.com/screener/fin-viraj-swing-trading-n",
    description: "Swing trading opportunities",
  },
  {
    name: "Long Term Screener",
    href: "https://chartink.com/screener/weekly-long-term-suresh",
    description: "Weekly long-term picks",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
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
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-sm opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative h-9 w-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-tight">Trading Journal</span>
                <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">with AI</span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
                    {item.name}
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
                    Tools
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    Trading Tools
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/tools" className="cursor-pointer">
                      <Wrench className="h-4 w-4 mr-2" />
                      Calculators
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    Screeners
                  </DropdownMenuLabel>
                  {screeners.map((screener) => (
                    <DropdownMenuItem key={screener.name} asChild>
                      <a
                        href={screener.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer flex items-center justify-between"
                      >
                        <span className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          {screener.name}
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
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                        {(session.user.name?.[0] || session.user.email?.[0] || 'U').toUpperCase()}
                      </div>
                      <span className="text-sm font-medium max-w-[120px] truncate">
                        {session.user.name || session.user.email}
                      </span>
                    </div>
                    <div className="md:hidden">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
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
                        {session.user.name || "User"}
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
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
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
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
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
                    {item.name}
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
                    Tools
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
                      Calculators
                    </Link>
                    
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Screeners
                    </div>
                    
                    {screeners.map((screener) => (
                      <a
                        key={screener.name}
                        href={screener.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <span className="flex items-center gap-3">
                          <Search className="h-4 w-4" />
                          {screener.name}
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
