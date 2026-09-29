
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

function extractFilters(query: string): SearchFilters {
  const text = query.toLowerCase();

  let minPrice: number | null = null;
  let maxPrice: number | null = null;

  const betweenMatch = text.match(
    /(?:between|from)\s*\$?(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*\$?(\d+(?:\.\d+)?)/
  );

  if (betweenMatch) {
    const first = Number(betweenMatch[1]);
    const second = Number(betweenMatch[2]);

    minPrice = Math.min(first, second);
    maxPrice = Math.max(first, second);
  }

  if (maxPrice === null) {
    const maxMatch = text.match(
      /(?:under|below|less than|up to|max(?:imum)?(?: price)?(?: of)?)\s*\$?(\d+(?:\.\d+)?)/
    );

    if (maxMatch) {
      maxPrice = Number(maxMatch[1]);
    }
  }

  if (minPrice === null) {
    const minMatch = text.match(
      /(?:over|above|more than|at least|starting from)\s*\$?(\d+(?:\.\d+)?)/
    );

    if (minMatch) {
      minPrice = Number(minMatch[1]);
    }
  }

  let stockFilter: SearchFilters["stockFilter"] = null;

  if (
    /\b(in stock|available|currently available|have it in stock)\b/.test(
      text
    )
  ) {
    stockFilter = "in_stock";
  }

  if (
    /\b(out of stock|unavailable|not available|sold out)\b/.test(text)
  ) {
    stockFilter = "out_of_stock";
  }

  return {
    minPrice,
    maxPrice,
    stockFilter,
  };
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
    // 2. Generate query embedding
    // -----------------------------------------

    const embeddingResponse = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: lastUserMessage,
      config: {
        outputDimensionality: 768,
      },
    });

    const embedding = embeddingResponse.embeddings?.[0]?.values;

    if (!embedding || embedding.length !== 768) {
      throw new Error("Failed to generate query embedding");
    }

    const vector = `[${embedding.join(",")}]`;

    // -----------------------------------------
    // 3. Build SQL filters
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
    // 4. Semantic search + exact filters
    // -----------------------------------------

    const products = await prisma.$queryRaw<
      {
        id: number;
        name: string;
        slug: string;
        description: string | null;
        price: string;
        stock: number;
        imageUrl: string | null;
        category: string;
        distance: number;
      }[]
    >`
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
      "Nexa AI products:",
      products.map((product) => ({
        name: product.name,
        price: product.price,
        stock: product.stock,
        distance: product.distance,
      }))
    );

    // -----------------------------------------
    // 5. Prepare product context for Gemini
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
    // 6. Send conversation + products to Gemini
    // -----------------------------------------

    const contents = messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
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
- Give the useful information immediately.
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
      throw new Error("Gemini returned an empty response");
    }

    // -----------------------------------------
    // 7. Return AI response + products
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

