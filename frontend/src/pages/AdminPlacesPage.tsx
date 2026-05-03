import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { placesApi } from "../api/places";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { PlaceListItem } from "../types";

export function AdminPlacesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<PlaceListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PlaceListItem | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 280);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let alive = true;
    setError(null);
    (async () => {
      try {
        const data = await placesApi.list(null, debouncedSearch || null);
        if (alive) setItems(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    })();
    return () => {
      alive = false;
    };
  }, [debouncedSearch]);

  async function confirmDelete() {
    const place = pendingDelete;
    if (!place) return;
    setBusyId(place.id);
    setError(null);
    try {
      await placesApi.remove(String(place.id));
      setItems((prev) => (prev ? prev.filter((p) => p.id !== place.id) : prev));
      setPendingDelete(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="ลบสถานที่นี้หรือไม่?"
        tone="danger"
        confirmLabel="ลบเลย"
        cancelLabel="ยกเลิก"
        confirmBusy={busyId !== null && pendingDelete?.id === busyId}
        onCancel={() => {
          if (busyId !== null) return;
          setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      >
        <p className="dialogLead">
          คุณกำลังจะลบ <strong>{pendingDelete?.name}</strong>
        </p>
        <p className="dialogMuted">การลบจะถาวร และไม่สามารถกู้คืนได้</p>
      </ConfirmDialog>

      <section className="panel adminPlacesPanel">
        <div className="panelHeader adminHeader">
          <div>
            <div className="panelTitle">จัดการสถานที่ท่องเที่ยว</div>
            <div className="muted panelSubtitle">
              ค้นหาได้จากชื่อ รายละเอียด หรือชื่อหมวดหมู่
            </div>
          </div>
        </div>
        <div className="panelBody stack">
          <label className="field adminSearchField">
            <span>ค้นหา</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="พิมพ์คำค้นแล้วรอผลไม่เกินประมาณ 0.3 วินาที..."
              autoComplete="off"
            />
          </label>

          {error ? <div className="authError">{error}</div> : null}

          {!items ? <div className="muted">กำลังโหลด...</div> : null}

          {items && items.length === 0 ? (
            <div className="muted">ไม่พบข้อมูลที่ตรงกับคำค้น</div>
          ) : null}

          {items && items.length > 0 ? (
            <div className="adminTableWrap">
              <table className="adminTable">
                <thead>
                  <tr>
                    <th scope="col" style={{ textAlign: "center" }}>รูป</th>
                    <th scope="col" style={{ textAlign: "center" }}>ชื่อสถานที่</th>
                    <th scope="col" style={{ textAlign: "center" }}>หมวด</th>
                    <th scope="col" className="adminTableActions" style={{ textAlign: "center" }}>
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id}>
                      <td style={{ textAlign: "center" }}>
                        <div className="adminThumbCell">
                          {p.coverImageUrl ? (
                            <img src={p.coverImageUrl} alt="" className="adminThumb" />
                          ) : (
                            <div className="adminThumbPlaceholder muted">ไม่มีรูป</div>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div className="adminPlaceName">{p.name}</div>
                        <div className="muted adminPlaceShort">{p.description}</div>
                      </td>
                      <td style={{ textAlign: "center" }}>{p.categoryName ?? "—"}</td>
                      <td style={{ textAlign: "center" }}>
                      <div
                        className="adminRowActions"
                        style={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "center"
                        }}
                      >
                        {/* แก้ไข */}
                        <Link
                          to={`/admin/edit/${p.id}`}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            background: "#3b82f6",
                            color: "white",
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                          title="แก้ไข"
                        >
                          ✏️
                        </Link>

                        {/* ลบ */}
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => setPendingDelete(p)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                          title="ลบ"
                        >
                          🗑️
                        </button>
</div>
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
