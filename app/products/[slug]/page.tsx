
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

type Category = {
  id: number;
  name: string;
  slug: string;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  stock: number;
  imageUrl: string | null;
  category: Category;
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();

  const { addToCart, itemCount } = useCart();

  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [added, setAdded] = useState<boolean>(false);

  useEffect(() => {
    async function loadProduct(): Promise<void> {
      try {
        setLoading(true);
        setError("");

        const response: Response = await fetch(
          `/api/products/${slug}`
        );

        if (!response.ok) {
          throw new Error("Product not found");
        }

        const data: Product = await response.json();

        setProduct(data);
      } catch (error: unknown) {
        console.error(error);
        setError("Product not found");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      void loadProduct();
    }
  }, [slug]);

  function increaseQuantity(): void {
    if (!product) return;

    setQuantity((current: number) =>
      Math.min(current + 1, product.stock)
    );
  }

  function decreaseQuantity(): void {
    setQuantity((current: number) =>
      Math.max(current - 1, 1)
    );
  }

  function handleAddToCart(): void {
    if (!product || product.stock === 0) {
      return;
    }

    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: product.stock,
      },
      quantity
    );

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1800);
  }

  function handleBuyNow(): void {
    if (!product || product.stock === 0) {
      return;
    }

    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: product.stock,
      },
      quantity
    );

    router.push("/cart");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fafafa] text-zinc-900">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex h-20 max-w-7xl items-center px-6">
            <div className="h-10 w-32 animate-pulse rounded-xl bg-zinc-100" />
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-6 py-10 md:py-14">
          <div className="mb-10 h-10 w-36 animate-pulse rounded-xl bg-zinc-200" />

          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="aspect-square animate-pulse rounded-[2rem] bg-zinc-200" />

            <div className="flex flex-col justify-center space-y-6">
              <div className="h-7 w-28 animate-pulse rounded-full bg-zinc-200" />

              <div className="space-y-3">
                <div className="h-12 w-4/5 animate-pulse rounded-xl bg-zinc-200" />
                <div className="h-12 w-3/5 animate-pulse rounded-xl bg-zinc-200" />
              </div>

              <div className="h-10 w-36 animate-pulse rounded-xl bg-zinc-200" />

              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
                <div className="h-4 w-11/12 animate-pulse rounded bg-zinc-200" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-200" />
              </div>

              <div className="h-14 w-full animate-pulse rounded-xl bg-zinc-200" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fafafa] px-6 text-zinc-900">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
            <svg
              className="h-7 w-7 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
                d="M9.75 9.75 14.25 14.25M14.25 9.75 9.75 14.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            Product not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            The product you&apos;re looking for doesn&apos;t exist
            or may have been removed.
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M19 12H5m7 7-7-7 7-7"
              />
            </svg>

            Back to shop
          </button>
        </div>
      </main>
    );
  }

  const isInStock: boolean = product.stock > 0;

  return (
    <main className="min-h-screen bg-[#fafafa] text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <button
            onClick={() => router.push("/")}
            className="group inline-flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-black hover:shadow"
          >
            <svg
              className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M19 12H5m7 7-7-7 7-7"
              />
            </svg>

            Back to shop
          </button>

          <button
            onClick={() => router.push("/")}
            className="absolute left-1/2 -translate-x-1/2 text-base font-semibold tracking-tight"
          >
            Ecommerce AI
          </button>

          <button
            onClick={() => router.push("/cart")}
            className="group flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:shadow"
          >
            <svg
              className="h-5 w-5 text-zinc-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H7"
              />

              <circle cx="10" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>

            <span className="hidden sm:block">Cart</span>

            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[10px] font-semibold text-white">
              {itemCount}
            </span>
          </button>
        </div>
      </header>

      {/* Product */}
      <section className="mx-auto max-w-7xl px-6 py-8 md:py-12">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-xs text-zinc-400">
          <button
            onClick={() => router.push("/")}
            className="transition hover:text-zinc-700"
          >
            Shop
          </button>

          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="m9 18 6-6-6-6"
            />
          </svg>

          <span>{product.category.name}</span>

          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="m9 18 6-6-6-6"
            />
          </svg>

          <span className="max-w-48 truncate text-zinc-600">
            {product.name}
          </span>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* Product Image */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="group relative overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="aspect-square w-full object-cover transition duration-700 ease-out group-hover:scale-[1.025]"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center text-sm text-zinc-400">
                  No image available
                </div>
              )}

              <div className="absolute left-5 top-5 rounded-full border border-white/60 bg-white/90 px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur">
                {product.category.name}
              </div>

              {isInStock && (
                <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full border border-white/60 bg-white/90 px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  In stock
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center">
                <p className="text-xs font-medium text-zinc-500">
                  Quality
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center">
                <p className="text-xs font-medium text-zinc-500">
                  Easy shopping
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center">
                <p className="text-xs font-medium text-zinc-500">
                  Reliable
                </p>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600">
                {product.category.name}
              </span>

              <span className="text-xs text-zinc-400">
                Product #{product.id}
              </span>
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-zinc-950 sm:text-5xl">
              {product.name}
            </h1>

            <div className="mt-6 flex items-end gap-3">
              <span className="text-4xl font-semibold tracking-tight text-zinc-950">
                ${product.price}
              </span>

              <span className="pb-1 text-sm text-zinc-400">
                USD
              </span>
            </div>

            <div className="my-8 h-px bg-zinc-200" />

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                About this product
              </p>

              <p className="mt-4 max-w-xl text-[15px] leading-7 text-zinc-500">
                {product.description ||
                  "A carefully selected product designed to give you a simple and reliable shopping experience."}
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isInStock
                        ? "bg-emerald-50"
                        : "bg-red-50"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isInStock
                          ? "bg-emerald-500"
                          : "bg-red-500"
                      }`}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-zinc-800">
                      {isInStock
                        ? "Available now"
                        : "Currently unavailable"}
                    </p>

                    <p className="mt-0.5 text-xs text-zinc-400">
                      {isInStock
                        ? `${product.stock} units available`
                        : "Check back later"}
                    </p>
                  </div>
                </div>

                {isInStock && (
                  <span className="text-xs font-medium text-emerald-600">
                    In stock
                  </span>
                )}
              </div>
            </div>

            {isInStock && (
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    Quantity
                  </p>

                  <p className="text-xs text-zinc-400">
                    Max {product.stock}
                  </p>
                </div>

                <div className="mt-3 flex w-fit items-center overflow-hidden rounded-xl border border-zinc-200 bg-white">
                  <button
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className="flex h-12 w-12 items-center justify-center text-xl text-zinc-500 transition hover:bg-zinc-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>

                  <span className="flex h-12 w-14 items-center justify-center border-x border-zinc-200 text-sm font-semibold">
                    {quantity}
                  </span>

                  <button
                    onClick={increaseQuantity}
                    disabled={quantity >= product.stock}
                    className="flex h-12 w-12 items-center justify-center text-xl text-zinc-500 transition hover:bg-zinc-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {isInStock ? (
              <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_0.65fr]">
                <button
                  onClick={handleAddToCart}
                  className={`group flex h-14 items-center justify-center gap-3 rounded-xl px-6 text-sm font-semibold transition active:scale-[0.99] ${
                    added
                      ? "bg-emerald-600 text-white hover:bg-emerald-600"
                      : "bg-black text-white hover:bg-zinc-800"
                  }`}
                >
                  {added ? (
                    <>
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="m5 12 4 4L19 6"
                        />
                      </svg>

                      Added to cart
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-5 w-5 transition-transform group-hover:-translate-y-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H7"
                        />

                        <circle cx="10" cy="20" r="1" />
                        <circle cx="18" cy="20" r="1" />
                      </svg>

                      Add to cart
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  className="h-14 rounded-xl border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.99]"
                >
                  Buy now
                </button>
              </div>
            ) : (
              <button
                disabled
                className="mt-8 h-14 w-full cursor-not-allowed rounded-xl bg-zinc-200 text-sm font-semibold text-zinc-500"
              >
                Out of stock
              </button>
            )}

            <div className="mt-8 grid gap-4 border-t border-zinc-200 pt-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-zinc-800">
                  Secure shopping
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  Simple and secure checkout experience.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-zinc-800">
                  AI assistance
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  Get help choosing the right product.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              Looking for something else?
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Explore the rest of our collection.
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="group inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-black"
          >
            Browse all products

            <svg
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M5 12h14m-7-7 7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </section>
    </main>
  );
}

