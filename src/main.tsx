import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch when the window regains focus (desktop app, not a website)
      refetchOnWindowFocus: false,
      // Keep stale data visible while refetching in background
      staleTime: 30_000, // 30 seconds
      // Retry up to 2 times on failure
      retry: 2,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
