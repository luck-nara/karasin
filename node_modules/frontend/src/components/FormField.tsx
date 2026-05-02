import type { ReactNode } from "react";

export function FormField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label>
        {label}
        <div style={{ marginTop: 6 }}>{children}</div>
      </label>
      {hint ? <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>{hint}</div> : null}
    </div>
  );
}

