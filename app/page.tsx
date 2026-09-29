
"use client";

import AIChat from "@/components/AIChat";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

type ProductsResponse = {
  products: Product[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type User = {
  id: number;
  name: string | null;
  email: string;
  role: "CUSTOMER" | "ADMIN";
};

export default function Home() {
  const { itemCount } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] =
    useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadCategories();
    void loadUser();
  }, []);

  useEffect(() => {
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      void loadProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  async function loadUser(): Promise<void> {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data: { user: User | null } = await response.json();

      setUser(data.user);
    } catch (error: unknown) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout(): Promise<void> {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to logout");
      }

      setUser(null);
      setProfileOpen(false);
    } catch (error: unknown) {
      console.error("Failed to logout:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  async function loadCategories(): Promise<void> {
    try {
      const response: Response = await fetch("/api/categories");

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data: Category[] = await response.json();

      setCategories(data);
    } catch (error: unknown) {
      console.error("Failed to fetch categories:", error);
      setCategories([]);
    }
  }

  async function loadProducts(): Promise<void> {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }

      params.set("limit", "100");

      const response = await fetch(
        `/api/products?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data: ProductsResponse = await response.json();

      setProducts(data.products);
    } catch (error: unknown) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryChange(slug: string): void {
    setSelectedCategory(slug);
  }

  function handleShopProducts(): void {
    setSelectedCategory("all");

    document
      .getElementById("products")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  const activeCategoryName =
    selectedCategory === "all"
      ? "Featured products"
      : categories.find(
          (category) => category.slug === selectedCategory
        )?.name ?? "Products";

  const displayName = user?.name || user?.email || "Account";

  const avatarLetter =
    user?.name?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "A";

  return (
    <main className="min-h-screen bg-[#fafafa] text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-8 px-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-sm font-bold text-white shadow-sm">
              NX
            </div>

            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Nexa
              </h1>

              <p className="text-xs text-zinc-500">
                Smart shopping
              </p>
            </div>
          </Link>

          {/* Search */}
          <div className="hidden max-w-xl flex-1 md:block">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="m21 21-4.35-4.35m1.35-5.4a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"
                />
              </svg>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search products..."
                className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Auth */}
            {authLoading ? (
              <div className="hidden h-10 w-24 animate-pulse rounded-xl bg-zinc-100 sm:block" />
            ) : !user ? (
              <Link
                href="/login"
                className="hidden rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 sm:block"
              >
                Sign in
              </Link>
            ) : (
              <div
                ref={profileRef}
                className="relative hidden sm:block"
              >
                <button
                  type="button"
                  onClick={() =>
                    setProfileOpen((current) => !current)
                  }
                  aria-expanded={profileOpen}
                  className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2.5 pr-3 transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-xs font-semibold text-white">
                    {avatarLetter}
                  </span>

                  <span className="max-w-28 truncate text-sm font-medium text-zinc-800">
                    {displayName}
                  </span>

                  <svg
                    className={`h-4 w-4 text-zinc-400 transition-transform ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="m6 9 6 6 6-6"
                    />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl shadow-zinc-200/40">
                    <div className="px-3 py-3">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {displayName}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {user.email}
                      </p>
                    </div>

                    <div className="border-t border-zinc-100 pt-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                            d="M10 17l5-5-5-5m5 5H3m10-9h4a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-4"
                          />
                        </svg>

                        <span>
                          {loggingOut
                            ? "Signing out..."
                            : "Sign out"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart */}
            <button
              onClick={() => {
                window.location.href = "/cart";
              }}
              className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium shadow-sm transition hover:border-zinc-300 hover:shadow"
            >
              <svg
                className="h-5 w-5"
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

              <span className="hidden sm:inline">Cart</span>

              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[10px] text-white">
                {itemCount}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="border-t border-zinc-100 px-6 py-3 md:hidden">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products..."
            className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:bg-white"
          />
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              AI-powered shopping
            </div>

            <h2 className="text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-zinc-950 sm:text-[2.8rem] md:text-5xl">
              Shop smarter.
              <br />
              <span className="text-zinc-400">
                Find what you need.
              </span>
            </h2>

            <p className="mt-5 max-w-lg text-sm leading-6 text-zinc-500 sm:text-base">
              Discover carefully selected products with intelligent
              search and personalized shopping assistance.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={handleShopProducts}
                className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Shop products
              </button>

              <button
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open-nexa-ai")
                  );
                }}
                className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Ask AI assistant
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section
        id="products"
        className="mx-auto max-w-7xl px-6 py-12 md:py-14"
      >
        <div className="mb-7 overflow-x-auto">
          <div className="flex min-w-max gap-2">
            <button
              onClick={() => handleCategoryChange("all")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                selectedCategory === "all"
                  ? "bg-black text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() =>
                  handleCategoryChange(category.slug)
                }
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === category.slug
                    ? "bg-black text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Collection
            </p>

            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {activeCategoryName}
            </h3>
          </div>

          <span className="text-sm text-zinc-500">
            {products.length} products
          </span>
        </div>

        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
              >
                <div className="h-60 animate-pulse bg-zinc-100" />

                <div className="space-y-3 p-5">
                  <div className="h-3 w-20 animate-pulse rounded bg-zinc-100" />
                  <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
                  <div className="h-10 animate-pulse rounded-xl bg-zinc-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center">
            <p className="text-base font-medium">
              No products found
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Try another category or search.
            </p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-200/50"
              >
                <Link href={`/products/${product.slug}`}>
                  <div className="relative overflow-hidden bg-zinc-100">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-60 w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-60 items-center justify-center text-sm text-zinc-400">
                        No image
                      </div>
                    )}

                    <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-700 backdrop-blur">
                      {product.category.name}
                    </div>
                  </div>

                  <div className="p-5">
                    <h4 className="text-sm font-semibold tracking-tight sm:text-base">
                      {product.name}
                    </h4>

                    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-500">
                      {product.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold">
                          ${product.price}
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          {product.stock > 0
                            ? `${product.stock} in stock`
                            : "Out of stock"}
                        </p>
                      </div>

                      <span className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition group-hover:bg-zinc-800">
                        View
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* AI Banner */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="overflow-hidden rounded-3xl bg-zinc-950 px-7 py-10 text-white md:px-10 md:py-11">
          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div className="max-w-lg">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                AI Assistant
              </p>

              <h3 className="text-2xl font-semibold tracking-tight">
                Not sure what you need?
              </h3>

              <p className="mt-2.5 text-sm leading-6 text-zinc-400">
                Tell our AI what you&apos;re looking for and get
                product recommendations based on our real inventory.
              </p>
            </div>

            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("open-nexa-ai")
                );
              }}
              className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              Chat with AI
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-6 py-8 text-sm text-zinc-500 md:flex-row">
          <p>© 2026 Nexa</p>

          <div className="flex gap-6">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>

      {/* Floating AI */}
      <AIChat />
    </main>
  );
}

