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

// --- TEAM SECURITY GUARD ---
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
        .eq("user_id", user.id) 
        .single();

      setStatus(member ? "authorized" : "unauthorized");
    }
    checkAccess();
  }, []);

  if (status === "loading") {
    return <div style={{padding: "50px", textAlign: "center", color: "#39ff14", background: "#050505", minHeight: "100vh"}}>Verifying...</div>;
  }
  if (status === "unauthorized") return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Header removed from here to stop the build error */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/m/:token" element={<PublicMockupViewer />} />

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
