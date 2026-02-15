'use client';
import { cn } from '@/lib/utils';

interface FooterBackgroundProps {
  imageSrc?: string;
  className?: string;
  overlayOpacity?: number;
  children?: React.ReactNode;
}

export function FooterBackground({
  imageSrc = "/images/footer-bg.png",
  className,
  overlayOpacity = 0.45,
  children,
}: FooterBackgroundProps) {
  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={imageSrc}
          alt="Footer Background"
          className="object-cover w-full h-full"
        />
      </div>

      {/* Overlay for Contrast */}
      <div
        className="absolute inset-0 z-10 bg-gradient-to-br from-background/60 via-background/40 to-background/70 backdrop-blur-[2px]"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      />

      {/* Subtle Glow Overlay */}
      <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_30%_40%,theme(colors.primary/15),transparent_60%),radial-gradient(circle_at_70%_60%,theme(colors.secondary/15),transparent_60%)]" />

      {/* Foreground Content */}
      <div className="relative z-30 px-4">{children}</div>
    </div>
  );
}
