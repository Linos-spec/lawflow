"use client";

import { useState } from "react";
import { ChatButton } from "./chat-button";
import { ChatPanel } from "./chat-panel";

export function AiChatWrapper() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && <ChatButton onClick={() => setOpen(true)} />}
      {open && <ChatPanel onClose={() => setOpen(false)} />}
    </>
  );
}
