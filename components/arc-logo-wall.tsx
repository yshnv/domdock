"use client";

export function ArcLogoWall() {
  return (
    <div className="w-full py-8">
      <p className="text-center font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#3139fb]/60 mb-6">
        Designed for creators shipping across modern registries & cloud stacks
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8 opacity-70 transition-opacity hover:opacity-100 sm:gap-12">
        {/* Vercel SVG */}
        <svg className="h-4 fill-[#3139fb]" viewBox="0 0 1155 1000" aria-label="Vercel">
          <path d="M577.344 0L1154.69 1000H0L577.344 0Z" />
        </svg>

        {/* Next.js SVG */}
        <svg className="h-5 fill-[#3139fb]" viewBox="0 0 180 180" aria-label="Next.js">
          <path d="M90 0C40.294 0 0 40.294 0 90s40.294 90 90 90 90-40.294 90-90S139.706 0 90 0Zm39.691 133.091L67.146 54H54v72h12V73.714l52.545 66.857a77.828 77.828 0 0 1-8.854 4.52Z" />
        </svg>

        {/* Cloudflare SVG */}
        <svg className="h-5 fill-[#3139fb]" viewBox="0 0 24 24" aria-label="Cloudflare">
          <path d="M16.5 10.5c-.2 0-.4 0-.6.1a5.4 5.4 0 0 0-10.2 1.9 4.2 4.2 0 0 0-3.2 4.1c0 2.4 1.9 4.4 4.3 4.4h11.4c2.1 0 3.8-1.7 3.8-3.8 0-2-1.6-3.7-3.7-3.8-.6-1.7-2.1-2.9-3.8-2.9z" />
        </svg>

        {/* Supabase SVG */}
        <svg className="h-5 fill-[#3139fb]" viewBox="0 0 106 106" aria-label="Supabase">
          <path d="M58.3 103.4c-2.3 3.1-7.2.9-6.3-2.9l10.9-46.7H13.6c-4 0-6.2-4.6-3.8-7.8L53.7 2.6c2.3-3.1 7.2-.9 6.3 2.9L49.1 52.2h39.3c4 0 6.2 4.6 3.8 7.8L58.3 103.4z" />
        </svg>

        {/* GitHub SVG */}
        <svg className="h-5 fill-[#3139fb]" viewBox="0 0 24 24" aria-label="GitHub">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      </div>
    </div>
  );
}
