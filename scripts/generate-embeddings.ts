
import { GoogleGenAI } from "@google/genai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    include: {
      category: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log(`Found ${products.length} active products.`);

  for (const product of products) {
    const content = `
Product: ${product.name}
Category: ${product.category.name}
Price: ${product.price.toString()}
Stock: ${product.stock}
Description: ${product.description || ""}
`;

    console.log(`Generating embedding: ${product.name}`);

    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: content,
      config: {
        outputDimensionality: 768,
      },
    });

    const embedding = response.embeddings?.[0]?.values;

    if (!embedding || embedding.length !== 768) {
      throw new Error(
        `Invalid embedding for ${product.name}. Expected 768 dimensions.`
      );
    }

    const vector = `[${embedding.join(",")}]`;

    await prisma.$executeRaw`
      INSERT INTO product_embeddings (
        product_id,
        content,
        embedding
      )
      VALUES (
        ${product.id},
        ${content},
        ${vector}::vector
      )
      ON CONFLICT (product_id)
      DO UPDATE SET
        content = EXCLUDED.content,
        embedding = EXCLUDED.embedding
    `;

    console.log(`✓ Saved: ${product.name}`);
  }

  console.log("All product embeddings generated successfully.");
}

main()
  .catch((error) => {
    console.error("Embedding generation failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

