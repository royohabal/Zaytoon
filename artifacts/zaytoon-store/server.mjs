import { createServer } from "node:http";
import next from "next";
import storeApi, { logger } from "@workspace/store-api";

const rawPort = process.env.PORT;
const port = Number(rawPort);

if (!rawPort || !Number.isInteger(port) || port <= 0) {
  throw new Error("A valid PORT environment variable is required.");
}

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev, dir: process.cwd() });
await nextApp.prepare();
const handleNext = nextApp.getRequestHandler();

const server = createServer((req, res) => {
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  const handle = () => {
    void handleNext(req, res).catch((err) => {
      logger.error({ err }, "Next.js request failed");
      if (!res.headersSent) res.statusCode = 500;
      res.end("Internal Server Error");
    });
  };

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    storeApi(req, res, (err) => {
      if (err) {
        logger.error({ err }, "Store API request failed");
        if (!res.headersSent) res.statusCode = 500;
        res.end("Internal Server Error");
        return;
      }
      handle();
    });
    return;
  }

  handle();
});

server.on("error", (err) => {
  logger.error({ err }, "Next.js server failed");
  process.exit(1);
});

server.listen(port, "0.0.0.0", () => {
  logger.info({ port, dev }, "Next.js storefront and store API ready");
});
