import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-slate-200 dark:border-navy-700 bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-muted-foreground",
        outline:
          "border-slate-300 dark:border-navy-700 text-slate-800 dark:text-foreground bg-white/50 dark:bg-transparent",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-400 font-medium",
        danger:
          "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 font-medium",
        info:
          "border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-400 font-medium",
        gradient:
          "border-cyan-500/30 bg-cyan-500/10 dark:bg-gradient-to-r dark:from-cyan-400/20 dark:via-blue-500/20 dark:to-violet-500/20 text-cyan-800 dark:text-cyan-300 font-medium",
        // Club colors
        nexcell: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400 font-medium",
        malhar: "border-amber-400/30 bg-amber-500/10 dark:bg-[#14275E] text-amber-800 dark:text-[#E8A935] font-medium",
        khel: "border-blue-600/30 bg-blue-600/10 text-blue-700 dark:text-blue-400 font-medium",
        kaizendev: "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-400 font-medium",
        cp: "border-lime-500/30 bg-lime-500/10 text-lime-800 dark:text-lime-400 font-medium",
        ki: "border-yellow-500/30 bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
