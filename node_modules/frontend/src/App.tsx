import { Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { Navbar } from "./components/Navbar";
import { RequireAdmin } from "./components/RequireAdmin";
import { AdminCategoriesPage } from "./pages/AdminCategoriesPage";
import { AdminPlaceFormPage } from "./pages/AdminPlaceFormPage";
import { AdminPlacesPage } from "./pages/AdminPlacesPage";
import { AssistantChatPage } from "./pages/AssistantChatPage";
import { ContactPage } from "./pages/ContactPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { PlaceDetailPage } from "./pages/PlaceDetailPage";
import { PlacesListPage } from "./pages/PlacesListPage";

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="mainShell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/places" element={<PlacesListPage />} />
          <Route path="/places/:id" element={<PlaceDetailPage />} />
          <Route path="/assistant" element={<AssistantChatPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminPlacesPage />} />
            <Route path="new" element={<AdminPlaceFormPage mode="create" />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="edit/:id" element={<AdminPlaceFormPage mode="edit" />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}
