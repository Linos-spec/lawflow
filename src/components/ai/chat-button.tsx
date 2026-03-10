"use client";

import { Bot } from "lucide-react";

export function ChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="lf-ai-fab" aria-label="Open AI Assistant">
      <Bot style={{ width: 22, height: 22 }} />
    </button>
  );
}
