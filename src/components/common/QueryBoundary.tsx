"use client";

import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/http";

type Props<T> = {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
  rows?: number;
};

/** Loading and error handling for a query, written once instead of per page. */
export function QueryBoundary<T>({ query, children, rows = 4 }: Props<T>) {
  if (query.isPending) {
    return (
      <div className="flex flex-col gap-px" aria-busy="true" aria-label="Loading">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full rounded-sm" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex items-start gap-2.5 border border-danger/30 bg-danger/5 p-3 text-sm">
        <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-danger" />
        <div className="flex flex-col items-start gap-2">
          <p className="text-foreground">{errorMessage(query.error)}</p>
          <Button size="xs" variant="outline" onClick={() => query.refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return <>{children(query.data)}</>;
}
