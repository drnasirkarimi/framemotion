import { Button } from "@/components/ui/button";
import { useMatchRoute, useNavigate } from "@tanstack/react-router";
import { Film, Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/use-theme";
import { type ActiveTab, useAppStore } from "../../store/app-store";

const NAV_TABS: { id: ActiveTab; label: string; path: string }[] = [
  { id: "converter", label: "Converter", path: "/" },
  { id: "history", label: "History", path: "/history" },
];

export function Header() {
  const { resolvedTheme, toggle } = useTheme();
  const { setActiveTab } = useAppStore();
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();

  const ThemeIcon = resolvedTheme === "dark" ? Moon : Sun;

  const handleNav = (tab: (typeof NAV_TABS)[number]) => {
    setActiveTab(tab.id);
    navigate({ to: tab.path });
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
        {/* Logo */}
        <div
          className="flex items-center gap-2 shrink-0"
          data-ocid="header.logo"
        >
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Film className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-base text-foreground tracking-tight">
            FrameMotion
          </span>
        </div>

        {/* Nav tabs */}
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {NAV_TABS.map((tab) => {
            const isActive = matchRoute({
              to: tab.path,
              fuzzy: tab.path !== "/",
            });
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => handleNav(tab)}
                data-ocid={`header.${tab.id}.tab`}
                className={[
                  "relative px-3 py-1.5 text-sm font-medium rounded-md transition-smooth",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[calc(100%+1px)] w-4 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
            data-ocid="header.theme_toggle"
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
          >
            <ThemeIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
