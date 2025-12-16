"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  FileBarChart,
  Upload,
  Sparkles,
  Settings,
  Search,
  Plus,
  ExternalLink,
  Wrench,
  CandlestickChart,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

interface CommandMenuProps {
  recentStocks?: { symbol: string; name?: string }[];
}

export function CommandMenu({ recentStocks = [] }: CommandMenuProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const t = useTranslations("command");

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, [setOpen]);

  const navigationItems = [
    { name: t("dashboard"), href: "/", icon: LayoutDashboard, shortcut: "D" },
    { name: t("intraday"), href: "/intraday", icon: TrendingUp, shortcut: "I" },
    { name: t("portfolio"), href: "/portfolio", icon: Briefcase, shortcut: "P" },
    { name: t("reports"), href: "/reports", icon: FileBarChart, shortcut: "R" },
    { name: t("import"), href: "/import", icon: Upload },
    { name: t("insights"), href: "/insights", icon: Sparkles },
    { name: t("tools"), href: "/tools", icon: Wrench, shortcut: "T" },
    { name: t("profile"), href: "/profile", icon: Settings },
  ];

  const quickActions = [
    { name: t("addTrade"), action: () => router.push("/intraday?action=add"), icon: Plus },
    { name: t("addStock"), action: () => router.push("/portfolio?action=add"), icon: Plus },
  ];

  const screenerItems = [
    {
      name: t("swingScreener"),
      href: "https://chartink.com/screener/fin-viraj-swing-trading-n",
      icon: ExternalLink,
    },
    {
      name: t("longTermScreener"),
      href: "https://chartink.com/screener/weekly-long-term-suresh",
      icon: ExternalLink,
    },
  ];

  return (
    <>
      <Button
        variant="outline"
        className="relative h-8 w-full justify-start rounded-lg bg-muted/50 text-sm text-muted-foreground sm:pr-12 md:w-32 lg:w-44 xl:w-56"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-3.5 w-3.5" />
        <span className="hidden xl:inline-flex">{t("searchPlaceholder")}</span>
        <span className="inline-flex xl:hidden">{t("search")}</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t("typeCommand")} />
        <CommandList>
          <CommandEmpty>{t("noResults")}</CommandEmpty>

          {/* Quick Actions */}
          <CommandGroup heading={t("quickActions")}>
            {quickActions.map((item) => (
              <CommandItem
                key={item.name}
                onSelect={() => runCommand(item.action)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Recent Stocks */}
          {recentStocks.length > 0 && (
            <>
              <CommandGroup heading={t("recentStocks")}>
                {recentStocks.slice(0, 5).map((stock) => (
                  <CommandItem
                    key={stock.symbol}
                    onSelect={() =>
                      runCommand(() => router.push(`/stock/${stock.symbol}`))
                    }
                  >
                    <CandlestickChart className="mr-2 h-4 w-4" />
                    <span>{stock.symbol}</span>
                    {stock.name && (
                      <span className="ml-2 text-muted-foreground">
                        {stock.name}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Navigation */}
          <CommandGroup heading={t("navigation")}>
            {navigationItems.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => runCommand(() => router.push(item.href))}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
                {item.shortcut && (
                  <CommandShortcut>⌘{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* External Screeners */}
          <CommandGroup heading={t("screeners")}>
            {screenerItems.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => runCommand(() => window.open(item.href, "_blank"))}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
