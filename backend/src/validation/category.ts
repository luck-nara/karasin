import { z } from "zod";

export const categoryCreateSchema = z.object({
  name: z.string().min(1).max(100),
});

/** อัปเดตชื่อหมวด — รูปแบบเดียวกับสร้าง */
export const categoryUpdateSchema = categoryCreateSchema;
