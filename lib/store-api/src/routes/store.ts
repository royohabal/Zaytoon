import { getAuth } from "@clerk/express";
import {
  CreateOrderBody,
  CreateOrderResponse,
  GetFeaturedProductsResponse,
  GetMyOrdersResponse,
  GetProductParams,
  GetProductResponse,
  GetProductsQueryParams,
  GetProductsResponse,
} from "@workspace/api-zod";
import {
  ObjectId,
  type ClientSession,
  type Filter,
  type Sort,
} from "mongodb";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  getMongoClient,
  getOrderCollection,
  getProductCollection,
  MongoConfigurationError,
  type OrderRecord,
  type ProductRecord,
  type StoredOrder,
  type StoredProduct,
} from "../lib/mongodb";
const router: IRouter = Router();

function productResponse(product: StoredProduct) {
  return {
    id: product._id.toHexString(),
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category,
    images: product.images,
    sizes: product.sizes,
    stockQuantity: product.stockQuantity,
    featured: product.featured,
    createdAt: product.createdAt,
  };
}

function orderResponse(order: StoredOrder) {
  return {
    id: order._id.toHexString(),
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    items: order.items,
    total: order.total,
    baseCurrency: order.baseCurrency ?? "USD",
    displayCurrency: order.displayCurrency ?? "USD",
    displayTotal: order.displayTotal ?? order.total,
    exchangeRate: order.exchangeRate ?? 1,
    exchangeRateDate: order.exchangeRateDate ?? null,
    status: order.status,
  };
}

function databaseError(req: Request, res: Response, error: unknown): void {
  const configured = process.env.MONGODB_URI;
  const kind =
    error instanceof MongoConfigurationError ? "configuration" : "connection";
  req.log.warn({ kind }, "MongoDB request unavailable");
  res.status(503).json({
    error: configured
      ? "MongoDB Atlas is unavailable. Check the Atlas network access settings and database user."
      : "MongoDB Atlas is not configured. Set MONGODB_URI in the deployment environment.",
  });
}

function authenticatedUserId(req: Request, res: Response): string | null {
  const userId = getAuth(req).userId;
  if (userId) return userId;

  res.status(401).json({ error: "Please sign in to access your orders." });
  return null;
}

function sortForProducts(value: string | undefined): Sort {
  switch (value) {
    case "price_asc":
      return { price: 1 };
    case "price_desc":
      return { price: -1 };
    case "name_asc":
      return { name: 1 };
    default:
      return { createdAt: -1 };
  }
}

router.get("/products", async (req, res): Promise<void> => {
  const parsed = GetProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid product filters." });
    return;
  }

  try {
    const collection = await getProductCollection();
    const filter: Filter<ProductRecord> = {};
    const search = parsed.data.search?.trim();

    if (search) {
      filter.$or = [
        { name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
        { description: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
      ];
    }
    if (parsed.data.category && parsed.data.category !== "All") {
      filter.category = parsed.data.category;
    }

    const [documents, categories] = await Promise.all([
      collection.find(filter).sort(sortForProducts(parsed.data.sort)).toArray(),
      collection.distinct("category"),
    ]);

    res.json(
      GetProductsResponse.parse({
        products: documents.map(productResponse),
        categories: categories.sort(),
      }),
    );
  } catch (error) {
    databaseError(req, res, error);
  }
});

router.get("/products/featured", async (req, res): Promise<void> => {
  try {
    const collection = await getProductCollection();
    const products = await collection
      .find({ featured: true })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(GetFeaturedProductsResponse.parse(products.map(productResponse)));
  } catch (error) {
    databaseError(req, res, error);
  }
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success || !ObjectId.isValid(params.data.id)) {
    res.status(404).json({ error: "Product not found." });
    return;
  }

  try {
    const collection = await getProductCollection();
    const product = await collection.findOne({
      _id: new ObjectId(params.data.id),
    });
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    res.json(GetProductResponse.parse(productResponse(product)));
  } catch (error) {
    databaseError(req, res, error);
  }
});

class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

async function createOrderRecord(
  session: ClientSession,
  userId: string,
  lines: Array<{ productId: string; size: string; quantity: number }>,
): Promise<StoredOrder> {
  const products = await getProductCollection();
  const orderItems: OrderRecord["items"] = [];

  for (const line of lines) {
    if (!ObjectId.isValid(line.productId)) {
      throw new OrderValidationError("One of the selected products was not found.");
    }

    const objectId = new ObjectId(line.productId);
    const product = await products.findOne(
      { _id: objectId, sizes: line.size, stockQuantity: { $gte: line.quantity } },
      { session },
    );
    if (!product) {
      throw new OrderValidationError(
        "A selected size is no longer available or has insufficient stock.",
      );
    }

    const result = await products.updateOne(
      { _id: objectId, sizes: line.size, stockQuantity: { $gte: line.quantity } },
      { $inc: { stockQuantity: -line.quantity } },
      { session },
    );
    if (result.modifiedCount !== 1) {
      throw new OrderValidationError(
        "Stock changed while placing your order. Please review your bag and try again.",
      );
    }

    orderItems.push({
      productId: product._id.toHexString(),
      name: product.name,
      image: product.images[0] ?? "",
      size: line.size,
      quantity: line.quantity,
      unitPrice: product.price,
    });
  }

  const total = Math.round(
    orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) *
      100,
  ) / 100;
  const createdAt = new Date();
  const orderNumber = `ZY-${createdAt
    .toISOString()
    .replace(/\D/g, "")
    .slice(0, 12)}-${new ObjectId().toHexString().slice(-5).toUpperCase()}`;
  const orderCollection = await getOrderCollection();
  const document: OrderRecord = {
    userId,
    orderNumber,
    createdAt,
    items: orderItems,
    total,
    baseCurrency: "USD",
    displayCurrency: "USD",
    displayTotal: total,
    exchangeRate: 1,
    exchangeRateDate: null,
    status: "received",
  };
  const inserted = await orderCollection.insertOne(document, { session });
  return { ...document, _id: inserted.insertedId };
}

router.get("/orders", async (req, res): Promise<void> => {
  const userId = authenticatedUserId(req, res);
  if (!userId) return;

  try {
    const orders = await (await getOrderCollection())
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(GetMyOrdersResponse.parse(orders.map(orderResponse)));
  } catch (error) {
    databaseError(req, res, error);
  }
});

router.post("/orders", async (req, res): Promise<void> => {
  const userId = authenticatedUserId(req, res);
  if (!userId) return;

  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the items in your bag." });
    return;
  }

  const displayCurrency = parsed.data.displayCurrency;
  if (displayCurrency !== "USD") {
    res.status(422).json({
      error: "Orders are available in USD only.",
    });
    return;
  }
  try {
    const client = await getMongoClient();
    const session = client.startSession();
    let order: StoredOrder | null = null;

    try {
      await session.withTransaction(async () => {
        order = await createOrderRecord(
          session,
          userId,
          parsed.data.items,
        );
      });
    } finally {
      await session.endSession();
    }

    if (!order) {
      res.status(500).json({ error: "Your order could not be completed." });
      return;
    }
    res.status(201).json(CreateOrderResponse.parse(orderResponse(order)));
  } catch (error) {
    if (error instanceof OrderValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    databaseError(req, res, error);
  }
});

export default router;
