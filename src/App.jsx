import React, { useState } from "react";
import heic2any from "heic2any";

export default function App() {
  const [files, setFiles] = useState([]);
  const [converted, setConverted] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
  };

  const convertImages = async () => {
    setLoading(true);
    let results = [];

    for (let file of files) {
      try {
        const blob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.9,
        });

        const url = URL.createObjectURL(blob);

        results.push({
          name: file.name.replace(/\.(heic|heif)$/i, ".jpg"),
          url,
        });
      } catch (err) {
        console.error("Conversion failed:", err);
      }
    }

    setConverted(results);
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Convert HEIC to JPG</h1>

      <input
        type="file"
        multiple
        accept=".heic,.heif"
        onChange={handleFiles}
        style={styles.input}
      />

      <button onClick={convertImages} style={styles.button}>
        {loading ? "Converting..." : "Convert Images"}
      </button>

      <div style={styles.results}>
        {converted.map((file, i) => (
          <div key={i} style={styles.card}>
            <p>{file.name}</p>
            <a href={file.url} download={file.name}>
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#000",
    color: "#fff",
    minHeight: "100vh",
    padding: "40px",
    textAlign: "center",
    fontFamily: "sans-serif",
  },
  title: {
    fontSize: "32px",
    marginBottom: "20px",
  },
  input: {
    marginBottom: "20px",
  },
  button: {
    padding: "10px 20px",
    background: "#39ff14",
    color: "#000",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  results: {
    marginTop: "30px",
  },
  card: {
    marginBottom: "10px",
  },
};
