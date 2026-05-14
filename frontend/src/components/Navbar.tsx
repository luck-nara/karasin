
import { Link, useLocation } from "react-router-dom";

export function Navbar() {
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith("/admin");

  function navLinkClass(path: string) {
    const active = location.pathname === path;
    return `navLink${active ? " navLinkActive" : ""}`;
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbarBrand">
        Karasin Travel
      </Link>
      <nav className="navbarNav" aria-label="หลัก">
        <Link className={navLinkClass("/")} to="/">
          หน้าแรก
        </Link>
        {!isAdminArea ? (
          <Link className={navLinkClass("/assistant")} to="/assistant">
            ผู้ช่วย AI
          </Link>
        ) : null}
        <Link className={navLinkClass("/contact")} to="/contact">
          ติดต่อ
        </Link>
        <Link className="navbarAdmin" to="/login">
          เข้าสู่ระบบ
        </Link>
      </nav>
    </header>
  );
}
