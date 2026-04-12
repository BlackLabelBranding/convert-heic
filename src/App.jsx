import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/customSupabaseClient";

import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login"; // New Import
import HeicToJpg from "./pages/HeicToJpg";
import BannerCalculator from "./pages/BannerCalculator";
import MagazineMockupDashboard from "./pages/MagazineMockupDashboard";
import MagazineMockupEditor from "./pages/MagazineMockupEditor";
import MagazineMockupPreview from "./pages/MagazineMockupPreview";
import PublicMockupViewer from "./pages/PublicMockupViewer";

function TeamGuard({ children }) {
  const [status, setStatus] = useState("loading");
  
  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus("unauthorized");
        return;
      }

      const { data: member } = await supabase
        .from("team_members")
        .select("*")
        .eq("id", user.id) // Ensure this matches your column name
        .single();

      setStatus(member ? "authorized" : "unauthorized");
    }
    checkAccess();
  }, []);

  if (status === "loading") return <div style={{padding: "50px", textAlign: "center", color: "#39ff14"}}>Checking Credentials...</div>;
  
  // REDIRECT TO LOGIN if unauthorized
  if (status === "unauthorized") return <Navigate to="/login" replace />;

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/m/:token" element={<PublicMockupViewer />} />

        {/* PROTECTED */}
        <Route path="/heic-to-jpg" element={<TeamGuard><HeicToJpg /></TeamGuard>} />
        <Route path="/banner-calculator" element={<TeamGuard><BannerCalculator /></TeamGuard>} />
        <Route path="/magazine-mockup" element={<TeamGuard><MagazineMockupDashboard /></TeamGuard>} />
        <Route path="/magazine-mockup/:id" element={<TeamGuard><MagazineMockupEditor /></TeamGuard>} />
        <Route path="/magazine-mockup/:id/preview" element={<TeamGuard><MagazineMockupPreview /></TeamGuard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
