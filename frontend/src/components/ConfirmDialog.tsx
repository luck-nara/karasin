import { useEffect, useId } from "react";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger = ปุ่มยืนยันโทนสีแดงสำหรับการลบ */
  tone?: "default" | "danger";
  confirmBusy?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "ตกลง",
  cancelLabel = "ยกเลิก",
  tone = "default",
  confirmBusy = false,
  onCancel,
  onConfirm,
}: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !confirmBusy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, confirmBusy]);

  if (!open) return null;

  return (
    <div className="dialogRoot" role="presentation">
      <button
        type="button"
        className="dialogBackdrop"
        aria-label="ปิดหน้าต่าง"
        disabled={confirmBusy}
        onClick={() => {
          if (!confirmBusy) onCancel();
        }}
      />
      <div
        className="dialogSurface"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={`dialogAccentStrip${tone === "danger" ? " dialogAccentStripDanger" : ""}`} aria-hidden />
        <div className="dialogBody">
          <h2 id={titleId} className="dialogTitle">
            {title}
          </h2>
          {children ? <div className="dialogContent">{children}</div> : null}
          <div className="dialogActions">
            <button type="button" className="button dialogBtnGhost" onClick={onCancel} disabled={confirmBusy}>
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`button dialogBtnConfirm${tone === "danger" ? " dialogBtnConfirmDanger" : " dialogBtnConfirmPrimary"}`}
              disabled={confirmBusy}
              onClick={() => void Promise.resolve(onConfirm())}
            >
              {confirmBusy ? "กำลังดำเนินการ..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
