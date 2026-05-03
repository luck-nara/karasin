import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ADMIN_AUTH_KEY } from "../lib/auth";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "1234";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await Promise.resolve();
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        sessionStorage.setItem(ADMIN_AUTH_KEY, "1");
        navigate("/admin", { replace: true });
      } else {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="authPage panel">
      <div className="panelHeader">
        <div className="panelTitle">เข้าสู่ระบบผู้ดูแล</div>
      </div>
      <div className="panelBody">
        <form className="stack authForm" onSubmit={onSubmit}>
          {error ? <div className="authError">{error}</div> : null}
          <label className="field">
            <span>อีเมล</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="field">
            <span>รหัสผ่าน</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button 
          className="button buttonPrimary" 
          type="submit" 
           disabled={busy} 
           style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}>
            {busy ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </section>
  );
}
