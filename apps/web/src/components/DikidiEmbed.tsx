import { useMemo } from "react";

const COMPANY = "116141";
const REAL_BOOKING = `https://dikidi.net/${COMPANY}`;

export function resolveDikidiUrl(): string {
  const env = (import.meta as ImportMeta & { env: Record<string, string> }).env;
  const raw = env.VITE_DIKIDI_EMBED_URL || "";
  if (raw && !raw.includes("widget/record")) return raw;
  const company = env.VITE_DIKIDI_COMPANY_ID || COMPANY;
  return `https://dikidi.net/${encodeURIComponent(company)}`;
}

export function DikidiEmbed({ className = "" }: { className?: string }) {
  const src = useMemo(() => resolveDikidiUrl() || REAL_BOOKING, []);

  return (
    <div className={`dikidi-embed ${className}`.trim()}>
      <div className="dikidi-embed__chrome">
        <span className="dikidi-embed__dot" />
        <span className="dikidi-embed__dot" />
        <span className="dikidi-embed__dot" />
        <span className="dikidi-embed__label">Онлайн-запись DIKIDI</span>
      </div>
      <iframe
        className="dikidi-embed__frame"
        title="Онлайн-запись DIKIDI — Центр Психотерапии"
        src={src}
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
        allow="payment *; clipboard-write"
      />
    </div>
  );
}
