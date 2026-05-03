import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { categoriesApi } from "../api/categories";
import { placesApi } from "../api/places";
import { FormField } from "../components/FormField";
import { uploadPlaceImage } from "../storage/uploadImage";
import type { Category } from "../types";

export function AdminPlaceFormPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";

  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(isEdit);

  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await categoriesApi.list();
        if (alive) {
          setCategories(data);
          if (!isEdit && data[0]) setCategoryId(data[0].id);
        }
      } catch {
        if (alive) setCategories([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit || !id) return;
    let alive = true;
    setLoadError(null);
    (async () => {
      try {
        const place = await placesApi.get(id);
        if (!alive) return;
        setName(place.name);
        setDescription(place.description);
        setCategoryId(place.categoryId ?? "");
        setGoogleMapsUrl(place.googleMapsUrl ?? "");
        const urls = place.images.map((i) => i.url);
        setExistingUrls(urls);
        const cov = place.images.findIndex((i) => i.isCover);
        setCoverIndex(cov >= 0 ? cov : 0);
      } catch (e) {
        if (alive) setLoadError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (alive) setDetailLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, isEdit]);

  const totalImages = existingUrls.length + newFiles.length;

  useEffect(() => {
    setCoverIndex((i) => {
      if (totalImages <= 0) return 0;
      return Math.min(Math.max(i, 0), totalImages - 1);
    });
  }, [totalImages]);

  function removeExistingUrl(idx: number) {
    setExistingUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  const coverLabels = useMemo(() => {
    const labels: string[] = [];
    existingUrls.forEach((_, i) => labels.push(`รูปเดิม ${i + 1}`));
    newFiles.forEach((f, i) => labels.push(`ไฟล์ใหม่ ${i + 1}: ${f.name}`));
    return labels;
  }, [existingUrls.length, newFiles]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (categoryId === "") {
        setError("กรุณาเลือกหมวดหมู่");
        return;
      }

      const uploads = await Promise.all(
        newFiles.map((file, i) => uploadPlaceImage(file, `${name}-new-${i}`))
      );
      const allUrls = [...existingUrls, ...uploads];

      if (allUrls.length === 0) {
        setError("ต้องมีอย่างน้อย 1 รูปภาพ");
        return;
      }

      const images = allUrls.map((url, i) => ({
        url,
        isCover: i === coverIndex,
      }));

      const trimmedMaps = googleMapsUrl.trim();
      const payload = {
        name,
        description,
        categoryId,
        googleMapsUrl: trimmedMaps === "" ? null : trimmedMaps,
        images,
      };

      if (isEdit) {
        if (!id) throw new Error("ไม่พบรหัสสถานที่");
        await placesApi.update(id, payload);
      } else {
        await placesApi.create(payload);
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const title = isEdit ? "แก้ไขสถานที่" : "เพิ่มสถานที่ใหม่";

  if (isEdit && loadError) {
    return (
      <section className="panel">
        <div className="panelHeader adminHeader">
          <div className="panelTitle">{title}</div>
          <Link to="/admin" className="button">
            กลับ
          </Link>
        </div>
        <div className="panelBody">
          <div className="authError">{loadError}</div>
        </div>
      </section>
    );
  }

  if (isEdit && detailLoading) {
    return (
      <section className="panel">
        <div className="panelHeader adminHeader">
          <div className="panelTitle">{title}</div>
        </div>
        <div className="panelBody muted">กำลังโหลดข้อมูลสถานที่...</div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panelHeader adminHeader">
        <div>
          <div className="panelTitle">{title}</div>
          <div className="muted panelSubtitle">
            {isEdit ? "แก้ไขข้อมูลและรูปภาพ จากนั้นบันทึกการเปลี่ยนแปลง" : "กรอกข้อมูลแล้วอัปโหลดรูปไป Cloudinary"}
          </div>
        </div>
      </div>
      <div className="panelBody">
        <form className="stack" onSubmit={onSubmit}>
          {error ? <div className="authError">{error}</div> : null}

          <div className="grid2">
            <FormField label="ชื่อสถานที่">
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </FormField>
          </div>

          <FormField label="หมวดหมู่">
            <select
              value={categoryId === "" ? "" : String(categoryId)}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="รายละเอียด">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
          </FormField>

          <FormField
            label="ลิงก์ Google Maps"
            hint="วาง URL จาก Google Maps (แนะนำให้ขึ้นต้นด้วย https://)"
          >
            <input
              type="url"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
            />
          </FormField>

          {isEdit && existingUrls.length > 0 ? (
            <FormField label="รูปที่มีอยู่ (ลบได้ถ้าไม่ต้องการใช้)">
              <ul className="adminExistingImages">
                {existingUrls.map((url, idx) => (
                  <li key={`${url}-${idx}`} className="adminExistingImageRow">
                    <img src={url} alt="" className="adminExistingThumb" />
                    <button type="button" className="button buttonSmall buttonDanger" onClick={() => removeExistingUrl(idx)}>
                      ลบรูปนี้
                    </button>
                  </li>
                ))}
              </ul>
            </FormField>
          ) : null}

          <FormField
            label={isEdit ? "เพิ่มรูปใหม่ (ถ้ามี)" : "อัปโหลดรูป"}
            hint={isEdit ? "ถ้าไม่เลือกไฟล์ใหม่ จะใช้เฉพาะรูปเดิมที่เหลืออยู่" : "เลือกได้หลายไฟล์"}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
            />
          </FormField>

          {totalImages > 1 ? (
            <FormField label="เลือกรูปปก">
              <select value={String(coverIndex)} onChange={(e) => setCoverIndex(Number(e.target.value))}>
                {coverLabels.map((label, i) => (
                  <option key={`${label}-${i}`} value={i}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>
          ) : null}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="button buttonPrimary" type="submit" disabled={busy}>
              {busy ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
