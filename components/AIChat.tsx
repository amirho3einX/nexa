
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

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
  const { addToCart } = useCart();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [addedProducts, setAddedProducts] = useState<number[]>([]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hi! I'm Nexa AI. I can help you find products, compare prices, and answer questions about our store.",
    },
  ]);

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
    };

    window.addEventListener(
      "open-nexa-ai",
      handleOpen
    );

    return () => {
      window.removeEventListener(
        "open-nexa-ai",
        handleOpen
      );
    };
  }, []);

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const trimmedInput = input.trim();

    if (!trimmedInput || loading) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: trimmedInput,
    };

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/ai/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: updatedMessages.map(
              (message) => ({
                role: message.role,
                content: message.content,
              })
            ),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Something went wrong."
        );
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          data.message ||
          "I couldn't find a suitable answer.",
        products: Array.isArray(data.products)
          ? data.products
          : [],
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (error) {
      console.error(
        "Nexa AI chat error:",
        error
      );

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart(product: Product) {
    if (product.stock <= 0) {
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl,
      category: product.category,
    });

    setAddedProducts((current) => {
      if (current.includes(product.id)) {
        return current;
      }

      return [...current, product.id];
    });

    window.setTimeout(() => {
      setAddedProducts((current) =>
        current.filter(
          (id) => id !== product.id
        )
      );
    }, 1500);
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[calc(100vw-40px)] max-w-[410px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                Nexa AI
              </div>

              <div className="text-xs text-gray-500">
                Shopping assistant
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="h-[560px] overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "flex justify-end"
                      : "flex justify-start"
                  }
                >
                  <div
                    className={
                      message.role === "user"
                        ? "max-w-[82%] rounded-2xl rounded-br-md bg-black px-4 py-2.5 text-sm leading-6 text-white"
                        : "max-w-[92%] rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2.5 text-sm leading-6 text-gray-900"
                    }
                  >
                    <div className="whitespace-pre-wrap">
                      {message.content}
                    </div>

                    {/* Product cards */}
                    {message.role ===
                      "assistant" &&
                      message.products &&
                      message.products.length >
                        0 && (
                        <div className="mt-3 space-y-2">
                          {message.products.map(
                            (product) => {
                              const isAdded =
                                addedProducts.includes(
                                  product.id
                                );

                              const isOutOfStock =
                                product.stock <= 0;

                              return (
                                <div
                                  key={
                                    product.id
                                  }
                                  className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                                >
                                  <div className="flex gap-3 p-3">
                                    {/* Image */}
                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                      {product.imageUrl ? (
                                        <img
                                          src={
                                            product.imageUrl
                                          }
                                          alt={
                                            product.name
                                          }
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                          No image
                                        </div>
                                      )}
                                    </div>

                                    {/* Product info */}
                                    <div className="min-w-0 flex-1">
                                      <div className="line-clamp-2 text-sm font-semibold text-gray-900">
                                        {
                                          product.name
                                        }
                                      </div>

                                      <div className="mt-1 text-sm font-medium text-gray-900">
                                        $
                                        {Number(
                                          product.price
                                        ).toFixed(2)}
                                      </div>

                                      <div className="mt-0.5 text-xs text-gray-500">
                                        {isOutOfStock
                                          ? "Out of stock"
                                          : "In stock"}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex gap-2 border-t border-gray-100 p-2">
                                    <Link
                                      href={`/products/${product.slug}`}
                                      onClick={() =>
                                        setOpen(
                                          false
                                        )
                                      }
                                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-center text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                                    >
                                      View product
                                    </Link>

                                    <button
                                      type="button"
                                      disabled={
                                        isOutOfStock ||
                                        isAdded
                                      }
                                      onClick={() =>
                                        handleAddToCart(
                                          product
                                        )
                                      }
                                      className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition ${
                                        isOutOfStock
                                          ? "cursor-not-allowed bg-gray-100 text-gray-400"
                                          : isAdded
                                          ? "bg-gray-200 text-gray-700"
                                          : "bg-black text-white hover:bg-gray-800"
                                      }`}
                                    >
                                      {isOutOfStock
                                        ? "Out of stock"
                                        : isAdded
                                        ? "Added"
                                        : "Add to cart"}
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                  </div>
                </div>
              ))}

              {/* Loading */}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-200 p-3"
          >
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1.5 focus-within:border-gray-400">
              <input
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                placeholder="Ask about products..."
                disabled={loading}
                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={
                  loading ||
                  !input.trim()
                }
                className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex h-16 min-w-[155px] items-center justify-center gap-2 rounded-2xl bg-black px-5 text-sm font-semibold text-white shadow-xl transition hover:bg-gray-800"
        >
          <span className="text-base">
            ✦
          </span>

          Chat with AI
        </button>
      )}
    </>
  );
}
