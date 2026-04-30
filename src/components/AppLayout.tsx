import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

export function AppLayout() {
  const { loading } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden md:block w-[260px] bg-sidebar" />
        <div className="flex-1 p-8 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-4 py-3">
          <SheetTrigger asChild>
            <button className="rounded-md p-2 hover:bg-muted" aria-label="Abrir menu">
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <span className="text-sm font-semibold">Garagem</span>
        </header>
        <SheetContent side="left" className="w-[260px] p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
          <AppSidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}