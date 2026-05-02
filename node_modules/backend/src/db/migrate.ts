import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "./pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function run() {
  const sqlPath = join(__dirname, "..", "..", "sql", "001_create_places.sql");
  const sql = await readFile(sqlPath, "utf8");
  await pool.query(sql);
  await pool.end();
  console.log("Migration complete:", sqlPath);
}

run().catch(async (err) => {
  console.error("Migration failed:", err);
  await pool.end().catch(() => undefined);
  process.exit(1);
});

