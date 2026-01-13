"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActivityBarContextType {
  activeView: string;
  setActiveView: (view: string) => void;
}

const ActivityBarContext = React.createContext<ActivityBarContextType | null>(
  null
);

function useActivityBar() {
  const context = React.useContext(ActivityBarContext);
  if (!context) {
    throw new Error("useActivityBar must be used within ActivityBarProvider");
  }
  return context;
}

interface ActivityBarProviderProps {
  children: React.ReactNode;
  defaultView?: string;
  onViewChange?: (view: string) => void;
}

export function ActivityBarProvider({
  children,
  defaultView = "explorer",
  onViewChange,
}: ActivityBarProviderProps) {
  const [activeView, setActiveView] = React.useState(defaultView);

  const handleViewChange = React.useCallback(
    (view: string) => {
      setActiveView(view);
      onViewChange?.(view);
    },
    [onViewChange]
  );

  return (
    <ActivityBarContext.Provider
      value={{ activeView, setActiveView: handleViewChange }}
    >
      {children}
    </ActivityBarContext.Provider>
  );
}

interface ActivityBarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ActivityBar({
  className,
  children,
  ...props
}: ActivityBarProps) {
  return (
    <div
      className={cn(
        "flex h-full w-12 flex-col items-center border-r bg-muted/40",
        className
      )}
      {...props}
    >
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </div>
  );
}

interface ActivityBarItemProps {
  icon: React.ReactNode;
  label: string;
  view: string;
  badge?: number;
}

export function ActivityBarItem({
  icon,
  label,
  view,
  badge,
}: ActivityBarItemProps) {
  const { activeView, setActiveView } = useActivityBar();
  const isActive = activeView === view;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setActiveView(view)}
          className={cn(
            "relative flex h-12 w-12 items-center justify-center transition-colors hover:bg-muted",
            isActive && "bg-muted border-l-2 border-primary"
          )}
        >
          <div className={cn("transition-colors", isActive && "text-primary")}>
            {icon}
          </div>
          {badge !== undefined && badge > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="ml-1">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

interface ActivityBarSeparatorProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function ActivityBarSeparator({
  className,
  ...props
}: ActivityBarSeparatorProps) {
  return (
    <div className={cn("my-2 h-px w-8 bg-border", className)} {...props} />
  );
}

interface ActivityBarSpacerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ActivityBarSpacer({
  className,
  ...props
}: ActivityBarSpacerProps) {
  return <div className={cn("flex-1", className)} {...props} />;
}
