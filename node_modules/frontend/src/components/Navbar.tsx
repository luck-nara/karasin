
import { Link, useLocation } from "react-router-dom";

export function Navbar() {
  const location = useLocation();

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
