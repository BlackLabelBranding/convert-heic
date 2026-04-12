import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/customSupabaseClient";

// Import components and pages
import Header from "./components/header";
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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setStatus("unauthorized");
        return;
      }

      // FIXED: Using "user_id" instead of "id" to match your table schema
      const { data: member, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("user_id", user.id) 
        .single();

      if (error || !member) {
        console.error("Access Denied:", error?.message);
        setStatus("unauthorized");
      } else {
        setStatus("authorized");
      }
    }
    checkAccess();
  }, []);

  if (status === "loading") {
    return (
      <div style={{
        padding: "50px", 
        textAlign: "center", 
        color: "#39ff14", 
        background: "#050505", 
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px"
      }}>
        Verifying Black Label Access...
      </div>
    );
  }
  
  if (status === "unauthorized") return <Navigate to="/login" replace />;

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/m/:token" element={<PublicMockupViewer />} />

        {/* PROTECTED TEAM ROUTES */}
        <Route path="/heic-to-jpg" element={<TeamGuard><HeicToJpg /></TeamGuard>} />
        <Route path="/banner-calculator" element={<TeamGuard><BannerCalculator /></TeamGuard>} />
        <Route path="/magazine-mockup" element={<TeamGuard><MagazineMockupDashboard /></TeamGuard>} />
        <Route path="/magazine-mockup/:id" element={<TeamGuard><MagazineMockupEditor /></TeamGuard>} />
        <Route path="/magazine-mockup/:id/preview" element={<TeamGuard><MagazineMockupPreview /></TeamGuard>} />

        {/* REDIRECT UNKNOWN TO HOME */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
