import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  footer?: React.ReactNode;
}

export function Card({
  title,
  description,
  children,
  footer,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:backdrop-blur-md ${className}`}
      {...props}
    >
      {(title || description) && (
        <div className="mb-4 flex flex-col space-y-1.5">
          {title && (
            <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="text-zinc-700 dark:text-zinc-300">{children}</div>
      {footer && (
        <div className="mt-4 flex items-center border-t border-zinc-150 pt-4 dark:border-zinc-800/80">
          {footer}
        </div>
      )}
    </div>
  );
}
