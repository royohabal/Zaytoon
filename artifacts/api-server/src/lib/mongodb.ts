import {
  MongoClient,
  ObjectId,
  type Collection,
  type Db,
  type Document,
  type WithId,
} from "mongodb";
import type { CurrencyCode } from "@workspace/api-zod";

export type ProductRecord = Document & {
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  sizes: string[];
  stockQuantity: number;
  featured: boolean;
  createdAt: Date;
};

export type OrderLineRecord = {
  productId: string;
  name: string;
  image: string;
  size: string;
  quantity: number;
  unitPrice: number;
};

export type OrderRecord = Document & {
  userId: string;
  orderNumber: string;
  createdAt: Date;
  items: OrderLineRecord[];
  total: number;
  baseCurrency?: CurrencyCode;
  displayCurrency?: CurrencyCode;
  displayTotal?: number;
  exchangeRate?: number;
  exchangeRateDate?: Date | null;
  status: "received" | "preparing" | "shipped" | "delivered";
};

export class MongoConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MongoConfigurationError";
  }
}

export type StoredProduct = WithId<ProductRecord>;
export type StoredOrder = WithId<OrderRecord>;

const starterProducts = [
  {
    name: "Oversized Kimono Coat",
    description:
      "A fluid, unlined silhouette in natural linen, finished with quiet geometric tatreez at the cuff.",
    price: 680,
    category: "Heritage",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBbX26v3W8a8pT0G-GB6wl1XXnbmPJw5D2BPh0X_j--fdmtlgBFvNmMBXpjELgu9gXNfcc558QMUkAAdQC71cvUhNOma2mOucRT-9_dYQMOaS-SzpbRHZ5zwyrlPsrVr4mCRci4sJQ2QTEkZdvN2Vn1Ud73s22hKQfqeP_0iTilh4rk0pjnX7CkAEcsBKKplwbLytxRiomu3ShFICPkYUPbxhuVPQtZyqUDhFzjzZ3mSgdO2qLPoEJu",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    stockQuantity: 24,
    featured: true,
  },
  {
    name: "Bethlehem Star Blazer",
    description:
      "A sharply tailored wool-blend blazer with hand-counted star embroidery inspired by Bethlehem needlework.",
    price: 795,
    category: "Tailoring",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD-YF6caaRabvifiiqG2o6ftPIbw2AqkM-7DyIY0glL8wLTaii4OQV-e2V1uxCIhnIxcUhabqTfKWykcg22P3EWJaxh58BMuyqS3VxIMumFfHLj0Bii_XCiiwTCvUKk0VsJms05hIMMjWmwNsSkA5BUTyriy4GrwZKeLPkgChKDjZj6dJvN6PT-0lCNfnGUQqsTab8RKsh4W2xKI70uhT6cHzrTJHvVDTGA3FqVBkCiXFgK6f7A8QT9",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    stockQuantity: 18,
    featured: true,
  },
  {
    name: "Al-Quds Evening Drape Dress",
    description:
      "A long evening silhouette in soft silk with an easy drape and a considered, sculptural neckline.",
    price: 620,
    category: "Silk",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCxZzbnXIk1A-SalZ94sJTMDEd9lOsNxW8wCERbX9H6TV1CzZ-drb0-7ltuRQSStv4-fRKLZILcScd0QvADEcx6KPLEmn0Oo02kH_YV1qrCMVjfXJ_Ff7LTl8LnYe541KhqH7HnFddrH4g68Ft1Y2s1r8HHm6O2O3EU3Uq25ErrzvHjSEyj69MWF0srVFRfOigJmPz8Xi-XMB60jarfp7Jm5sOR2qiLGTMLmXxHIsbwBGJ5FZy-0ZQW",
    ],
    sizes: ["XS", "S", "M", "L"],
    stockQuantity: 12,
    featured: true,
  },
  {
    name: "Tailored Minimalist Vest",
    description:
      "A clean, versatile layer cut in a breathable natural blend and made to sit neatly over a shirt or dress.",
    price: 395,
    category: "Tailoring",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7zVOReD8iyBSNm0LtFcICNpyC20B2ADdU_joBWctjhCA8EBBYzFWTCHzX-DFvTb5te0E1tB2GbrTfiAC0PlTUr0CVpdbfjIe9-PWXQrJSWDtDQFmIhENh4DbMS0TsA3nWnZ_Druv6-VoKlJw4JrDZZBTQyJMGxGWJkgvI_JjZRPghEUparzQziz-Pmus49geTkzaVjMt3hJ3LXFmyznCZXj3y0gZ2Eu1xX2VHxkL7Zmabxjfgw3K8",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    stockQuantity: 20,
    featured: false,
  },
  {
    name: "Raw Silk Mandarin Blouse",
    description:
      "A softly structured raw-silk blouse with a refined mandarin collar and natural, tactile finish.",
    price: 380,
    category: "Silk",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDHeP2aZ1kELDVoXTzqdo5264ZG2YnRuVBKrk8McEVpTaKqklmJ9CYvv5l8OB6NLxvRTgFwZcIoRhYRNdZam6mACK9a07qk-dzQ_onAftH8os7jwY9X2iU-8pOnGW-YX4GpCjJpWsdeT707yD2m7LkJq_i6vdDXpbz8CqlIwA7fbmvqqA1Hki3BpmAJ1Zy88Fkmq1MicozkExwsIruTjk4VXYJ2UOcM9Zlsxz2UOBXSzqeu8gFUTDNQ",
    ],
    sizes: ["XS", "S", "M", "L"],
    stockQuantity: 16,
    featured: false,
  },
  {
    name: "Pleated Wide-Leg Trouser",
    description:
      "A generous wide-leg trouser with precise pleating, deep pockets, and an easy high-rise waist.",
    price: 420,
    category: "Tailoring",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBLPxvIKB2uOrIPJOUTOOUb3nqgYO7V9rWMfWZJmv4jjUR2MUD8ow9N1SvzWOnQY_iKPVwegrN8qKr-blywJh7dmLmqdhDeHONdYLgtw1qank6GCetpJ8YZ8y2F1T31NOPguL9chYLKGHfTECINyqvJBaEHa6AIS6-esW3mJ_fDATyDib1Jt1uRuxONGnmDRcdNnFVyrM5yyuPa8kMTShzSCp7eE6HSV1KIE4sswuQeYdv_rhWw_deU",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    stockQuantity: 22,
    featured: false,
  },
];

let mongoClient: MongoClient | null = null;
let databasePromise: Promise<Db> | null = null;

async function ensureCollection(database: Db, name: string): Promise<void> {
  const exists = await database.listCollections({ name }).hasNext();
  if (exists) return;

  try {
    await database.createCollection(name);
  } catch (error) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("codeName" in error) ||
      error.codeName !== "NamespaceExists"
    ) {
      throw error;
    }
  }
}

async function initializeDatabase(database: Db): Promise<void> {
  await Promise.all([
    ensureCollection(database, "products"),
    ensureCollection(database, "orders"),
  ]);

  const products = database.collection<ProductRecord>("products");
  await Promise.all([
    products.createIndex({ category: 1, featured: 1 }),
    products.createIndex({ name: "text", description: "text" }),
    database
      .collection<OrderRecord>("orders")
      .createIndex({ userId: 1, createdAt: -1 }),
    database
      .collection<OrderRecord>("orders")
      .createIndex({ orderNumber: 1 }, { unique: true }),
  ]);

  if ((await products.countDocuments()) === 0) {
    const createdAt = new Date();
    await products.insertMany(
      starterProducts.map((product) => ({ ...product, createdAt })),
    );
  }
}

export async function getDatabase(): Promise<Db> {
  if (!process.env.MONGODB_URI) {
    throw new MongoConfigurationError(
      "MongoDB Atlas is not configured. Add MONGODB_URI in Replit Secrets.",
    );
  }

  if (!databasePromise) {
    databasePromise = (async () => {
      mongoClient = new MongoClient(process.env.MONGODB_URI as string, {
        serverSelectionTimeoutMS: 8000,
      });
      await mongoClient.connect();
      const database = mongoClient.db(
        process.env.MONGODB_DB_NAME || "zaytoon_atelier",
      );
      await initializeDatabase(database);
      return database;
    })().catch((error: unknown) => {
      mongoClient = null;
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}

export async function getMongoClient(): Promise<MongoClient> {
  await getDatabase();
  if (!mongoClient) {
    throw new MongoConfigurationError("MongoDB Atlas is not available.");
  }
  return mongoClient;
}

export async function getProductCollection(): Promise<
  Collection<ProductRecord>
> {
  return (await getDatabase()).collection<ProductRecord>("products");
}

export async function getOrderCollection(): Promise<Collection<OrderRecord>> {
  return (await getDatabase()).collection<OrderRecord>("orders");
}
