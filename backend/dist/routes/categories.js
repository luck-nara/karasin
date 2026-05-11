import { Router } from "express";
import { pool } from "../db/pool.js";
import { categoryCreateSchema, categoryUpdateSchema } from "../validation/category.js";
export const categoriesRouter = Router();
function isPgUniqueViolation(err) {
    return (typeof err === "object" &&
        err !== null &&
        "code" in err &&
        err.code === "23505");
}
categoriesRouter.get("/", async (_req, res, next) => {
    try {
        const result = await pool.query(`select id, name,
              created_at as "createdAt",
              updated_at as "updatedAt"
         from categories
        order by created_at asc`);
        res.json({ data: result.rows });
    }
    catch (err) {
        next(err);
    }
});
categoriesRouter.post("/", async (req, res, next) => {
    try {
        const payload = categoryCreateSchema.parse(req.body);
        const name = payload.name.trim();
        if (!name)
            return res.status(400).json({ error: "INVALID_NAME" });
        const result = await pool.query(`insert into categories (name) values ($1)
       returning id, name,
                 created_at as "createdAt",
                 updated_at as "updatedAt"`, [name]);
        res.status(201).json({ data: result.rows[0] });
    }
    catch (err) {
        if (isPgUniqueViolation(err)) {
            return res.status(409).json({ error: "DUPLICATE_NAME" });
        }
        next(err);
    }
});
categoriesRouter.put("/:id", async (req, res, next) => {
    try {
        const id = Number.parseInt(req.params.id, 10);
        if (!Number.isFinite(id))
            return res.status(400).json({ error: "INVALID_ID" });
        const payload = categoryUpdateSchema.parse(req.body);
        const name = payload.name.trim();
        if (!name)
            return res.status(400).json({ error: "INVALID_NAME" });
        const exists = await pool.query(`select id from categories where id = $1`, [id]);
        if (!exists.rows[0])
            return res.status(404).json({ error: "NOT_FOUND" });
        const result = await pool.query(`update categories
          set name = $1,
              updated_at = CURRENT_TIMESTAMP
        where id = $2
        returning id, name,
                  created_at as "createdAt",
                  updated_at as "updatedAt"`, [name, id]);
        res.json({ data: result.rows[0] });
    }
    catch (err) {
        if (isPgUniqueViolation(err)) {
            return res.status(409).json({ error: "DUPLICATE_NAME" });
        }
        next(err);
    }
});
categoriesRouter.delete("/:id", async (req, res, next) => {
    try {
        const id = Number.parseInt(req.params.id, 10);
        if (!Number.isFinite(id))
            return res.status(400).json({ error: "INVALID_ID" });
        const exists = await pool.query(`select id from categories where id = $1`, [id]);
        if (!exists.rows[0])
            return res.status(404).json({ error: "NOT_FOUND" });
        const countResult = await pool.query(`select count(*)::int as n from tourist_places where category_id = $1`, [id]);
        const n = countResult.rows[0]?.n ?? 0;
        if (n > 0) {
            return res.status(409).json({ error: "HAS_REFERENCES" });
        }
        await pool.query(`delete from categories where id = $1`, [id]);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
