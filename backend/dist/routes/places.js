import { Router } from "express";
import { pool } from "../db/pool.js";
import { placeCreateSchema, placeReplaceSchema } from "../validation/place.js";
export const placesRouter = Router();
const placeRowSelect = `
         tp.id,
         tp.name,
         tp.description,
         tp.google_maps_url as "googleMapsUrl",
         tp.category_id as "categoryId",
         c.name as "categoryName"`;
placesRouter.get("/", async (req, res, next) => {
    try {
        const raw = req.query.category_id;
        const categoryId = raw === undefined || raw === "" || raw === "all"
            ? null
            : Number.parseInt(String(raw), 10);
        if (raw !== undefined && raw !== "" && raw !== "all" && !Number.isFinite(categoryId)) {
            return res.status(400).json({ error: "INVALID_CATEGORY_ID" });
        }
        const searchRaw = req.query.search;
        const search = typeof searchRaw === "string" && searchRaw.trim().length > 0 ? searchRaw.trim() : null;
        const result = await pool.query(`select
         ${placeRowSelect},
         coalesce(
           (select pi.image_url from place_images pi
            where pi.place_id = tp.id and pi.is_cover = true
            limit 1),
           (select pi.image_url from place_images pi
            where pi.place_id = tp.id
            order by pi.id asc
            limit 1)
         ) as "coverImageUrl"
       from tourist_places tp
       left join categories c on c.id = tp.category_id
       where tp.is_active = true
         and ($1::int is null or tp.category_id = $1)
         and (
           $2::text is null
           or tp.name ilike '%' || $2 || '%'
           or tp.description ilike '%' || $2 || '%'
           or coalesce(c.name, '') ilike '%' || $2 || '%'
         )
       order by tp.created_at desc`, [categoryId, search]);
        res.json({ data: result.rows });
    }
    catch (err) {
        next(err);
    }
});
placesRouter.get("/:id", async (req, res, next) => {
    try {
        const id = req.params.id;
        const placeResult = await pool.query(`select
         ${placeRowSelect},
         tp.created_at as "createdAt",
         tp.updated_at as "updatedAt"
       from tourist_places tp
       left join categories c on c.id = tp.category_id
       where tp.id = $1 and tp.is_active = true`, [id]);
        const place = placeResult.rows[0];
        if (!place)
            return res.status(404).json({ error: "NOT_FOUND" });
        const imagesResult = await pool.query(`select id, image_url as url, is_cover as "isCover"
       from place_images
       where place_id = $1
       order by is_cover desc, id asc`, [id]);
        res.json({
            data: {
                ...place,
                images: imagesResult.rows,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
placesRouter.post("/", async (req, res, next) => {
    try {
        const payload = placeCreateSchema.parse(req.body);
        let coverIndex = payload.images.findIndex((img) => img.isCover === true);
        if (coverIndex < 0)
            coverIndex = 0;
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const insertPlace = await client.query(`insert into tourist_places
          (name, description, category_id, google_maps_url)
         values ($1, $2, $3, $4)
         returning id`, [payload.name, payload.description, payload.categoryId, payload.googleMapsUrl ?? null]);
            const placeId = insertPlace.rows[0].id;
            for (let i = 0; i < payload.images.length; i++) {
                const img = payload.images[i];
                const isCover = i === coverIndex;
                await client.query(`insert into place_images (place_id, image_url, is_cover)
           values ($1, $2, $3)`, [placeId, img.url, isCover]);
            }
            await client.query("COMMIT");
            const detail = await pool.query(`select
           ${placeRowSelect},
           tp.created_at as "createdAt",
           tp.updated_at as "updatedAt"
         from tourist_places tp
         left join categories c on c.id = tp.category_id
         where tp.id = $1`, [placeId]);
            const imagesResult = await pool.query(`select id, image_url as url, is_cover as "isCover"
         from place_images
         where place_id = $1
         order by is_cover desc, id asc`, [placeId]);
            res.status(201).json({
                data: {
                    ...detail.rows[0],
                    images: imagesResult.rows,
                },
            });
        }
        catch (err) {
            await client.query("ROLLBACK").catch(() => undefined);
            throw err;
        }
        finally {
            client.release();
        }
    }
    catch (err) {
        next(err);
    }
});
placesRouter.put("/:id", async (req, res, next) => {
    try {
        const id = Number.parseInt(req.params.id, 10);
        if (!Number.isFinite(id))
            return res.status(400).json({ error: "INVALID_ID" });
        const payload = placeReplaceSchema.parse(req.body);
        let coverIndex = payload.images.findIndex((img) => img.isCover === true);
        if (coverIndex < 0)
            coverIndex = 0;
        const exists = await pool.query(`select id from tourist_places where id = $1`, [id]);
        if (!exists.rows[0])
            return res.status(404).json({ error: "NOT_FOUND" });
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await client.query(`update tourist_places
         set name = $1,
             description = $2,
             category_id = $3,
             google_maps_url = $4,
             updated_at = now()
         where id = $5`, [payload.name, payload.description, payload.categoryId, payload.googleMapsUrl ?? null, id]);
            await client.query(`delete from place_images where place_id = $1`, [id]);
            for (let i = 0; i < payload.images.length; i++) {
                const img = payload.images[i];
                const isCover = i === coverIndex;
                await client.query(`insert into place_images (place_id, image_url, is_cover)
           values ($1, $2, $3)`, [id, img.url, isCover]);
            }
            await client.query("COMMIT");
            const detail = await pool.query(`select
           ${placeRowSelect},
           tp.created_at as "createdAt",
           tp.updated_at as "updatedAt"
         from tourist_places tp
         left join categories c on c.id = tp.category_id
         where tp.id = $1`, [id]);
            const imagesResult = await pool.query(`select id, image_url as url, is_cover as "isCover"
         from place_images
         where place_id = $1
         order by is_cover desc, id asc`, [id]);
            res.json({
                data: {
                    ...detail.rows[0],
                    images: imagesResult.rows,
                },
            });
        }
        catch (err) {
            await client.query("ROLLBACK").catch(() => undefined);
            throw err;
        }
        finally {
            client.release();
        }
    }
    catch (err) {
        next(err);
    }
});
placesRouter.delete("/:id", async (req, res, next) => {
    try {
        const id = Number.parseInt(req.params.id, 10);
        if (!Number.isFinite(id))
            return res.status(400).json({ error: "INVALID_ID" });
        const result = await pool.query(`delete from tourist_places where id = $1`, [id]);
        if (!result.rowCount)
            return res.status(404).json({ error: "NOT_FOUND" });
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
