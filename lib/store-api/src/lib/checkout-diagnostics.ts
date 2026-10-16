// Log selected diagnostic fields only, never the raw error, request, cart, or session.
function sanitizeMessage(message: string): string {
  return message
    .replace(/\b(?:sk|pk|rk)_(?:test|live)_[\w-]+|\bwhsec_[\w-]+/gi, "[REDACTED_KEY]")
    .replace(/\b(?:cs_(?:test|live)|pi|pm|cus|ch|seti|user)_[\w-]+/gi, "[REDACTED_ID]")
    .replace(/\bBearer\s+\S+|\beyJ[\w-]+\.[\w-]+\.[\w-]+/gi, "[REDACTED_TOKEN]")
    .replace(/(?:https?|mongodb(?:\+srv)?):\/\/[^\s"'<>]+/gi, "[REDACTED_URL]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
    .replace(/(["'`])[^"'`\r\n]*\1/g, "[REDACTED_VALUE]")
    .replace(/\+?\b\d[\d ().-]{7,}\d\b/g, "[REDACTED_NUMBER]")
    .replace(/\b[a-f0-9]{24}\b/gi, "[REDACTED_ID]")
    .replace(/[\r\n\t]/g, " ")
    .slice(0, 1000);
}

function diagnosticCode(value: unknown): string | undefined {
  return typeof value === "string" && /^[A-Za-z0-9_.:-]{1,100}$/.test(value)
    ? value
    : undefined;
}

export function checkoutErrorDiagnostics(error: unknown, operation: string) {
  const details =
    error instanceof Error
      ? (error as Error & { type?: unknown; code?: unknown })
      : null;
  const stripeErrorType = diagnosticCode(details?.type);
  const stripeErrorCode = stripeErrorType?.startsWith("Stripe")
    ? diagnosticCode(details?.code)
    : undefined;

  return {
    operation,
    errorName: diagnosticCode(details?.name) ?? "UnknownError",
    errorType: diagnosticCode(details?.constructor.name) ?? typeof error,
    errorMessage: sanitizeMessage(
      details?.message ??
        (typeof error === "string" ? error : "A non-Error value was thrown."),
    ),
    ...(stripeErrorType ? { stripeErrorType } : {}),
    ...(stripeErrorCode ? { stripeErrorCode } : {}),
  };
}
