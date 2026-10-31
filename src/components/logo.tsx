type LogoMarkProps = {
  className?: string;
  color?: string;
};

export function LogoMark({ className, color = "#663CE6" }: LogoMarkProps) {
  return (
    <svg
      viewBox="122 90 258 324"
      fill={color}
      aria-hidden="true"
      className={className}
    >
      <path d="M127 163 250 94l124 66-58 32-64-27-65 37v74l-60-35z" />
      <path d="M127 262l58 34v79l-58-32z" />
      <path d="M256 228h120v115l-126 68-60-33 126-65v-36h-58l-45-21z" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark className="h-9 w-auto" />
      <span className="font-display text-lg font-semibold tracking-tight text-wg-graphite">
        WebGeele
      </span>
    </span>
  );
}
