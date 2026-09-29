import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
try {
const { searchParams } = new URL(request.url);


const search = searchParams.get("search") || "";
const category = searchParams.get("category");
const minPrice = searchParams.get("minPrice");
const maxPrice = searchParams.get("maxPrice");
const inStock = searchParams.get("inStock");

const page = Math.max(Number(searchParams.get("page")) || 1, 1);

const limit = Math.min(
  Math.max(Number(searchParams.get("limit")) || 100, 1),
  100
);

const sort = searchParams.get("sort") || "newest";

const where = {
  isActive: true,

  ...(search
    ? {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            description: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : {}),

  ...(category
    ? {
        category: {
          slug: category,
        },
      }
    : {}),

  ...(minPrice || maxPrice
    ? {
        price: {
          ...(minPrice ? { gte: Number(minPrice) } : {}),
          ...(maxPrice ? { lte: Number(maxPrice) } : {}),
        },
      }
    : {}),

  ...(inStock === "true"
    ? {
        stock: {
          gt: 0,
        },
      }
    : {}),
};

let orderBy;

switch (sort) {
  case "price_asc":
    orderBy = { price: "asc" as const };
    break;

  case "price_desc":
    orderBy = { price: "desc" as const };
    break;

  case "name":
    orderBy = { name: "asc" as const };
    break;

  case "oldest":
    orderBy = { createdAt: "asc" as const };
    break;

  case "newest":
  default:
    orderBy = { createdAt: "desc" as const };
    break;
}

const skip = (page - 1) * limit;

const [products, total] = await Promise.all([
  prisma.product.findMany({
    where,
    include: {
      category: true,
    },
    orderBy,
    skip,
    take: limit,
  }),

  prisma.product.count({
    where,
  }),
]);

const totalPages = Math.ceil(total / limit);

return NextResponse.json({
  products,
  pagination: {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  },
});


} catch (error) {
console.error("GET /api/products error:", error);


return NextResponse.json(
  { error: "Failed to fetch products" },
  { status: 500 }
);


}
}

export async function POST(request: Request) {
try {
const body = await request.json();


const product = await prisma.product.create({
  data: {
    name: body.name,
    slug: body.slug,
    description: body.description,
    price: body.price,
    stock: body.stock ?? 0,
    imageUrl: body.imageUrl ?? null,
    categoryId: body.categoryId,
  },
});

return NextResponse.json(product, { status: 201 });


} catch (error) {
console.error("POST /api/products error:", error);


return NextResponse.json(
  { error: "Failed to create product" },
  { status: 500 }
);


}
}
