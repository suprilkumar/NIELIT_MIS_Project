"use client";
import { useState, useRef, useEffect } from "react";

function UserMessage({ text }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] px-4 py-2.5 bg-blue-600 text-white text-sm 
        rounded-2xl rounded-br-md leading-relaxed">
        {text}
      </div>
    </div>
  );
}

function AIMessage({ text, loading }) {
  return (
    <div className="flex justify-start gap-3">
      <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex-shrink-0
        flex items-center justify-center mt-0.5">
        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.5l-1.57.393M5 14.5l-1.57.393"/>
        </svg>
      </div>
      <div className="max-w-[75%] px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-800 
        dark:text-gray-200 text-sm rounded-2xl rounded-bl-md leading-relaxed">
        {loading && !text ? (
          <span className="flex gap-1 items-center h-4">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"/>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"/>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"/>
          </span>
        ) : (
          <>
            {text}
            {loading && <span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 animate-pulse align-middle"/>}
          </>
        )}
      </div>
    </div>
  );
}

export default function ChatWindow({ sessionKey }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Connected! Ask me anything about your database." }
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Build chat_history in the format Django expects
  const buildHistory = (msgs) =>
    msgs
      .filter((m) => m.role !== "ai" || msgs.indexOf(m) !== 0)
      .map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text,
      }));

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || streaming) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setStreaming(true);

    // Add empty AI message that we'll stream into
    setMessages((prev) => [...prev, { role: "ai", text: "", loading: true }]);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/nl-sql/chat/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            session_key: sessionKey,
            chat_history: buildHistory(messages),
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          try {
            const { token, error } = JSON.parse(data);
            if (error) throw new Error(error);
            if (token) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  text: last.text + token,
                };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "ai",
          text: `Error: ${err.message}`,
          loading: false,
        };
        return updated;
      });
    } finally {
      setStreaming(false);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          loading: false,
        };
        return updated;
      });
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <UserMessage key={i} text={msg.text} />
          ) : (
            <AIMessage key={i} text={msg.text} loading={msg.loading} />
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your database..."
            rows={1}
            className="flex-1 resize-none px-4 py-2.5 text-sm border border-gray-200 
              dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 
              text-gray-900 dark:text-white placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500
              max-h-32 overflow-y-auto leading-relaxed"
            style={{ fieldSizing: "content" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 
              dark:disabled:bg-gray-700 text-white disabled:text-gray-400
              rounded-xl transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}