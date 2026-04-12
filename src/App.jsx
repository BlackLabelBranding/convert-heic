import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// NOTE: If your folder on GitHub is named "Components", 
// change the lowercase "c" below to uppercase "C"
import Header from "./components/Header";

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
