import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { categoriesApi } from "../api/categories";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FormField } from "../components/FormField";
import { HttpError } from "../lib/http";
import type { Category } from "../types";

function apiErrorCode(err: unknown): string | undefined {
  if (!(err instanceof HttpError)) return undefined;
  const b = err.body;
  if (b && typeof b === "object" && "error" in b) {
    return String((b as { error: string }).error);
  }
  return undefined;
}

export function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editBusy, setEditBusy] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setError(null);
    (async () => {
      try {
        const data = await categoriesApi.list();
        if (alive) setItems(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  function startEdit(c: Category) {
    setInfo(null);
    setError(null);
    setEditingId(c.id);
    setEditName(c.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId === null) return;
    setError(null);
    setInfo(null);
    setEditBusy(true);
    try {
      const updated = await categoriesApi.update(String(editingId), { name: editName });
      setItems((prev) => {
        if (!prev) return prev;
        return prev
          .map((c) => (c.id === updated.id ? updated : c))
          .sort((a, b) => a.name.localeCompare(b.name, "th"));
      });
      cancelEdit();
      setInfo(
        "มีการแก้ไขข้อมูลหมวดหมู่ ข้อมูลสถานที่ที่เกี่ยวข้องอาจมีการเปลี่ยนแปลงการแสดงผล"
      );
    } catch (err) {
      if (err instanceof HttpError && err.status === 409) {
        setError("มีชื่อหมวดหมู่นี้อยู่แล้ว กรุณาใช้ชื่ออื่น");
      } else {
        setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
      }
    } finally {
      setEditBusy(false);
    }
  }

  async function confirmDelete() {
    const c = pendingDelete;
    if (!c) return;
    setDeleteBusy(true);
    setError(null);
    try {
      await categoriesApi.remove(String(c.id));
      setItems((prev) => (prev ? prev.filter((x) => x.id !== c.id) : prev));
      setPendingDelete(null);
    } catch (err) {
      if (apiErrorCode(err) === "HAS_REFERENCES") {
        setError(
          "ไม่สามารถลบหมวดหมู่นี้ได้ เนื่องจากยังมีสถานที่ที่อ้างอิงหมวดนี้อยู่ — โปรดเปลี่ยนหมวดของสถานที่ก่อน หรือลบสถานที่ที่เกี่ยวข้อง"
        );
      } else {
        setError(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
      }
      setPendingDelete(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const created = await categoriesApi.create({ name });
      setName("");
      setItems((prev) => {
        const next = [...(prev ?? []), created];
        next.sort((a, b) => a.name.localeCompare(b.name, "th"));
        return next;
      });
    } catch (err) {
      if (err instanceof HttpError && err.status === 409) {
        setError("มีชื่อหมวดหมู่นี้อยู่แล้ว กรุณาใช้ชื่ออื่น");
      } else {
        setError(err instanceof Error ? err.message : "เพิ่มหมวดหมู่ไม่สำเร็จ");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="ลบหมวดหมู่นี้หรือไม่?"
        tone="danger"
        confirmLabel="ลบเลย"
        cancelLabel="ยกเลิก"
        confirmBusy={deleteBusy}
        onCancel={() => {
          if (deleteBusy) return;
          setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      >
        <p className="dialogLead">
          หมวด <strong>{pendingDelete?.name}</strong> จะถูกลบถาวร
        </p>
        <p className="dialogMuted">ถ้ามีสถานที่อ้างอิงหมวดนี้อยู่ ระบบจะไม่อนุญาตให้ลบ</p>
      </ConfirmDialog>

      <section className="panel adminCategoriesPanel">
        <div className="panelHeader adminHeader">
          <div>
            <div className="panelTitle">จัดการหมวดหมู่</div>
            <div className="muted panelSubtitle">
              เพิ่ม แก้ไข หรือลบหมวดหมู่ — ลบได้เมื่อไม่มีสถานที่ใช้หมวดนั้น
            </div>
          </div>
        </div>
        <div className="panelBody stack">
          {info ? (
            <div className="adminInfoBanner" role="status">
              <span className="adminInfoBannerIcon" aria-hidden />
              <div>
                <div className="adminInfoBannerTitle">แจ้งเตือน</div>
                <p className="adminInfoBannerText">{info}</p>
                <button type="button" className="button buttonSmall adminInfoBannerDismiss" onClick={() => setInfo(null)}>
                  ปิด
                </button>
              </div>
            </div>
          ) : null}

          {error ? <div className="authError">{error}</div> : null}

          <form className="adminCategoryForm stack" onSubmit={onSubmit}>
            <div className="grid2 adminCategoryFormGrid">
              <FormField label="ชื่อหมวดหมู่ใหม่">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ตลาดนัด ชุมชน ธรรมชาติ"
                  maxLength={100}
                  required
                />
              </FormField>
              <div className="adminCategorySubmitWrap">
                <label className="field">
                  <span className="adminCategorySubmitLabel">&nbsp;</span>
                  <button className="button buttonPrimary adminCategorySubmitBtn" type="submit" disabled={busy}>
                    {busy ? "กำลังบันทึก..." : "เพิ่มหมวดหมู่"}
                  </button>
                </label>
              </div>
            </div>
          </form>

          {!items ? <div className="muted">กำลังโหลดหมวดหมู่...</div> : null}

          {items && items.length === 0 ? <div className="muted">ยังไม่มีหมวดหมู่ในระบบ</div> : null}

          {items && items.length > 0 ? (
            <div className="adminCategoryTableWrap">
              <table className="adminCategoryTable">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">ชื่อหมวดหมู่</th>
                    <th scope="col" className="adminCategoryTableActions">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id}>
                      <td className="adminCategoryIdCell">{c.id}</td>
                      <td>
                        {editingId === c.id ? (
                          <form className="adminCategoryEditRow" onSubmit={saveEdit}>
                            <input
                              className="adminCategoryEditInput"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              maxLength={100}
                              required
                              disabled={editBusy}
                              autoFocus
                            />
                            <div className="adminCategoryEditActions">
                              <button type="submit" className="button buttonSmall buttonPrimary" disabled={editBusy}>
                                {editBusy ? "กำลังบันทึก..." : "บันทึก"}
                              </button>
                              <button
                                type="button"
                                className="button buttonSmall"
                                disabled={editBusy}
                                onClick={cancelEdit}
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </form>
                        ) : (
                          <span className="adminCategoryName">{c.name}</span>
                        )}
                      </td>
                      <td>
                        {editingId === c.id ? null : (
                          <div className="adminRowActions">
                            <button type="button" className="button buttonSmall buttonPrimary" onClick={() => startEdit(c)}>
                              แก้ไข
                            </button>
                            <button
                              type="button"
                              className="button buttonSmall buttonDanger"
                              onClick={() => setPendingDelete(c)}
                            >
                              ลบ
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
