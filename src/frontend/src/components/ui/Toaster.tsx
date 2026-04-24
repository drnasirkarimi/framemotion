import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "../../hooks/use-theme";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "font-body text-sm",
          title: "font-medium",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
