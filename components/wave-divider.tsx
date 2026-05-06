type WaveDividerProps = {
  color?: string;
  flip?: boolean;
  /** Footer üstü — Bölüm 9 dalga (daha yüksek, çift tepe) */
  variant?: "default" | "footer";
};

export function WaveDivider({ color = "#ffffff", flip = false, variant = "default" }: WaveDividerProps) {
  if (variant === "footer") {
    const pathD =
      "M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z";
    return (
      <div
        aria-hidden
        className="w-full overflow-hidden leading-none"
        style={{ transform: flip ? "scaleY(-1)" : undefined }}
      >
        <div className="footer-wave-track h-20">
          <svg
            viewBox="0 0 1440 80"
            xmlns="http://www.w3.org/2000/svg"
            className="block h-20 w-1/2 shrink-0"
            preserveAspectRatio="none"
          >
            <path d={pathD} fill={color} />
          </svg>
          <svg
            viewBox="0 0 1440 80"
            xmlns="http://www.w3.org/2000/svg"
            className="block h-20 w-1/2 shrink-0"
            preserveAspectRatio="none"
          >
            <path d={pathD} fill={color} />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="w-full leading-none"
      style={{ transform: flip ? "scaleY(-1)" : undefined }}
    >
      <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="h-[60px] w-full">
        <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill={color} />
      </svg>
    </div>
  );
}
