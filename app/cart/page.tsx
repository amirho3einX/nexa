
"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const shipping: number = subtotal > 0 ? 0 : 0;
  const total: number = subtotal + shipping;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 transition hover:opacity-80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white">
              EA
            </div>

            <div>
              <div className="text-lg font-black tracking-tight">
                Ecommerce AI
              </div>
              <div className="text-xs text-slate-500">
                Smart shopping experience
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Continue Shopping
          </Link>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/"
            className="transition hover:text-slate-900"
          >
            Home
          </Link>

          <span>/</span>

          <span className="font-medium text-slate-900">
            Cart
          </span>
        </div>

        {/* Page heading */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Shopping Cart
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Your Cart
            </h1>

            <p className="mt-3 text-base text-slate-500">
              {itemCount === 0
                ? "Your cart is currently empty."
                : `${itemCount} ${
                    itemCount === 1 ? "item" : "items"
                  } in your cart.`}
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="self-start rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 sm:self-auto"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Empty cart */}
        {items.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm sm:p-16">
            <div className="mx-auto flex max-w-xl flex-col items-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-100 text-4xl">
                🛒
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Your cart is empty
              </h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                Looks like you haven&apos;t added anything to your
                cart yet. Explore our products and find something
                you&apos;ll love.
              </p>

              <Link
                href="/"
                className="mt-8 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Start Shopping
              </Link>
            </div>
          </section>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Cart items */}
            <section className="space-y-4">
              {items.map((item) => {
                const productTotal: number =
                  Number(item.product.price) * item.quantity;

                return (
                  <article
                    key={item.product.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row">
                      {/* Product image */}
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="group flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 sm:h-32 sm:w-32"
                      >
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-slate-400">
                            No image
                          </div>
                        )}
                      </Link>

                      {/* Product information */}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex flex-1 flex-col sm:flex-row sm:justify-between sm:gap-6">
                          <div>
                            <Link
                              href={`/products/${item.product.slug}`}
                              className="text-lg font-bold text-slate-950 transition hover:text-slate-600"
                            >
                              {item.product.name}
                            </Link>

                            <p className="mt-1 text-sm text-slate-500">
                              ${Number(item.product.price).toFixed(2)}{" "}
                              each
                            </p>

                            {item.product.stock > 0 && (
                              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                In stock
                              </div>
                            )}
                          </div>

                          <div className="mt-4 text-left sm:mt-0 sm:text-right">
                            <div className="text-xl font-black text-slate-950">
                              ${productTotal.toFixed(2)}
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              Item total
                            </div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity - 1
                                )
                              }
                              disabled={item.quantity <= 1}
                              className="flex h-10 w-10 items-center justify-center text-lg font-bold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300"
                              aria-label={`Decrease quantity of ${item.product.name}`}
                            >
                              −
                            </button>

                            <div className="flex h-10 min-w-12 items-center justify-center border-x border-slate-200 bg-white px-3 text-sm font-bold">
                              {item.quantity}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity + 1
                                )
                              }
                              disabled={
                                item.quantity >=
                                item.product.stock
                              }
                              className="flex h-10 w-10 items-center justify-center text-lg font-bold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300"
                              aria-label={`Increase quantity of ${item.product.name}`}
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(item.product.id)
                            }
                            className="rounded-xl px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            {/* Order summary */}
            <aside className="lg:sticky lg:top-28 lg:h-fit">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <div className="mb-6">
                  <h2 className="text-xl font-black tracking-tight text-slate-950">
                    Order Summary
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Review your order before checkout.
                  </p>
                </div>

                <div className="space-y-4 border-b border-slate-200 pb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Items
                    </span>

                    <span className="font-semibold text-slate-900">
                      {itemCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Subtotal
                    </span>

                    <span className="font-semibold text-slate-900">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Shipping
                    </span>

                    <span className="font-semibold text-emerald-600">
                      Free
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-6">
                  <span className="text-base font-bold text-slate-900">
                    Total
                  </span>

                  <span className="text-2xl font-black text-slate-950">
                    ${total.toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white transition hover:bg-slate-800"
                  onClick={() => {
                    alert(
                      "Checkout will be available in the next step."
                    );
                  }}
                >
                  Proceed to Checkout
                </button>

                <Link
                  href="/"
                  className="mt-3 flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Continue Shopping
                </Link>

                {/* Trust cards */}
                <div className="mt-6 grid gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm font-bold text-slate-900">
                      🔒 Secure Shopping
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Your cart information is stored securely.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm font-bold text-slate-900">
                      🤖 AI Shopping Assistant
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Need help choosing a product? Our AI
                      assistant can help.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-10 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>
            © {new Date().getFullYear()} Ecommerce AI
          </span>

          <span>
            Smart shopping powered by AI.
          </span>
        </div>
      </footer>
    </main>
  );
}

