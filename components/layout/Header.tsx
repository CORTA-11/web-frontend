import React from "react";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-8 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Workspace</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-650 dark:text-zinc-400">
            JD
          </div>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden sm:inline">
            John Doe
          </span>
        </div>
      </div>
    </header>
  );
}
