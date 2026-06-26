import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import AuthPage from "@/pages/AuthPage";
import HomePage from "@/pages/HomePage";
import ProjectPage from "@/pages/ProjectPage";
import LandingPage from "@/pages/LandingPage";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export type AppView = 
  | { page: "home" }
  | { page: "project"; projectId: string };

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AppView>({ page: "home" });
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-end gap-1 h-8">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-1.5 bg-primary-foreground/80 rounded-full wave-bar" style={{ height: `${16 + i * 4}px`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-primary-foreground/80 font-display text-sm tracking-wider">CARREGANDO SUPPLY ACOUSTIC</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showAuth) return <AuthPage />;
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  if (view.page === "project") {
    return (
      <ProjectPage
        projectId={view.projectId}
        user={user}
        onBack={() => setView({ page: "home" })}
      />
    );
  }

  return (
    <HomePage
      user={user}
      onOpenProject={(id) => setView({ page: "project", projectId: id })}
    />
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
