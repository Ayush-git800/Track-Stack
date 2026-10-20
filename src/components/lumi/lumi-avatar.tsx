"use client";

import React from "react";
import Image from "next/image";

export interface LumiAvatarProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  state?: "idle" | "thinking" | "error";
  isThinking?: boolean;
  className?: string;
}

export function LumiAvatar({
  size = "md",
  state,
  isThinking = false,
  className = "",
}: LumiAvatarProps) {
  const currentState = state || (isThinking ? "thinking" : "idle");

  const sizeConfig = {
    xs: { px: 24, class: "w-6 h-6" },
    sm: { px: 32, class: "w-8 h-8" },
    md: { px: 40, class: "w-10 h-10" },
    lg: { px: 56, class: "w-14 h-14" },
    xl: { px: 80, class: "w-20 h-20" },
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${sizeConfig.class} ${className}`}
      aria-label={`Lumi Mascot (${currentState})`}
    >
      {/* Outer Cyan/Blue Glow Ring */}
      <div
        className={`absolute -inset-0.5 rounded-full transition-all duration-300 ${
          currentState === "thinking"
            ? "bg-linear-to-tr from-cyan-400 via-blue-500 to-indigo-500 animate-pulse opacity-95 blur-[2px]"
            : currentState === "error"
            ? "bg-red-500/80 animate-pulse opacity-80 blur-[2px]"
            : "bg-linear-to-tr from-cyan-500/60 via-blue-600/40 to-transparent motion-safe:animate-[pulse_4s_ease-in-out_infinite] motion-reduce:animate-none opacity-70 blur-[1px]"
        }`}
      />

      {/* Mascot Image Container (Never Stretches, Circular Container, Subtle Bob Animation in Idle) */}
      <div
        className={`relative z-10 w-full h-full rounded-full overflow-hidden bg-[#060B18] border border-cyan-400/40 shadow-xs flex items-center justify-center ${
          currentState === "idle"
            ? "motion-safe:animate-[bounce_4s_ease-in-out_infinite] motion-reduce:animate-none"
            : currentState === "thinking"
            ? "animate-pulse"
            : ""
        }`}
      >
        <Image
          src="/logos/lumi-mascot.png"
          alt="Lumi AI Assistant Mascot"
          width={sizeConfig.px}
          height={sizeConfig.px}
          className="w-full h-full object-contain rounded-full select-none pointer-events-none"
          priority={size === "lg" || size === "xl"}
        />
      </div>
    </div>
  );
}
