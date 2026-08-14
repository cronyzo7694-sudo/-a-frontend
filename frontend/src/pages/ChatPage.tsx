import { useState } from "react";

/* ═══════════════════════════════════════════════════════════
   Community Chat — "Batiyan" universal chat embedded in-app.
   Real-time translated chat with people all over the world.
   Loaded in an iframe so it feels like part of the site.
   ═══════════════════════════════════════════════════════════ */

const CHAT_URL = "https://anim-kineora.cronyzo7694.workers.dev/";

export function ChatPage() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header strip */}
      <div className="px-4 sm:px-6 py-3 border-b flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Community Chat</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            दुनिया भर के लोगों से बात करें — अपनी भाषा में लिखें, हर कोई आपकी भाषा समझ जाएगा।
          </p>
        </div>
        <a
          href={CHAT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-medium text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/10 transition-colors"
        >
          Full Screen ↗
        </a>
      </div>

      {/* Chat iframe */}
      <div className="flex-1 relative min-h-0">
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
