import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { categoriesRouter } from "./routes/categories.js";
import { placesRouter } from "./routes/places.js";

dotenv.config();

export function createApp() {
  const app = express();

  const allowedExactOrigin = process.env.FRONTEND_ORIGIN;
  const isDev = (process.env.NODE_ENV ?? "development") !== "production";

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedExactOrigin && origin === allowedExactOrigin) return callback(null, true);

        if (isDev) {
          const isLocalhost =
            /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
          if (isLocalhost) return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
    })
  );
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/categories", categoriesRouter);
  app.use("/api/places", placesRouter);

  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (err && typeof err === "object" && "issues" in err) {
        return res.status(400).json({ error: "VALIDATION_ERROR", details: err });
      }
      console.error(err);
      return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
  );

  return app;
}

