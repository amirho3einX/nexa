
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const query = body.query?.trim();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    // Convert user query into an embedding
    const embeddingResponse = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: query,
      config: {
        outputDimensionality: 768,
      },
    });

    const embedding = embeddingResponse.embeddings?.[0]?.values;

    if (!embedding || embedding.length !== 768) {
      return NextResponse.json(
        { error: "Failed to generate query embedding" },
        { status: 500 }
      );
    }

    const vector = `[${embedding.join(",")}]`;

    // Find the most semantically similar products
    const products = await prisma.$queryRaw<
      {
        id: number;
        product_id: number;
        content: string;
        distance: number;
      }[]
    >`
      SELECT
        pe.id,
        pe.product_id,
        pe.content,
        pe.embedding <=> ${vector}::vector AS distance
      FROM product_embeddings pe
      ORDER BY pe.embedding <=> ${vector}::vector
      LIMIT 5
    `;

    return NextResponse.json({
      query,
      products,
    });
  } catch (error) {
    console.error("Semantic search error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Semantic search failed",
      },
      { status: 500 }
    );
  }
}
