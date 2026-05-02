import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { placesApi } from "../api/places";
import { FormField } from "../components/FormField";
import { uploadPlaceImage } from "../storage/uploadImage";
import type { PlaceCreateInput } from "../types";

export function PlaceFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [form, setForm] = useState<PlaceCreateInput>({
    name: "",
    description: "",
    location: "",
    province: "",
    tags: [],
    imageUrl: null,
  });

  const isEdit = mode === "edit";

  useEffect(() => {
    if (!isEdit || !id) return;
    let alive = true;
    (async () => {
      try {
        const place = await placesApi.get(id);
        if (!alive) return;
        setForm({
          name: place.name,
          description: place.description,
          location: place.location,
          province: place.province,
          tags: place.tags,
          imageUrl: place.imageUrl,
        });
        setImagePreviewUrl(place.imageUrl ?? null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, isEdit]);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const tagsText = useMemo(() => form.tags.join(", "), [form.tags]);

  function update<K extends keyof PlaceCreateInput>(key: K, value: PlaceCreateInput[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      let imageUrl = form.imageUrl ?? null;
      if (imageFile) {
        imageUrl = await uploadPlaceImage(imageFile, form.name);
      }

      if (isEdit) {
        if (!id) throw new Error("Missing id");
        const updated = await placesApi.update(id, { ...form, imageUrl });
        navigate(`/places/${updated.id}`);
      } else {
        const created = await placesApi.create({ ...form, imageUrl });
        navigate(`/places/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const title = isEdit ? "แก้ไขสถานที่" : "เพิ่มสถานที่";

  return (
    <section className="panel">
      <div className="panelHeader">
        <div style={{ fontSize: 18, fontWeight: 650 }}>{title}</div>
        <Link to={isEdit && id ? `/places/${id}` : "/"} className="button">
          ย้อนกลับ
        </Link>
      </div>
      <div className="panelBody">
        <form className="stack" onSubmit={onSubmit}>
          {error ? <div className="muted">{error}</div> : null}
          <div className="grid2">
            <FormField label="ชื่อสถานที่">
              <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </FormField>
            <FormField label="จังหวัด">
              <input value={form.province} onChange={(e) => update("province", e.target.value)} required />
            </FormField>
          </div>

          <FormField label="พิกัด/ที่อยู่" hint="ตัวอย่าง: อ.เมือง, กาฬสินธุ์ หรือพิกัด Google Maps">
            <input value={form.location} onChange={(e) => update("location", e.target.value)} required />
          </FormField>

          <FormField label="รายละเอียด">
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} required />
          </FormField>

          <FormField label="แท็ก (คั่นด้วย ,)">
            <input
              value={tagsText}
              onChange={(e) =>
                update(
                  "tags",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
              placeholder="ธรรมชาติ, วัด, คาเฟ่"
            />
          </FormField>

          <FormField label="รูปภาพ" hint="อัปโหลดไป Cloudinary แล้วจะบันทึก URL ในฐานข้อมูล">
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
          </FormField>

          {imagePreviewUrl ? <img className="thumb" src={imagePreviewUrl} alt="preview" /> : null}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="button" type="button" onClick={() => navigate(-1)} disabled={busy}>
              ยกเลิก
            </button>
            <button className="button buttonPrimary" type="submit" disabled={busy}>
              {busy ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

