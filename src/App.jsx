import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/customSupabaseClient";

import Home from "./pages/Home";
import Login from "./pages/Login"; 
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
      if (!user) { setStatus("unauthorized"); return; }

      const { data: members } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("user_id", user.id);

      setStatus(members && members.length > 0 ? "authorized" : "unauthorized");
    }
    checkAccess();
  }, []);

  if (status === "loading") return <div style={{padding: "50px", textAlign: "center", color: "#39ff14", background: "#050505", minHeight: "100vh"}}>Verifying...</div>;
  if (status === "unauthorized") return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES - No Login Required */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/m/:token" element={<PublicMockupViewer />} />
        
        {/* PREVIEW IS NOW PUBLIC */}
        <Route path="/magazine-mockup/:id/preview" element={<MagazineMockupPreview />} />

        {/* PROTECTED TEAM ROUTES - Login Required */}
        <Route path="/heic-to-jpg" element={<TeamGuard><HeicToJpg /></TeamGuard>} />
        <Route path="/banner-calculator" element={<TeamGuard><BannerCalculator /></TeamGuard>} />
        <Route path="/magazine-mockup" element={<TeamGuard><MagazineMockupDashboard /></TeamGuard>} />
        <Route path="/magazine-mockup/:id" element={<TeamGuard><MagazineMockupEditor /></TeamGuard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
