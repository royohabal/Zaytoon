import type { NextApiRequest, NextApiResponse } from "next";
import storeApi, { logger } from "@workspace/store-api";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(
  request: NextApiRequest,
  response: NextApiResponse,
): void {
  const expressRequest = request as unknown as Parameters<typeof storeApi>[0];
  const expressResponse = response as unknown as Parameters<typeof storeApi>[1];

  storeApi(expressRequest, expressResponse, (error) => {
    if (!error) return;
    logger.error({ err: error }, "Vercel API request failed");
    if (!response.headersSent) {
      response.status(500).json({ error: "Internal server error." });
    } else {
      response.end();
    }
  });
}
