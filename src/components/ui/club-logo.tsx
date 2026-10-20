"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ClubLogoProps {
  name: string;
  logoUrl?: string | null;
  accentColor?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: { box: "h-6 w-6 text-[10px]", px: 24 },
  sm: { box: "h-8 w-8 text-xs", px: 32 },
  md: { box: "h-11 w-11 text-sm font-semibold", px: 44 },
  lg: { box: "h-16 w-16 text-lg font-bold", px: 64 },
  xl: { box: "h-24 w-24 text-2xl font-extrabold", px: 96 },
};

function getInitials(name: string): string {
  if (!name) return "TS";
  const clean = name.replace(/[()]/g, "").trim();
  const words = clean.split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function ClubLogo({
  name,
  logoUrl,
  accentColor = "#3B82F6",
  size = "md",
  className,
}: ClubLogoProps) {
  const [hasError, setHasError] = React.useState(false);
  const { box, px } = sizeMap[size];

  const normalizedUrl = React.useMemo(() => {
    if (!logoUrl) return null;
    return logoUrl;
  }, [logoUrl]);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950/80 shadow-xs dark:shadow-md transition-transform hover:scale-105",
        box,
        className
      )}
      style={{
        boxShadow: accentColor ? `0 0 12px -2px ${accentColor}25` : undefined,
        borderColor: accentColor ? `${accentColor}44` : undefined,
      }}
    >
      {normalizedUrl && !hasError ? (
        <Image
          src={normalizedUrl}
          alt={`${name} logo`}
          width={px}
          height={px}
          className="h-full w-full object-contain p-0.5"
          onError={() => setHasError(true)}
          priority={size === "lg" || size === "xl"}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-bold"
          style={{
            backgroundColor: `${accentColor || "#1E293B"}15`,
            color: accentColor || "#0284C7",
          }}
        >
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
