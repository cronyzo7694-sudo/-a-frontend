import { useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════
   Community Chat — "Batiyan" universal chat embedded in-app.
   No title bar — the chat iframe takes the full area, with a
   small floating fullscreen toggle button (top-right) that can
   also hide the button itself.
   ═══════════════════════════════════════════════════════════ */

const CHAT_URL = "https://anim-kineora.cronyzo7694.workers.dev/";

export function ChatPage() {
  const [loaded, setLoaded] = useState(false);
  const [btnVisible, setBtnVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        el.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div ref={rootRef} className="relative h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* Floating fullscreen toggle — top-right, collapsible */}
      {btnVisible && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          {/* Open chat in a new tab as a backup */}
          <a
            href={CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md shadow transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            title="Fullscreen"
            className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md shadow transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M20 8V6a2 2 0 00-2-2h-2M4 16v2a2 2 0 002 2h2m10 0h2a2 2 0 002-2v-2" />
            </svg>
          </button>

          {/* Hide button */}
          <button
            onClick={() => setBtnVisible(false)}
            title="Hide controls"
            className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md shadow transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Chat iframe — full area */}
      <div className="absolute inset-0">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Chat load ho raha hai…
          </div>
        )}
        <iframe
          src={CHAT_URL}
          title="Community Chat"
          className="w-full h-full border-0"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
