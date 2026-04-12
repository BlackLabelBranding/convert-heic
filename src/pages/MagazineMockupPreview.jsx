import React from "react";
import { useParams } from "react-router-dom";

export default function MagazineMockupPreview() {
  const { id } = useParams();

  const data = JSON.parse(localStorage.getItem("blb_magazine_mockup_projects") || "[]");
  const project = data.find((p) => p.id === id);

  if (!project) {
    return <div style={{ color: "white", padding: 40 }}>NO PROJECT</div>;
  }

  return (
    <div style={{ color: "white", padding: 40, background: "#000", minHeight: "100vh" }}>
      <h1>{project.title}</h1>

      {project.pages.map((p) => (
        <div key={p.id} style={{ marginBottom: 40 }}>
          <div>Page {p.page_number}</div>
          <div>Type: {p.page_type}</div>
          <div>Image saved: {p.image ? "YES" : "NO"}</div>
          <div style={{ fontSize: 12, color: "#aaa", marginBottom: 10 }}>
            {p.image ? String(p.image).slice(0, 120) : "No image value"}
          </div>
          {p.image ? (
            <img src={p.image} alt="" style={{ maxWidth: 300, border: "1px solid #444" }} />
          ) : null}
        </div>
      ))}
    </div>
  );
}
