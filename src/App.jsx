import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import HeicToJpg from "./pages/HeicToJpg";
import BannerCalculator from "./pages/BannerCalculator";
import MagazineMockupDashboard from "./pages/MagazineMockupDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/heic-to-jpg" element={<HeicToJpg />} />
        <Route path="/banner-calculator" element={<BannerCalculator />} />
        <Route path="/magazine-mockup" element={<MagazineMockupDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
