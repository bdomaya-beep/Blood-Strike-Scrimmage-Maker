import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function startServer() {
  try {
    await pool.query("select 1");
    const tableCheck = await pool.query(
      "select to_regclass('public.users') as users_table",
    );
    if (!tableCheck.rows[0]?.users_table) {
      throw new Error(
        "Database schema is missing. Run: npm -w @workspace/db run push",
      );
    }
    logger.info("Database connection check passed");
  } catch (err) {
    logger.error({ err }, "Database connection check failed");
    process.exit(1);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

void startServer();
