import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { categoriesApi } from "../api/categories";
import type { Category } from "../types";

export function Navbar() {
  const location = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await categoriesApi.list();
        if (alive) setCategories(data);
      } catch {
        if (alive) setCategories([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [location.pathname]);

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
        {categories.map((c) => {
          const to = `/places?category_id=${c.id}`;
          const active =
            location.pathname === "/places" &&
            new URLSearchParams(location.search).get("category_id") === String(c.id);
          return (
            <Link key={c.id} className={`navLink${active ? " navLinkActive" : ""}`} to={to}>
              {c.name}
            </Link>
          );
        })}
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
