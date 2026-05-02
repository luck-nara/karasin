import { Router } from "express";
import { pool } from "../db/pool.js";
import { placeCreateSchema, placeUpdateSchema } from "../validation/place.js";
export const placesRouter = Router();
placesRouter.get("/", async (_req, res, next) => {
    try {
        const result = await pool.query(`select id, name, description, location, province, tags, image_url as "imageUrl", created_at as "createdAt", updated_at as "updatedAt"
       from places
       order by created_at desc`);
        res.json({ data: result.rows });
    }
    catch (err) {
        next(err);
    }
});
placesRouter.get("/:id", async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await pool.query(`select id, name, description, location, province, tags, image_url as "imageUrl", created_at as "createdAt", updated_at as "updatedAt"
       from places
       where id = $1`, [id]);
        const place = result.rows[0];
        if (!place)
            return res.status(404).json({ error: "NOT_FOUND" });
        res.json({ data: place });
    }
    catch (err) {
        next(err);
    }
});
placesRouter.post("/", async (req, res, next) => {
    try {
        const payload = placeCreateSchema.parse(req.body);
        const result = await pool.query(`insert into places (name, description, location, province, tags, image_url)
       values ($1, $2, $3, $4, $5, $6)
       returning id, name, description, location, province, tags, image_url as "imageUrl", created_at as "createdAt", updated_at as "updatedAt"`, [
            payload.name,
            payload.description,
            payload.location,
            payload.province,
            payload.tags,
            payload.imageUrl ?? null,
        ]);
        res.status(201).json({ data: result.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
placesRouter.put("/:id", async (req, res, next) => {
    try {
        const id = req.params.id;
        const patch = placeUpdateSchema.parse(req.body);
        const current = await pool.query(`select id, name, description, location, province, tags, image_url as "imageUrl"
       from places
       where id = $1`, [id]);
        const existing = current.rows[0];
        if (!existing)
            return res.status(404).json({ error: "NOT_FOUND" });
        const nextPlace = {
            name: patch.name ?? existing.name,
            description: patch.description ?? existing.description,
            location: patch.location ?? existing.location,
            province: patch.province ?? existing.province,
            tags: patch.tags ?? existing.tags,
            imageUrl: patch.imageUrl ?? existing.imageUrl,
        };
        const result = await pool.query(`update places
       set name = $1,
           description = $2,
           location = $3,
           province = $4,
           tags = $5,
           image_url = $6,
           updated_at = now()
       where id = $7
       returning id, name, description, location, province, tags, image_url as "imageUrl", created_at as "createdAt", updated_at as "updatedAt"`, [
            nextPlace.name,
            nextPlace.description,
            nextPlace.location,
            nextPlace.province,
            nextPlace.tags,
            nextPlace.imageUrl ?? null,
            id,
        ]);
        res.json({ data: result.rows[0] });
    }
    catch (err) {
        next(err);
    }
});
placesRouter.delete("/:id", async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await pool.query(`delete from places where id = $1`, [id]);
        if (result.rowCount === 0)
            return res.status(404).json({ error: "NOT_FOUND" });
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
