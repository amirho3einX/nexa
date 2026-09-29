import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  // Fruits
  {
    name: "Fresh Red Apples",
    slug: "fresh-red-apples",
    description: "Crisp and sweet red apples, perfect for everyday snacking.",
    price: 4.99,
    stock: 42,
    imageUrl:
      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6",
    categorySlug: "fruits",
  },
  {
    name: "Organic Bananas",
    slug: "organic-bananas",
    description: "Fresh organic bananas with a naturally sweet flavor.",
    price: 3.49,
    stock: 35,
    imageUrl:
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e",
    categorySlug: "fruits",
  },
  {
    name: "Fresh Oranges",
    slug: "fresh-oranges",
    description: "Juicy and refreshing oranges packed with natural flavor.",
    price: 5.49,
    stock: 28,
    imageUrl:
      "https://images.unsplash.com/photo-1547514701-42782101795e",
    categorySlug: "fruits",
  },
  {
    name: "Fresh Strawberries",
    slug: "fresh-strawberries",
    description: "Sweet and fresh strawberries selected for great flavor.",
    price: 6.99,
    stock: 24,
    imageUrl:
      "https://images.unsplash.com/photo-1464965911861-746a04b4bca6",
    categorySlug: "fruits",
  },

  // Electronics
  {
    name: "Wireless Headphones",
    slug: "wireless-headphones",
    description:
      "Comfortable wireless headphones with immersive sound and long battery life.",
    price: 89.99,
    stock: 18,
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    categorySlug: "electronics",
  },
  {
    name: "Mechanical Keyboard",
    slug: "mechanical-keyboard",
    description:
      "Premium mechanical keyboard designed for work, gaming, and productivity.",
    price: 119.99,
    stock: 15,
    imageUrl:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
    categorySlug: "electronics",
  },
  {
    name: "Smart Watch",
    slug: "smart-watch",
    description:
      "Modern smartwatch with fitness tracking and smart notifications.",
    price: 149.99,
    stock: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    categorySlug: "electronics",
  },
  {
    name: "USB-C Hub",
    slug: "usb-c-hub",
    description:
      "Compact USB-C hub with multiple ports for modern laptops and devices.",
    price: 39.99,
    stock: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1625842268584-8f3296236761",
    categorySlug: "electronics",
  },

  // Food
  {
    name: "Premium Ground Coffee",
    slug: "premium-ground-coffee",
    description:
      "Rich and aromatic ground coffee made from carefully selected beans.",
    price: 14.99,
    stock: 32,
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
    categorySlug: "food",
  },
  {
    name: "Dark Chocolate",
    slug: "dark-chocolate",
    description:
      "Smooth dark chocolate with a rich cocoa flavor.",
    price: 5.99,
    stock: 45,
    imageUrl:
      "https://images.unsplash.com/photo-1575377427642-087cf684f04d",
    categorySlug: "food",
  },
  {
    name: "Italian Pasta",
    slug: "italian-pasta",
    description:
      "Traditional Italian pasta made from high-quality durum wheat.",
    price: 3.99,
    stock: 50,
    imageUrl:
      "https://images.unsplash.com/photo-1551462147-ff29053bfc14",
    categorySlug: "food",
  },
  {
    name: "Crunchy Granola",
    slug: "crunchy-granola",
    description:
      "Crunchy granola made with oats, nuts, and natural ingredients.",
    price: 7.49,
    stock: 26,
    imageUrl:
      "https://images.unsplash.com/photo-1517093602195-b40af9688b46",
    categorySlug: "food",
  },

  // Home
  {
    name: "Minimal Desk Lamp",
    slug: "minimal-desk-lamp",
    description:
      "Modern minimalist desk lamp designed for comfortable workspace lighting.",
    price: 34.99,
    stock: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c",
    categorySlug: "home",
  },
  {
    name: "Soft Decorative Pillow",
    slug: "soft-decorative-pillow",
    description:
      "Soft decorative pillow that adds comfort and style to your home.",
    price: 19.99,
    stock: 38,
    imageUrl:
      "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2",
    categorySlug: "home",
  },
  {
    name: "Storage Organizer Box",
    slug: "storage-organizer-box",
    description:
      "Practical storage box for organizing everyday household items.",
    price: 12.99,
    stock: 41,
    imageUrl:
      "https://images.unsplash.com/photo-1600494603989-9650cf6ddd3d",
    categorySlug: "home",
  },
  {
    name: "Modern Air Purifier",
    slug: "modern-air-purifier",
    description:
      "Compact air purifier designed for cleaner and fresher indoor air.",
    price: 129.99,
    stock: 9,
    imageUrl:
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd",
    categorySlug: "home",
  },

  // Accessories
  {
    name: "Everyday Backpack",
    slug: "everyday-backpack",
    description:
      "Durable everyday backpack with a clean modern design.",
    price: 49.99,
    stock: 22,
    imageUrl:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
    categorySlug: "accessories",
  },
  {
    name: "Leather Wallet",
    slug: "leather-wallet",
    description:
      "Minimal leather wallet designed for everyday use.",
    price: 29.99,
    stock: 34,
    imageUrl:
      "https://images.unsplash.com/photo-1627123424574-724758594e93",
    categorySlug: "accessories",
  },
  {
    name: "Classic Sunglasses",
    slug: "classic-sunglasses",
    description:
      "Classic sunglasses with a timeless everyday design.",
    price: 39.99,
    stock: 27,
    imageUrl:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083",
    categorySlug: "accessories",
  },
  {
    name: "Minimal Wrist Watch",
    slug: "minimal-wrist-watch",
    description:
      "Elegant minimalist wrist watch suitable for everyday outfits.",
    price: 79.99,
    stock: 16,
    imageUrl:
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d",
    categorySlug: "accessories",
  },
];

async function main() {
  for (const product of products) {
    const category = await prisma.category.findUnique({
      where: {
        slug: product.categorySlug,
      },
    });

    if (!category) {
      console.log(`Category not found: ${product.categorySlug}`);
      continue;
    }

    await prisma.product.upsert({
      where: {
        slug: product.slug,
      },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl,
        categoryId: category.id,
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl,
        categoryId: category.id,
      },
    });
  }

  console.log("✅ Products seeded successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });