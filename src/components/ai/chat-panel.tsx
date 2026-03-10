"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { X, Send, Sparkles, Bot } from "lucide-react";

const suggestedPrompts = [
  "What are my upcoming deadlines?",
  "Show me all open cases",
  "Summarize my billing overview",
  "Which invoices are overdue?",
];

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: "/api/v1/ai/chat" }),
  });

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSend(text?: string) {
    const message = text || input.trim();
    if (!message || isLoading) return;
    setInput("");
    await sendMessage({ text: message });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className="fixed top-0 right-0 h-full flex flex-col animate-fade-in"
      style={{
        width: "400px",
        maxWidth: "100vw",
        background: "var(--bg-card)",
        borderLeft: "1px solid var(--border-light)",
        boxShadow: "var(--shadow-xl)",
        zIndex: 51,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{
          background: "var(--navy)",
          color: "white",
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles style={{ width: 18, height: 18, color: "var(--gold-light)" }} />
          <span className="font-semibold text-sm">AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md transition-colors"
          style={{ color: "rgba(255,255,255,0.7)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <X style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "rgba(196,154,46,0.12)" }}
            >
              <Bot style={{ width: 24, height: 24, color: "var(--gold)" }} />
            </div>
            <p
              className="font-semibold text-sm mb-1"
              style={{ color: "var(--navy)" }}
            >
              How can I help?
            </p>
            <p
              className="text-xs mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              Ask about your cases, deadlines, or billing
            </p>
            <div className="space-y-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="block w-full text-left text-xs rounded-lg px-3 py-2 transition-colors"
                  style={{
                    background: "var(--bg-base)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-light)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--gold)";
                    e.currentTarget.style.color = "var(--navy)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-light)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "flex justify-end"
                : "flex justify-start"
            }
          >
            {message.role === "assistant" && (
              <div
                className="flex-shrink-0 mr-2 mt-1 flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: "var(--navy)" }}
              >
                <Sparkles
                  style={{ width: 12, height: 12, color: "var(--gold-light)" }}
                />
              </div>
            )}
            <div
              className={
                message.role === "user"
                  ? "lf-chat-bubble-user"
                  : "lf-chat-bubble-ai"
              }
            >
              {message.role === "assistant" ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: formatAiMessage(
                      message.parts
                        ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
                        .map((p) => p.text)
                        .join("") || ""
                    ),
                  }}
                />
              ) : (
                <>{message.parts?.filter((p): p is { type: "text"; text: string } => p.type === "text").map((p) => p.text).join("") || ""}</>
              )}
            </div>
          </div>
        ))}

        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && (
            <div className="flex justify-start">
              <div
                className="flex-shrink-0 mr-2 mt-1 flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: "var(--navy)" }}
              >
                <Sparkles
                  style={{ width: 12, height: 12, color: "var(--gold-light)" }}
                />
              </div>
              <div className="lf-chat-bubble-ai">
                <div className="lf-typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="flex-shrink-0 px-4 py-3"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your cases..."
            rows={1}
            className="lf-input flex-1"
            style={{
              resize: "none",
              minHeight: "38px",
              maxHeight: "120px",
              fontSize: "0.8125rem",
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="lf-btn lf-btn-gold flex-shrink-0"
            style={{
              padding: "0.5rem",
              opacity: isLoading || !input.trim() ? 0.5 : 1,
            }}
          >
            <Send style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatAiMessage(content: string): string {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, '<code style="background:var(--bg-base);padding:1px 4px;border-radius:3px;font-size:0.8em">$1</code>')
    .replace(/^### (.*$)/gm, '<strong style="color:var(--navy);display:block;margin-top:8px;margin-bottom:4px">$1</strong>')
    .replace(/^## (.*$)/gm, '<strong style="color:var(--navy);display:block;margin-top:8px;margin-bottom:4px">$1</strong>')
    .replace(/^- (.*$)/gm, '<span style="display:block;padding-left:12px;text-indent:-8px">&bull; $1</span>')
    .replace(/^\d+\. (.*$)/gm, '<span style="display:block;padding-left:12px">$&</span>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
