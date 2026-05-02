import { Link, Route, Routes } from "react-router-dom";
import { PlacesListPage } from "./pages/PlacesListPage";
import { PlaceDetailPage } from "./pages/PlaceDetailPage";
import { PlaceFormPage } from "./pages/PlaceFormPage";

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          Karasin Travel
        </Link>
        <nav className="nav">
          <Link to="/">สถานที่</Link>
          <Link to="/places/new" className="button">
            เพิ่มสถานที่
          </Link>
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<PlacesListPage />} />
          <Route path="/places/new" element={<PlaceFormPage mode="create" />} />
          <Route path="/places/:id" element={<PlaceDetailPage />} />
          <Route path="/places/:id/edit" element={<PlaceFormPage mode="edit" />} />
        </Routes>
      </main>
    </div>
  );
}
