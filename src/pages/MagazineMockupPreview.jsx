import React from "react";
import { useParams } from "react-router-dom";

export default function MagazineMockupPreview() {
  const { id } = useParams();

  const data = JSON.parse(localStorage.getItem("blb_magazine_mockup_projects") || "[]");
  const project = data.find(p => p.id === id);

  console.log("PROJECT DATA:", project);

  if (!project) return <div>NO PROJECT</div>;

  return (
    <div style={{ color: "white", padding: "40px" }}>
      <h1>{project.title}</h1>

      {project.pages.map((p, i) => (
        <div key={i} style={{ marginBottom: "40px" }}>
          <div>Page {p.page_number}</div>
          <div>Image: {p.image ? "YES" : "NO"}</div>
          {p.image && (
            <img src={p.image} style={{ maxWidth: "300px" }} />
          )}
        </div>
      ))}
    </div>
  );
}
