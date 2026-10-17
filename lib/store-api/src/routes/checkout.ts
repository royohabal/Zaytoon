import { getAuth } from "@clerk/express";
import {
  ConfirmCheckoutSessionBody,
  ConfirmCheckoutSessionResponse,
  CreateCheckoutSessionBody,
  CreateCheckoutSessionResponse,
  type CurrencyCode,
} from "@workspace/api-zod";
import { ObjectId, type ClientSession } from "mongodb";
import { Router, type IRouter, type Request, type Response } from "express";
import type Stripe from "stripe";
import {
  getCheckoutSessionCollection,
  getMongoClient,
  getOrderCollection,
  getProductCollection,
  MongoConfigurationError,
  type CheckoutSessionRecord,
  type OrderRecord,
  type StoredOrder,
} from "../lib/mongodb";
import {
  getTestStripeClient,
  isSupportedStripeTestCurrency,
  isUnsupportedStripeCurrencyError,
  StripeConfigurationError,
} from "../lib/stripe";
import { checkoutErrorDiagnostics } from "../lib/checkout-diagnostics";
import { checkoutRequestOrigin, checkoutReturnUrls } from "../lib/checkout-url";

const router: IRouter = Router();

function currentUserId(req: Request, res: Response): string | null {
  const userId = getAuth(req).userId;
  if (userId) return userId;
  res.status(401).json({ error: "Please sign in before checking out." });
  return null;
}

function databaseError(req: Request, res: Response, error: unknown): void {
  const configured = process.env.MONGODB_URI;
  req.log.warn(
    { kind: error instanceof MongoConfigurationError ? "configuration" : "connection" },
    "MongoDB checkout operation unavailable",
  );
  res.status(503).json({
    error: configured
      ? "MongoDB Atlas is unavailable. Check the Atlas network access settings and database user."
      : "MongoDB Atlas is not configured. Set MONGODB_URI in the deployment environment.",
  });
}

function currencyScale(currency: CurrencyCode): number {
  return currency === "KWD" ? 1000 : 100;
}

function stripeAmount(amount: number, currency: CurrencyCode): number {
  return Math.round(amount * currencyScale(currency));
}

function siteBaseUrl(req: Request): string {
  return checkoutRequestOrigin({
    forwardedHost: req.headers["x-forwarded-host"],
    host: req.get("host"),
    forwardedProto: req.headers["x-forwarded-proto"],
    origin: req.get("origin"),
    production: process.env.VERCEL_ENV === "production",
  });
}

function absoluteHttpsImage(image: string): string | undefined {
  try {
    const url = new URL(image);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
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

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

function paymentIntentId(
  paymentIntent: string | { id: string } | null,
): string | null {
  return typeof paymentIntent === "string"
    ? paymentIntent
    : paymentIntent?.id ?? null;
}

async function createPaidOrder(
  transaction: ClientSession,
  userId: string,
  draft: CheckoutSessionRecord & { _id: ObjectId },
  sessionId: string,
  intentId: string | null,
): Promise<StoredOrder> {
  const orderCollection = await getOrderCollection();
  const existing = await orderCollection.findOne(
    { stripeCheckoutSessionId: sessionId, userId },
    { session: transaction },
  );
  if (existing) return existing;

  const products = await getProductCollection();
  for (const item of draft.items) {
    const result = await products.updateOne(
      {
        _id: new ObjectId(item.productId),
        sizes: item.size,
        stockQuantity: { $gte: item.quantity },
      },
      { $inc: { stockQuantity: -item.quantity } },
      { session: transaction },
    );
    if (result.modifiedCount !== 1) {
      throw new CheckoutStockError();
    }
  }

  const createdAt = new Date();
  const orderNumber = `ZY-${createdAt
    .toISOString()
    .replace(/\D/g, "")
    .slice(0, 12)}-${new ObjectId().toHexString().slice(-5).toUpperCase()}`;
  const document: OrderRecord = {
    userId,
    orderNumber,
    createdAt,
    items: draft.items,
    total: draft.total,
    baseCurrency: "USD",
    displayCurrency: draft.displayCurrency,
    displayTotal: draft.displayTotal,
    exchangeRate: draft.exchangeRate,
    exchangeRateDate: draft.exchangeRateDate,
    status: "received",
    paymentStatus: "paid",
    stripeCheckoutSessionId: sessionId,
    ...(intentId ? { stripePaymentIntentId: intentId } : {}),
  };
  const inserted = await orderCollection.insertOne(document, {
    session: transaction,
  });
  const order: StoredOrder = { ...document, _id: inserted.insertedId };

  const checkoutSessions = await getCheckoutSessionCollection();
  const updated = await checkoutSessions.updateOne(
    { _id: draft._id, userId, status: "pending" },
    { $set: { status: "paid", orderId: order._id.toHexString() } },
    { session: transaction },
  );
  if (updated.modifiedCount !== 1) {
    throw new Error("Checkout session state changed during confirmation.");
  }
  return order;
}

export class CheckoutConfirmationError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "CheckoutConfirmationError";
  }
}

export class CheckoutStockError extends Error {
  constructor() {
    super("A selected item is no longer available.");
    this.name = "CheckoutStockError";
  }
}

export async function fulfillPaidCheckoutSession(
  session: Stripe.Checkout.Session,
  expectedUserId?: string,
): Promise<StoredOrder> {
  const userId = session.client_reference_id;
  if (
    !userId ||
    (expectedUserId && userId !== expectedUserId) ||
    !session.metadata?.checkoutId ||
    !ObjectId.isValid(session.metadata.checkoutId)
  ) {
    throw new CheckoutConfirmationError(404, "The Checkout Session was not found.");
  }
  if (session.status !== "complete" || session.payment_status !== "paid") {
    throw new CheckoutConfirmationError(
      409,
      "Stripe has not confirmed this payment yet.",
    );
  }

  const checkoutCollection = await getCheckoutSessionCollection();
  const draft = (await checkoutCollection.findOne({
    _id: new ObjectId(session.metadata.checkoutId),
    userId,
    stripeSessionId: session.id,
  })) as (CheckoutSessionRecord & { _id: ObjectId }) | null;
  if (!draft) {
    throw new CheckoutConfirmationError(404, "The Checkout Session was not found.");
  }
  if (
    session.amount_total !== draft.totalMinor ||
    session.currency !== draft.displayCurrency.toLowerCase()
  ) {
    throw new CheckoutConfirmationError(
      400,
      "The payment amount does not match this order.",
    );
  }

  const orderCollection = await getOrderCollection();
  const existingOrder = await orderCollection.findOne({
    stripeCheckoutSessionId: session.id,
    userId,
  });
  if (existingOrder) return existingOrder;
  if (draft.status !== "pending") {
    throw new CheckoutConfirmationError(
      409,
      "This Checkout Session can no longer be confirmed.",
    );
  }

  const client = await getMongoClient();
  const transaction = client.startSession();
  let order: StoredOrder | null = null;
  try {
    await transaction.withTransaction(async () => {
      order = await createPaidOrder(
        transaction,
        userId,
        draft,
        session.id,
        paymentIntentId(session.payment_intent),
      );
    });
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
  } finally {
    await transaction.endSession();
  }

  if (!order) {
    const concurrentlyCreated = await orderCollection.findOne({
      stripeCheckoutSessionId: session.id,
      userId,
    });
    if (!concurrentlyCreated) {
      throw new Error("The paid order could not be saved. Please retry.");
    }
    order = concurrentlyCreated;
  }
  return order;
}

export async function refundUnavailablePaidCheckout(
  session: Stripe.Checkout.Session,
): Promise<string> {
  const userId = session.client_reference_id;
  if (!userId) {
    throw new Error("The paid session is missing its order owner.");
  }
  const intentId = paymentIntentId(session.payment_intent);
  if (!intentId) {
    throw new Error("The paid session has no payment intent for refund.");
  }
  const refund = await getTestStripeClient().refunds.create(
    {
      payment_intent: intentId,
      reason: "requested_by_customer",
      metadata: { checkoutSessionId: session.id },
    },
    { idempotencyKey: `zaytoon-stock-refund-${session.id}` },
  );
  await (await getCheckoutSessionCollection()).updateOne(
    {
      stripeSessionId: session.id,
      userId,
      status: "pending",
    },
    { $set: { status: "refunded", refundId: refund.id } },
  );
  return refund.id;
}

router.post("/checkout/sessions", async (req, res): Promise<void> => {
  const userId = currentUserId(req, res);
  if (!userId) return;

  const parsed = CreateCheckoutSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the items in your bag." });
    return;
  }

  const { displayCurrency } = parsed.data;
  if (!isSupportedStripeTestCurrency(displayCurrency)) {
    res.status(422).json({
      error:
        "Checkout is available in USD only. Select USD and review the total before trying again.",
    });
    return;
  }

  const exchangeRate = 1;
  const exchangeRateDate: Date | null = null;

  const stripe = (() => {
    try {
      return getTestStripeClient();
    } catch (error) {
      if (error instanceof StripeConfigurationError) {
        res.status(503).json({ error: error.message });
        return null;
      }
      throw error;
    }
  })();
  if (!stripe) return;

  let baseUrl: string;
  try {
    baseUrl = siteBaseUrl(req);
  } catch {
    res.status(503).json({
      error: "Checkout could not determine the secure storefront hostname.",
    });
    return;
  }

  let draftId: ObjectId | null = null;
  let checkoutCollection: Awaited<ReturnType<typeof getCheckoutSessionCollection>> | null =
    null;
  let operation = "load-product-catalog";
  try {
    const seenLines = new Set<string>();
    const products = await getProductCollection();
    operation = "validate-cart-and-load-products";
    const snapshotItems: CheckoutSessionRecord["items"] = [];
    const stripeLines: Array<{
      price_data: {
        currency: string;
        unit_amount: number;
        product_data: {
          name: string;
          description?: string;
          images?: string[];
        };
      };
      quantity: number;
    }> = [];

    for (const line of parsed.data.items) {
      const lineKey = `${line.productId}:${line.size}`;
      if (seenLines.has(lineKey) || !ObjectId.isValid(line.productId)) {
        res.status(400).json({ error: "One of the selected items is invalid." });
        return;
      }
      seenLines.add(lineKey);

      const product = await products.findOne({ _id: new ObjectId(line.productId) });
      if (
        !product ||
        !product.sizes.includes(line.size) ||
        product.stockQuantity < line.quantity
      ) {
        res.status(400).json({
          error: "A selected size is no longer available or has insufficient stock.",
        });
        return;
      }
      if (!Number.isFinite(product.price) || product.price <= 0) {
        res.status(400).json({ error: "A selected product has an invalid price." });
        return;
      }

      const item = {
        productId: product._id.toHexString(),
        name: product.name,
        image: product.images[0] ?? "",
        size: line.size,
        quantity: line.quantity,
        unitPrice: product.price,
      };
      snapshotItems.push(item);
      const images = product.images
        .map(absoluteHttpsImage)
        .filter((image): image is string => Boolean(image))
        .slice(0, 1);
      stripeLines.push({
        price_data: {
          currency: displayCurrency.toLowerCase(),
          unit_amount: stripeAmount(product.price * exchangeRate, displayCurrency),
          product_data: {
            name: `${product.name} — Size ${line.size}`,
            ...(product.description
              ? { description: product.description.slice(0, 500) }
              : {}),
            ...(images.length ? { images } : {}),
          },
        },
        quantity: line.quantity,
      });
    }

    const total = Math.round(
      snapshotItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) *
        100,
    ) / 100;
    const totalMinor = stripeLines.reduce(
      (sum, line) => sum + line.price_data.unit_amount * line.quantity,
      0,
    );
    if (!Number.isSafeInteger(totalMinor) || totalMinor < 1) {
      res.status(400).json({ error: "The order total is not valid for checkout." });
      return;
    }
    const displayTotal = totalMinor / currencyScale(displayCurrency);

    operation = "initialize-checkout-session-storage";
    checkoutCollection = await getCheckoutSessionCollection();
    draftId = new ObjectId();
    const draft: CheckoutSessionRecord = {
      _id: draftId,
      userId,
      status: "creating",
      createdAt: new Date(),
      items: snapshotItems,
      total,
      totalMinor,
      displayCurrency,
      displayTotal,
      exchangeRate,
      exchangeRateDate,
    };
    operation = "save-checkout-draft";
    await checkoutCollection.insertOne(draft);

    operation = "create-stripe-checkout-session";
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: userId,
        line_items: stripeLines,
        ...checkoutReturnUrls(baseUrl),
        metadata: { checkoutId: draftId.toHexString() },
      },
      { idempotencyKey: `zaytoon-checkout-${draftId.toHexString()}` },
    );
    operation = "validate-stripe-checkout-session";
    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }

    operation = "save-stripe-session-reference";
    await checkoutCollection.updateOne(
      { _id: draftId, status: "creating" },
      { $set: { stripeSessionId: session.id, status: "pending" } },
    );
    operation = "validate-checkout-response";
    res
      .status(201)
      .json(CreateCheckoutSessionResponse.parse({ url: session.url }));
  } catch (error) {
    req.log.error(
      checkoutErrorDiagnostics(error, operation),
      "Stripe Checkout session could not be created",
    );
    if (draftId && checkoutCollection) {
      await checkoutCollection
        .updateOne(
          { _id: draftId, status: "creating" },
          { $set: { status: "failed" } },
        )
        .catch(() => undefined);
    }
    if (error instanceof MongoConfigurationError) {
      databaseError(req, res, error);
      return;
    }
    if (isUnsupportedStripeCurrencyError(error)) {
      res.status(422).json({
        error: "Stripe cannot accept USD payments for this store right now. Please try again later.",
      });
      return;
    }
    res.status(503).json({
      error: "Stripe Checkout is temporarily unavailable. Please try again.",
    });
  }
});

router.post("/checkout/confirm", async (req, res): Promise<void> => {
  const userId = currentUserId(req, res);
  if (!userId) return;

  const parsed = ConfirmCheckoutSessionBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.sessionId.startsWith("cs_test_")) {
    res.status(400).json({ error: "The Checkout Session is invalid." });
    return;
  }

  let stripe;
  try {
    stripe = getTestStripeClient();
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      res.status(503).json({ error: error.message });
      return;
    }
    throw error;
  }

  let session: Stripe.Checkout.Session | null = null;
  let operation = "retrieve-stripe-checkout-session";
  try {
    session = await stripe.checkout.sessions.retrieve(
      parsed.data.sessionId,
      { expand: ["payment_intent"] },
    );
    operation = "verify-paid-session-and-save-order";
    const order = await fulfillPaidCheckoutSession(session, userId);
    res.json(ConfirmCheckoutSessionResponse.parse(orderResponse(order)));
  } catch (error) {
    if (error instanceof CheckoutConfirmationError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    if (error instanceof CheckoutStockError) {
      try {
        if (!session) throw new Error("The Checkout Session could not be retrieved.");
        await refundUnavailablePaidCheckout(session);
        res.status(409).json({
          error: "An item became unavailable during checkout. A refund has been started.",
        });
      } catch {
        req.log.error(
          { operation: "refund-unavailable-checkout" },
          "A paid checkout could not be fulfilled or automatically refunded",
        );
        res.status(503).json({
          error: "Payment was received but the order needs attention. Please contact the store.",
        });
      }
      return;
    }
    if (error instanceof MongoConfigurationError) {
      databaseError(req, res, error);
      return;
    }
    req.log.error(
      checkoutErrorDiagnostics(error, operation),
      "Stripe Checkout confirmation failed",
    );
    res.status(503).json({
      error: "The payment could not be confirmed right now. Please try again.",
    });
  }
});

export default router;
