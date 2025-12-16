"use client"

import * as React from "react"
import { Palette } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const themeNames: Record<string, string> = {
  light: "Pure Light",
  golden: "Royal Golden",
  silver: "Silver Mist",
  maroon: "Opulent Maroon",
  purple: "Deep Purple",
  celestial: "Celestial Blue",
  emerald: "Emerald Green",
  rose: "Rose Pink",
  sunset: "Sunset Orange",
  dark: "Midnight Dark",
  dark2: "Slate Grey",
  blue: "Dark Blue",
  neogreen: "Neo Green",
  ironman: "Iron Man",
  dracula: "Dracula",
  nord: "Nord",
  monokai: "Monokai",
  tokyo: "Tokyo Night",
  obsidian: "Obsidian",
  system: "System",
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const currentThemeName = mounted ? (themeNames[theme || "system"] || theme) : ""

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="hidden sm:inline-block text-sm font-medium">
            {currentThemeName}
          </span>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {/* Light Themes */}
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Pure Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("golden")}>
          Royal Golden
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("silver")}>
          Silver Mist
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("maroon")}>
          Opulent Maroon
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("purple")}>
          Deep Purple
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("celestial")}>
          Celestial Blue
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("emerald")}>
          Emerald Green
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("rose")}>
          Rose Pink
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("sunset")}>
          Sunset Orange
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Dark Themes */}
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Midnight Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark2")}>
          Slate Grey
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("blue")}>
          Dark Blue
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("neogreen")}>
          Neo Green
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("ironman")}>
          Iron Man
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dracula")}>
          Dracula
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("nord")}>
          Nord
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("monokai")}>
          Monokai
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("tokyo")}>
          Tokyo Night
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("obsidian")}>
          Obsidian
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* System */}
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
