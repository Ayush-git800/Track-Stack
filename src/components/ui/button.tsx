import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white shadow-md hover:bg-blue-500 hover:shadow-glow keep-white",
        gradient:
          "bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 dark:from-cyan-400 dark:via-blue-500 dark:to-violet-600 text-white dark:text-navy-950 font-semibold shadow-md dark:shadow-glow hover:brightness-110 keep-white",
        secondary:
          "bg-slate-100 dark:bg-navy-850 text-slate-800 dark:text-foreground border border-slate-200 dark:border-navy-800 hover:bg-slate-200 dark:hover:bg-navy-800",
        outline:
          "border border-slate-300 dark:border-navy-800 bg-white dark:bg-transparent text-slate-700 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-navy-900 hover:text-slate-900 dark:hover:text-white",
        ghost:
          "hover:bg-slate-100 dark:hover:bg-navy-850 text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground",
        destructive:
          "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20",
        success:
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
