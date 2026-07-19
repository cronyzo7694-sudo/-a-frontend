import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { MathJaxContext } from "better-react-mathjax";
import { router } from "./router";
import { useAuthStore } from "./stores/authStore";
import { usePlatformStore } from "./stores/platformStore";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
  tex: {
    inlineMath: [
      ["\\(", "\\)"],
      ["$", "$"],
    ],
    displayMath: [
      ["\\[", "\\]"],
      ["$$", "$$"],
    ],
  },
};

function Bootstrap({ children }: { children: React.ReactNode }) {
  const bootstrapAuth = useAuthStore((s) => s.bootstrap);
  const initialized = useAuthStore((s) => s.initialized);
  const bootstrapPlatform = usePlatformStore((s) => s.bootstrap);
  const platformLoaded = usePlatformStore((s) => s.loaded);
  const appName = usePlatformStore((s) => s.appName);

  React.useEffect(() => {
    void bootstrapAuth();
    void bootstrapPlatform();
  }, [bootstrapAuth, bootstrapPlatform]);

  React.useEffect(() => {
    if (platformLoaded) {
      document.title = appName();
    }
  }, [platformLoaded, appName]);

  if (!initialized || !platformLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-600 text-sm">
        <div className="text-center space-y-2">
          <div className="mx-auto h-9 w-9 rounded-md bg-slate-800 text-white flex items-center justify-center text-xs font-semibold tracking-wide">
            EO
          </div>
          <div>Loading workspace…</div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MathJaxContext version={3} config={mathJaxConfig}>
        <Bootstrap>
          <RouterProvider router={router} />
        </Bootstrap>
      </MathJaxContext>
    </QueryClientProvider>
  </React.StrictMode>,
);
