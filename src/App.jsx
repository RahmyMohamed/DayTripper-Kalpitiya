import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Catalogue from "./pages/Catalogue.jsx";
import PlaceDetail from "./pages/PlaceDetail.jsx";
import MapExplorer from "./pages/MapExplorer.jsx";
import DayPlan from "./pages/DayPlan.jsx";
import Favorites from "./pages/Favorites.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalogue" element={<Catalogue />} />
            <Route path="/place/:id" element={<PlaceDetail />} />
            <Route path="/map" element={<MapExplorer />} />
            <Route path="/day-plan" element={<DayPlan />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
