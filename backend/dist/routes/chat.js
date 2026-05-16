import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
const OPENAI_MODEL_DEFAULT = "gpt-4o-mini";
const bodySchema = z.object({
    messages: z
        .array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(8000),
    }))
        .min(1)
        .max(30),
});
function truncateText(s, max) {
    const t = s.trim();
    if (t.length <= max)
        return t;
    return `${t.slice(0, max)}…`;
}
function buildSystemPrompt(places) {
    const payload = places.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.categoryName ?? "",
        description: truncateText(p.description ?? "", 260),
        googleMapsUrl: p.googleMapsUrl || undefined,
        facebookUrl: p.facebookUrl || undefined,
        lineUrl: p.lineUrl || undefined,
    }));
    return [
        "คุณคือผู้ช่วยแนะนำสถานที่ท่องเที่ยวจังหวัดกาฬสินธุ์",
        "กฎสำคัญ:",
        "- ตอบเป็นภาษาไทยเท่านั้น น้ำเสียงสุภาพ อ่านง่าย",
        "- ตอบกระชับแต่ครบข้อมูลสำคัญของแต่ละสถานที่ที่แนะนำ",
        "- ใช้เฉพาะข้อมูลจากอาร์เรย์ JSON \"places\" ด้านล่างเท่านั้น ห้ามสร้างชื่อสถานที่ รายละเอียด หมวดหมู่ หรือลิงก์ที่ไม่มีในรายการ",
        "- เมื่อแนะนำแต่ละสถานที่ ให้ใช้รูปแบบนี้ (ขึ้นต้นด้วย \"- ชื่อสถานที่\" แล้วบรรทัดถัดไปเยื้องด้วยข้อความ):",
        "  หมวด: (จาก category)",
        "  รายละเอียด: (สรุปจาก description สั้นๆ 1–2 ประโยค ห้ามยาวเกิน)",
        "  แผนที่: URL (เฉพาะเมื่อมี googleMapsUrl)",
        "  Facebook: URL (เฉพาะเมื่อมี facebookUrl)",
        "  LINE: URL (เฉพาะเมื่อมี lineUrl)",
        "  ข้ามบรรทัดที่ไม่มีข้อมูลใน JSON (เช่นไม่มี facebookUrl ก็ไม่ต้องมีบรรทัด Facebook)",
        "- ห้ามใช้รูปแบบ Markdown สำหรับลิงก์ เช่น ห้ามเขียน [ข้อความ](url)",
        "- คัดลอก URL จาก JSON เต็มๆ ห้ามสร้างหรือแปลงลิงก์เอง",
        "- ถ้าไม่มีข้อมูลในระบบที่ตอบคำถามได้ (เช่น places ว่าง หรือไม่มีสถานที่ที่ตรงกับคำถาม) ให้ตอบว่า \"ขออภัย ยังไม่มีข้อมูลในระบบ\" โดยใช้ประโยคนี้ตรงๆ",
        "- หากแนะนำหลายสถานที่ ให้จัดเป็นข้อ โดยแต่ละข้อขึ้นต้นด้วย \"- \" หรือใช้ลำดับเลข",
        "- ไม่ต้องคัดลอกคำถามผู้ใช้มาในคำตอบ",
        "",
        `places = ${JSON.stringify(payload)}`,
    ].join("\n");
}
async function loadPlacesForPrompt() {
    const result = await pool.query(`select
       tp.id,
       tp.name,
       tp.description,
       c.name as "categoryName",
       tp.google_maps_url as "googleMapsUrl",
       tp.facebook_url as "facebookUrl",
       tp.line_url as "lineUrl"
     from tourist_places tp
     left join categories c on c.id = tp.category_id
     where tp.is_active = true
     order by tp.name asc
     limit 55`);
    return result.rows;
}
async function pipeOpenAiStreamToClient(body, res) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let lineBuf = "";
    let sawDone = false;
    while (!sawDone) {
        const { done, value } = await reader.read();
        if (done)
            break;
        lineBuf += decoder.decode(value, { stream: true });
        const lines = lineBuf.split("\n");
        lineBuf = lines.pop() ?? "";
        for (const rawLine of lines) {
            const line = rawLine.replace(/\r$/, "").trim();
            if (!line.startsWith("data:"))
                continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") {
                sawDone = true;
                break;
            }
            let json;
            try {
                json = JSON.parse(data);
            }
            catch {
                continue;
            }
            const rec = json;
            const piece = rec.choices?.[0]?.delta?.content;
            if (piece) {
                res.write(`data: ${JSON.stringify({ d: piece })}\n\n`);
            }
        }
    }
}
export const chatRouter = Router();
chatRouter.post("/stream", async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
        return res.status(503).json({
            error: "OPENAI_NOT_CONFIGURED",
            message: "ตั้งค่า OPENAI_API_KEY ในเซิร์ฟเวอร์",
        });
    }
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    }
    let places;
    try {
        places = await loadPlacesForPrompt();
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ error: "PLACES_LOAD_FAILED" });
    }
    const systemPrompt = buildSystemPrompt(places);
    const userMessages = parsed.data.messages;
    const model = process.env.OPENAI_MODEL?.trim() || OPENAI_MODEL_DEFAULT;
    let aiResponse;
    try {
        aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model,
                stream: true,
                temperature: 0.45,
                max_tokens: 1024,
                messages: [{ role: "system", content: systemPrompt }, ...userMessages],
            }),
        });
    }
    catch (e) {
        console.error(e);
        return res.status(502).json({ error: "AI_UPSTREAM_UNREACHABLE" });
    }
    if (!aiResponse.ok) {
        const t = await aiResponse.text();
        console.error("OpenAI error:", aiResponse.status, t);
        return res.status(502).json({ error: "AI_UPSTREAM_ERROR", status: aiResponse.status });
    }
    if (!aiResponse.body) {
        return res.status(502).json({ error: "AI_EMPTY_BODY" });
    }
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    const onClose = () => {
        try {
            aiResponse.body?.cancel();
        }
        catch {
            /* ignore */
        }
    };
    req.on("close", onClose);
    try {
        await pipeOpenAiStreamToClient(aiResponse.body, res);
        res.write(`data: [DONE]\n\n`);
        res.end();
    }
    catch (e) {
        console.error("stream error", e);
        try {
            res.write(`data: ${JSON.stringify({ error: "STREAM_ERROR" })}\n\n`);
            res.write(`data: [DONE]\n\n`);
        }
        catch {
            /* ignore */
        }
        res.end();
    }
    finally {
        req.off("close", onClose);
    }
});
