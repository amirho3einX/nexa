
"use client";

import { FormEvent, useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  stock: number;
  imageUrl: string | null;
  category: string;
};

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  products?: Product[];
};

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hi! I'm Nexa AI. Tell me what you're looking for and I'll help you find the right product.",
    },
  ]);

  useEffect(() => {
    function handleOpenChat() {
      setOpen(true);
    }

    window.addEventListener("open-nexa-ai", handleOpenChat);

    return () => {
      window.removeEventListener(
        "open-nexa-ai",
        handleOpenChat
      );
    };
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const text = input.trim();

    if (!text || loading) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to get AI response"
        );
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.message,
        products: Array.isArray(data.products)
          ? data.products
          : [],
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("AI request failed:", error);

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "Sorry, I couldn't connect to Nexa AI right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-28 right-5 z-[100] flex h-[560px] w-[calc(100vw-2rem)] max-w-[410px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/15 sm:right-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-xs font-bold text-white">
                NX
              </div>

              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  Nexa AI
                </p>

                <div className="mt-0.5 flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      loading
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />

                  <span className="text-[11px] text-zinc-500">
                    {loading ? "Thinking..." : "Online"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Close chat"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  d="M6 6l12 12M18 6 6 18"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-zinc-50/70 p-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[90%] ${
                    message.role === "user"
                      ? "rounded-2xl rounded-br-md bg-black px-4 py-3 text-sm leading-5 text-white"
                      : "rounded-2xl rounded-bl-md border border-zinc-200 bg-white text-zinc-700"
                  }`}
                >
                  <div
                    className={
                      message.role === "assistant"
                        ? "px-4 py-3 text-sm leading-5"
                        : ""
                    }
                  >
                    {message.content}
                  </div>

                  {/* Product Cards */}
                  {message.role === "assistant" &&
                    message.products &&
                    message.products.length > 0 && (
                      <div className="space-y-2.5 border-t border-zinc-100 p-2.5">
                        {message.products.map((product) => (
                          <div
                            key={product.id}
                            className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
                          >
                            <div className="flex gap-3 p-2.5">
                              {/* Product Image */}
                              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">
                                    No image
                                  </div>
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-sm font-semibold leading-5 text-zinc-900">
                                  {product.name}
                                </p>

                                <p className="mt-1 text-sm font-medium text-zinc-900">
                                  ${product.price}
                                </p>

                                <p
                                  className={`mt-0.5 text-[11px] ${
                                    product.stock > 0
                                      ? "text-emerald-600"
                                      : "text-red-500"
                                  }`}
                                >
                                  {product.stock > 0
                                    ? "In stock"
                                    : "Out of stock"}
                                </p>
                              </div>
                            </div>

                            {/* View Product */}
                            <a
                              href={`/products/${product.slug}`}
                              className="block border-t border-zinc-100 px-3 py-2.5 text-center text-xs font-semibold text-zinc-900 transition hover:bg-zinc-50"
                            >
                              View product
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />

                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
                      style={{
                        animationDelay: "120ms",
                      }}
                    />

                    <span
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
                      style={{
                        animationDelay: "240ms",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-zinc-100 bg-white p-4"
          >
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1.5 focus-within:border-zinc-400 focus-within:bg-white">
              <input
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                disabled={loading}
                placeholder={
                  loading
                    ? "Nexa AI is thinking..."
                    : "Ask Nexa AI..."
                }
                className="min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Send message"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m5 12 14-7-4 14-3-6-7-1Z"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating AI button */}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`fixed bottom-5 right-5 z-[100] flex h-16 min-w-[155px] items-center justify-center gap-3 rounded-2xl px-5 text-base font-semibold shadow-xl shadow-zinc-900/15 transition-all duration-200 sm:right-6 ${
          open
            ? "bg-zinc-800 text-white hover:bg-zinc-700"
            : "bg-black text-white hover:-translate-y-0.5 hover:bg-zinc-800"
        }`}
        aria-label={
          open ? "Close Nexa AI" : "Open Nexa AI"
        }
      >
        {open ? (
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 6l12 12M18 6 6 18"
            />
          </svg>
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-lg">
            ✦
          </span>
        )}

        <span>{open ? "Close" : "Nexa AI"}</span>
      </button>
    </>
  );
}

