import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "./pool.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sqlFiles = [
    "001_create_places.sql",
    "002_seed_categories.sql",
    "003_alter_places_google_maps.sql",
    "004_alter_categories_timestamps.sql",
];
async function run() {
    for (const file of sqlFiles) {
        const sqlPath = join(__dirname, "..", "..", "sql", file);
        const sql = await readFile(sqlPath, "utf8");
        await pool.query(sql);
        console.log("Migration applied:", sqlPath);
    }
    await pool.end();
}
run().catch(async (err) => {
    console.error("Migration failed:", err);
    await pool.end().catch(() => undefined);
    process.exit(1);
});
