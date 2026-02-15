import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "relative overflow-hidden bg-card/90 backdrop-blur-md text-card-foreground flex flex-col gap-4 " +
          "rounded-2xl border border-border shadow-sm hover:shadow-xl " +
          "transition-all duration-500 ease-in-out transform" +
          "overflow-hidden group",
        className
      )}
      {...props}
    >
      {/* Neon Top Accent (rounded with card) */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-secondary animate-gradient-x shadow-[0_0_15px_var(--primary)]" />

      {/* Subtle glowing border on hover */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/50 transition-all duration-500 pointer-events-none" />

      {children}
    </div>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 pt-6 " +
          "has-data-[slot=card-action]:grid-cols-[1fr_auto] border-b border-border/60 pb-4",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        "leading-none font-bold text-lg text-foreground tracking-tight group-hover:text-primary transition-colors",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm mt-1", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 py-4", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center justify-between px-6 py-4 border-t border-border/60",
        className
      )}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
