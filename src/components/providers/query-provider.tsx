"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep cached data fresh for 5 minutes (prevents reloading when returning to a page)
            staleTime: 5 * 60 * 1000,
            // Keep inactive data in memory for 30 minutes
            gcTime: 30 * 60 * 1000,
            // Prevent auto refetching when switching application windows/tabs
            refetchOnWindowFocus: false,
            // Retry failed requests once before showing error state
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
