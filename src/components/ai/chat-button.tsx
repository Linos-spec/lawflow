"use client";

import { Bot } from "lucide-react";

export function ChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="lf-ai-fab" aria-label="Ask Linos AI" title="Ask Linos AI">
      <Bot style={{ width: 20, height: 20, flexShrink: 0 }} />
      <span className="lf-ai-fab-label">Ask Linos AI</span>
    </button>
  );
}
