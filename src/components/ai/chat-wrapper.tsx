"use client";

import { useState } from "react";
import { ChatButton } from "./chat-button";
import { ChatPanel } from "./chat-panel";
import { track } from "@/lib/analytics";

export function AiChatWrapper() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && <ChatButton onClick={() => { setOpen(true); track("ai_assistant_opened"); }} />}
      {open && <ChatPanel onClose={() => setOpen(false)} />}
    </>
  );
}
