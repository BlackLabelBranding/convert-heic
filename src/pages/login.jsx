import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/customSupabaseClient"; // Adjust path as needed

import Header from "./components/Header";
import Home from "./pages/Home";
import HeicToJpg from "./pages/HeicToJpg";
import BannerCalculator from "./pages/BannerCalculator";
import MagazineMockupDashboard from "./pages/MagazineMockupDashboard";
import MagazineMockupEditor from "./pages/MagazineMockupEditor";
import MagazineMockupPreview from "./pages/MagazineMockupPreview";
import PublicMockupViewer from "./pages/PublicMockupViewer";

// --- TEAM SECURITY GUARD ---
function TeamGuard({ children }) {
  const [status, setStatus] = useState("loading"); // loading, authorized, unauthorized
  const location = useLocation();

  useEffect(() => {
    async function checkAccess() {
      // 1. Get the current logged-in user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setStatus("unauthorized");
        return;
      }

      // 2. Check if they exist in your team_members table
      // Assuming the column is named 'id' or 'user_id'
      const { data: member, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("id", user.id) // CHANGE 'id' to 'user_id' if that is your column name
        .single();

      if (member && !error) {
        setStatus("authorized");
      } else {
        setStatus("unauthorized");
      }
    }

    checkAccess();
  }, []);

  if (status === "loading") {
    return <div style={{ padding: "50px", color: "#39ff14", textAlign: "center" }}>Verifying Team Access...</div>;
  }

  if (status === "unauthorized") {
    // If not a team member, send them back to the Home page
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        {/* PUBLICLY ACCESSIBLE ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/m/:token" element={<PublicMockupViewer />} />

        {/* PROTECTED TEAM ROUTES */}
        {/* Anything inside <TeamGuard> requires a login found in the team_members table */}
        <Route path="/heic-to-jpg" element={<TeamGuard><HeicToJpg /></TeamGuard>} />
        <Route path="/banner-calculator" element={<TeamGuard><BannerCalculator /></TeamGuard>} />
        <Route path="/magazine-mockup" element={<TeamGuard><MagazineMockupDashboard /></TeamGuard>} />
        <Route path="/magazine-mockup/:id" element={<TeamGuard><MagazineMockupEditor /></TeamGuard>} />
        <Route path="/magazine-mockup/:id/preview" element={<TeamGuard><MagazineMockupPreview /></TeamGuard>} />

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
