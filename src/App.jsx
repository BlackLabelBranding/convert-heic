import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

/**
 * VERCEL FIX: 
 * If the build fails again, look at your GitHub file list.
 * If the folder starts with a lowercase 'c', change 'Components' below to 'components'.
 */
import Header from "./Components/Header";

import Home from "./pages/Home";
import HeicToJpg from "./pages/HeicToJpg";
import BannerCalculator from "./pages/BannerCalculator";
import MagazineMockupDashboard from "./pages/MagazineMockupDashboard";
import MagazineMockupEditor from "./pages/MagazineMockupEditor";
import MagazineMockupPreview from "./pages/MagazineMockupPreview";
import PublicMockupViewer from "./pages/PublicMockupViewer";

export default function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/heic-to-jpg" element={<HeicToJpg />} />
        <Route path="/banner-calculator" element={<BannerCalculator />} />
        <Route path="/magazine-mockup" element={<MagazineMockupDashboard />} />
        <Route path="/magazine-mockup/:id" element={<MagazineMockupEditor />} />
        <Route path="/magazine-mockup/:id/preview" element={<MagazineMockupPreview />} />
        <Route path="/m/:token" element={<PublicMockupViewer />} />
      </Routes>
    </BrowserRouter>
  );
}
