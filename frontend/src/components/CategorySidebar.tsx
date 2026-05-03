import type { Category } from "../types";

type Props = {
  categories: Category[];
  selectedId: string | null;
  onSelect: (categoryId: string | null) => void;
};

export function CategorySidebar({ categories, selectedId, onSelect }: Props) {
  return (
    <aside className="categorySidebar" aria-label="หมวดหมู่">
      <div className="categorySidebarTitle">หมวดหมู่</div>
      <ul className="categoryList">
        <li>
          <button
            type="button"
            className={`categoryBtn${selectedId === null || selectedId === "all" ? " isActive" : ""}`}
            onClick={() => onSelect(null)}
          >
            ทั้งหมด
          </button>
        </li>
        {categories.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className={`categoryBtn${selectedId === String(c.id) ? " isActive" : ""}`}
              onClick={() => onSelect(String(c.id))}
            >
              {c.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
