
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type SearchFilters = {
  minPrice: number | null;
  maxPrice: number | null;
  stockFilter: "in_stock" | "out_of_stock" | null;
};

type ProductResult = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  stock: number;
  imageUrl: string | null;
  category: string;
  distance?: number;
};

function extractFilters(query: string): SearchFilters {
  const text = query.toLowerCase();

  let minPrice: number | null = null;
  let maxPrice: number | null = null;

  // between $20 and $35
  // from $20 to $35
  // $20 - $35
  const betweenMatch = text.match(
    /(?:between|from)\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*\$?\s*(\d+(?:\.\d+)?)/i
  );

  if (betweenMatch) {
    const first = Number(betweenMatch[1]);
    const second = Number(betweenMatch[2]);

    minPrice = Math.min(first, second);
    maxPrice = Math.max(first, second);
  }

  // under $30
  // below $30
  // less than $30
  // up to $30
  // maximum price of $30
  if (maxPrice === null) {
    const maxMatch = text.match(
      /(?:under|below|less than|up to|max(?:imum)?(?:\s+price)?(?:\s+of)?)\s*\$?\s*(\d+(?:\.\d+)?)/i
    );

    if (maxMatch) {
      maxPrice = Number(maxMatch[1]);
    }
  }

  // over $20
  // above $20
  // more than $20
  // at least $20
  // starting from $20
  if (minPrice === null) {
    const minMatch = text.match(
      /(?:over|above|more than|at least|starting from)\s*\$?\s*(\d+(?:\.\d+)?)/i
    );

    if (minMatch) {
      minPrice = Number(minMatch[1]);
    }
  }

  let stockFilter: SearchFilters["stockFilter"] = null;

  if (
    /\b(in stock|available|currently available|have it in stock)\b/i.test(
      text
    )
  ) {
    stockFilter = "in_stock";
  }

  if (
    /\b(out of stock|unavailable|not available|sold out)\b/i.test(text)
  ) {
    stockFilter = "out_of_stock";
  }

  return {
    minPrice,
    maxPrice,
    stockFilter,
  };
}

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSearchTerms(query: string): string[] {
  const normalized = normalizeSearchText(query);

  const stopWords = new Set([
    "what",
    "whats",
    "what's",
    "is",
    "the",
    "price",
    "of",
    "for",
    "how",
    "much",
    "does",
    "do",
    "you",
    "have",
    "any",
    "a",
    "an",
    "i",
    "need",
    "want",
    "looking",
    "look",
    "something",
    "with",
    "that",
    "can",
    "show",
    "me",
    "find",
    "please",
    "product",
    "products",
    "in",
    "stock",
    "available",
    "currently",
    "under",
    "below",
    "less",
    "than",
    "up",
    "to",
    "over",
    "above",
    "more",
    "at",
    "least",
    "starting",
    "from",
    "between",
    "and",
    "or",
  ]);

  return normalized
    .split(/\s+/)
    .filter((word) => word.length >= 2)
    .filter((word) => !stopWords.has(word));
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is missing",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const messages = body.messages as ChatMessage[];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        {
          error: "Messages are required",
        },
        { status: 400 }
      );
    }

    const lastUserMessage =
      [...messages]
        .reverse()
        .find((message) => message.role === "user")
        ?.content?.trim() || "";

    if (!lastUserMessage) {
      return NextResponse.json(
        {
          error: "User message is required",
        },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    // -----------------------------------------
    // 1. Extract exact filters
    // -----------------------------------------

    const filters = extractFilters(lastUserMessage);

    console.log("Nexa AI filters:", filters);

    // -----------------------------------------
    // 2. Build SQL filters
    // -----------------------------------------

    const conditions: Prisma.Sql[] = [
      Prisma.sql`p."isActive" = true`,
    ];

    if (filters.minPrice !== null) {
      conditions.push(
        Prisma.sql`p.price >= ${filters.minPrice}`
      );
    }

    if (filters.maxPrice !== null) {
      conditions.push(
        Prisma.sql`p.price <= ${filters.maxPrice}`
      );
    }

    if (filters.stockFilter === "in_stock") {
      conditions.push(
        Prisma.sql`p.stock > 0`
      );
    }

    if (filters.stockFilter === "out_of_stock") {
      conditions.push(
        Prisma.sql`p.stock = 0`
      );
    }

    const whereClause = Prisma.join(
      conditions,
      " AND "
    );

    // -----------------------------------------
    // 3. Generate query embedding
    // -----------------------------------------

    const embeddingResponse = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: lastUserMessage,
      config: {
        outputDimensionality: 768,
      },
    });

    const embedding =
      embeddingResponse.embeddings?.[0]?.values;

    if (!embedding || embedding.length !== 768) {
      throw new Error("Failed to generate query embedding");
    }

    const vector = `[${embedding.join(",")}]`;

    // -----------------------------------------
    // 4. Semantic search
    // -----------------------------------------

    let products = await prisma.$queryRaw<ProductResult[]>`
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price::text AS price,
        p.stock,
        p."imageUrl" AS "imageUrl",
        c.name AS category,
        pe.embedding <=> ${vector}::vector AS distance
      FROM product_embeddings pe
      INNER JOIN "Product" p
        ON p.id = pe.product_id
      INNER JOIN "Category" c
        ON c.id = p."categoryId"
      WHERE ${whereClause}
      ORDER BY pe.embedding <=> ${vector}::vector
      LIMIT 5
    `;

    console.log(
      "Nexa AI semantic products:",
      products.map((product) => ({
        name: product.name,
        price: product.price,
        stock: product.stock,
        distance: product.distance,
      }))
    );

    // -----------------------------------------
    // 5. Exact / keyword fallback
    // -----------------------------------------

    // If semantic search returns nothing,
    // search directly by product name, slug,
    // description and category.

    if (products.length === 0) {
      const searchTerms = extractSearchTerms(lastUserMessage);

      console.log(
        "Nexa AI fallback search terms:",
        searchTerms
      );

      if (searchTerms.length > 0) {
        const keywordConditions: Prisma.Sql[] = [];

        for (const term of searchTerms) {
          const pattern = `%${term}%`;

          keywordConditions.push(
            Prisma.sql`(
              LOWER(p.name) LIKE LOWER(${pattern})
              OR LOWER(p.slug) LIKE LOWER(${pattern})
              OR LOWER(COALESCE(p.description, '')) LIKE LOWER(${pattern})
              OR LOWER(c.name) LIKE LOWER(${pattern})
            )`
          );
        }

        const keywordWhere = Prisma.join(
          keywordConditions,
          " OR "
        );

        products = await prisma.$queryRaw<ProductResult[]>`
          SELECT
            p.id,
            p.name,
            p.slug,
            p.description,
            p.price::text AS price,
            p.stock,
            p."imageUrl" AS "imageUrl",
            c.name AS category
          FROM "Product" p
          INNER JOIN "Category" c
            ON c.id = p."categoryId"
          WHERE
            ${whereClause}
            AND (${keywordWhere})
          ORDER BY
            p.name ASC
          LIMIT 5
        `;

        console.log(
          "Nexa AI fallback products:",
          products.map((product) => ({
            name: product.name,
            price: product.price,
            stock: product.stock,
          }))
        );
      }
    }

    // -----------------------------------------
    // 6. Strong exact product-name fallback
    // -----------------------------------------

    // Example:
    // "What is the price of the Leather Wallet?"

    // This specifically handles an exact product name
    // even if semantic search produces a poor similarity score.

    if (products.length === 0) {
      const normalizedQuery =
        normalizeSearchText(lastUserMessage);

      const exactProducts =
        await prisma.$queryRaw<ProductResult[]>`
          SELECT
            p.id,
            p.name,
            p.slug,
            p.description,
            p.price::text AS price,
            p.stock,
            p."imageUrl" AS "imageUrl",
            c.name AS category
          FROM "Product" p
          INNER JOIN "Category" c
            ON c.id = p."categoryId"
          WHERE
            ${whereClause}
            AND (
              LOWER(${normalizedQuery}) LIKE
                '%' || LOWER(p.name) || '%'
              OR LOWER(p.name) LIKE
                '%' || LOWER(${normalizedQuery}) || '%'
              OR LOWER(${normalizedQuery}) LIKE
                '%' || LOWER(REPLACE(p.name, ' ', '-')) || '%'
            )
          LIMIT 5
        `;

      if (exactProducts.length > 0) {
        products = exactProducts;
      }
    }

    console.log(
      "Nexa AI final products:",
      products.map((product) => ({
        name: product.name,
        price: product.price,
        stock: product.stock,
      }))
    );

    // -----------------------------------------
    // 7. Prepare product context
    // -----------------------------------------

    const productContext =
      products.length > 0
        ? products
            .map(
              (product) => `
Product: ${product.name}
Category: ${product.category}
Price: $${product.price}
Stock: ${product.stock}
Description: ${
                product.description || "No description available"
              }
`
            )
            .join("\n---\n")
        : "No relevant products were found.";

    // -----------------------------------------
    // 8. Send conversation + products to Gemini
    // -----------------------------------------

    const contents = messages.map((message) => ({
      role:
        message.role === "assistant"
          ? "model"
          : "user",
      parts: [
        {
          text: message.content,
        },
      ],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction: `
You are Nexa AI, the official shopping assistant for the Nexa ecommerce store.

Your job is to help customers quickly find the right products.

LANGUAGE:
- Respond ONLY in English.

STYLE:
- Be concise, clean, natural, and friendly.
- Sound like a professional ecommerce shopping assistant.
- Do not write long paragraphs.
- Do not over-explain.
- Do not repeat the customer's question.
- Give useful information immediately.
- Use simple sentences.

PRODUCT INFORMATION:
- The product data below is your ONLY source of truth.
- Never invent products, prices, stock, discounts, features, or specifications.
- Never change or estimate a product's price.
- Never claim something is in stock if the stock is 0.
- Never mention database information, embeddings, vectors, pgvector, SQL, APIs, or internal systems.
- Never mention product IDs.

FILTERS:
- Price and stock filters have already been applied by the system.
- Never recommend a product that violates the customer's requirements.
- If no products match the filters, clearly say that no suitable product was found.

PRODUCT RECOMMENDATIONS:
- Recommend only the most relevant products.
- Usually mention 1 to 3 products maximum.
- Keep each recommendation short.
- Do not list all available products.

For multiple products, use:

Product Name — $Price

Short reason why it matches.

PRICE QUESTIONS:
- Answer directly using the exact price.

STOCK QUESTIONS:
- If stock is greater than 0, say it is in stock.
- If stock is 0, say it is currently out of stock.
- Do not expose exact stock quantity unless specifically asked.

NO MATCH:
If no products match the customer's requirements, say:

"I couldn't find a suitable product matching those requirements."

CONVERSATION:
- Use previous messages to understand the customer's intent.
- Keep follow-up answers connected to the conversation.
- Do not restart explanations unnecessarily.

FORMATTING:
- Prefer short paragraphs.
- Use bullets only when recommending multiple products.
- Do not use markdown tables.
- Do not use excessive emojis.
- Keep answers short and clean.

RELEVANT NEXA PRODUCTS:

${productContext}
        `,
        temperature: 0.2,
        maxOutputTokens: 220,
      },
    });

    const content = response.text?.trim();

    if (!content) {
      throw new Error(
        "Gemini returned an empty response"
      );
    }

    // -----------------------------------------
    // 9. Return response + products
    // -----------------------------------------

    return NextResponse.json({
      message: content,
      products: products.slice(0, 3).map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl,
        category: product.category,
      })),
    });
  } catch (error) {
    console.error("Nexa AI error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong with Nexa AI",
      },
      { status: 500 }
    );
  }
}
