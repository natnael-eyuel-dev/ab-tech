'use client';

import Link from "next/link";

interface ABTECHLogoProps {
  size?: "sm" | "md" | "lg";
  topMargin?: boolean;
  bottomMargin?: boolean;
  justify?: "start" | "center" | "end";
}

export function ABTECHLogo({
  size = "md",
  topMargin = false,
  bottomMargin = false,
  justify = "start",
}: ABTECHLogoProps) {
  // Responsive logo sizing
  const sizeClasses =
    size === "sm"
      ? "h-8 sm:h-9"
      : size === "lg"
      ? "h-12 sm:h-14"
      : "h-10 sm:h-12";

  // Optional margin-top
  const marginTopClass = topMargin ? "mt-2 sm:mt-4" : "";
  const marginBottomClass = bottomMargin ? "mb-2 sm:mb-3" : "";

  // Justification
  const justifyClass =
    justify === "center"
      ? "justify-center"
      : justify === "end"
      ? "justify-end"
      : "justify-start";

  return (
    <div className={`flex h-16 items-center ${justifyClass} ${marginTopClass} ${marginBottomClass}`}>
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center space-x-2"
      >
        <img
          src="/images/logo-mark.png"
          alt="ABTech Logo"
          className={`${sizeClasses} w-auto object-contain transition-transform duration-300 hover:scale-105`}
        />
      </Link>
    </div>
  );
}
