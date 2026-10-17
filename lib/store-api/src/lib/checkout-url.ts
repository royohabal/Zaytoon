import type Stripe from "stripe";

type CheckoutRequestUrlInput = {
  forwardedHost?: string | string[];
  host?: string;
  origin?: string;
  forwardedProto?: string | string[];
  production: boolean;
};

function firstHeaderValue(value?: string | string[]): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.split(",")[0]?.trim() || undefined;
}

function originForHost(host: string, protocol: string): string {
  if (
    host.length > 255 ||
    /[\s/@\\?#]/.test(host) ||
    protocol !== "https:" && protocol !== "http:"
  ) {
    throw new Error("The Checkout request host is invalid.");
  }

  const url = new URL(`${protocol}//${host}`);
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("The Checkout request host is invalid.");
  }
  return url.origin;
}

/**
 * Keep Stripe's return URL on the same host that served the authenticated
 * Checkout request. Clerk cookies are host-scoped, so redirecting to a
 * different Vercel alias can make a valid shopper look signed out.
 */
export function checkoutRequestOrigin(
  input: CheckoutRequestUrlInput,
): string {
  const host =
    firstHeaderValue(input.forwardedHost) ??
    input.host?.trim() ??
    undefined;

  if (host) {
    if (input.production) return originForHost(host, "https:");

    const forwardedProtocol = firstHeaderValue(input.forwardedProto);
    if (forwardedProtocol === "https") return originForHost(host, "https:");
    if (forwardedProtocol === "http" && host.startsWith("localhost")) {
      return originForHost(host, "http:");
    }
  }

  if (!input.production && input.origin) {
    try {
      const url = new URL(input.origin);
      if (url.protocol === "https:" || url.hostname === "localhost") {
        return url.origin;
      }
    } catch {
      // A malformed preview Origin is ignored; the request is rejected below.
    }
  }

  throw new Error("A trusted Checkout request hostname is required.");
}

export function checkoutReturnUrls(
  origin: string,
): Pick<Stripe.Checkout.SessionCreateParams, "success_url" | "cancel_url"> {
  return {
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel`,
  };
}
