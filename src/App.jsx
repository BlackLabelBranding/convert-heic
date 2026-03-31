import React, { useState } from "react";
import { heicTo } from "heic-to";

export default function App() {
  const [files, setFiles] = useState([]);
  const [converted, setConverted] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  const processFiles = (fileList) => {
    const selected = Array.from(fileList).filter((file) =>
      /\.(heic|heif)$/i.test(file.name)
    );
    setFiles(selected);
    setConverted([]);
    setError("");
  };

  const handleFiles = (e) => processFiles(e.target.files);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  };

  const describeError = (err) => {
    try {
      if (!err) return "Unknown conversion error.";
      if (err instanceof Error) return err.message;
      if (typeof err === "string") return err;
      return JSON.stringify(err, Object.getOwnPropertyNames(err));
    } catch {
      return "Unknown conversion error.";
    }
  };

  const convertOneFile = async (file) => {
    const inputType =
      file.type && file.type !== ""
        ? file.type
        : /\.heif$/i.test(file.name)
        ? "image/heif"
        : "image/heic";

    const convertedBlob = await heicTo({
      blob: file,
      type: "image/jpeg",
      quality: 0.92,
    });

    const finalBlob = Array.isArray(convertedBlob)
      ? convertedBlob[0]
      : convertedBlob;

    if (!(finalBlob instanceof Blob)) {
      throw new Error("Converter did not return a valid file.");
    }

    return new File(
      [finalBlob],
      file.name.replace(/\.(heic|heif)$/i, ".jpg"),
      { type: "image/jpeg" }
    );
  };

  const convertImages = async () => {
    if (!files.length) return;

    setLoading(true);
    setConverted([]);
    setError("");

    const results = [];
    const failures = [];

    for (const file of files) {
      try {
        const jpgFile = await convertOneFile(file);
        const url = URL.createObjectURL(jpgFile);

        results.push({
          name: jpgFile.name,
          url,
        });
      } catch (err) {
        const msg = describeError(err);
        console.error("Conversion failed for", file.name, err, msg);
        failures.push(`${file.name}: ${msg}`);
      }
    }

    setConverted(results);

    if (failures.length) {
      setError(
        `Some files failed to convert.\n${failures.join("\n")}\n\nBest results usually come from a standard still HEIC photo, not a Live Photo export.`
      );
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <img
        src="https://xopcttkrmjvwdddawdaa.supabase.co/storage/v1/object/public/Logos/blacklabellogoog.png"
        alt="Black Label Branding Logo"
        style={styles.logo}
      />

      <h1 style={styles.title}>Black Label Branding .HEIC to JPG Tool</h1>

      <div
        style={{
          ...styles.dropZone,
          ...(dragActive ? styles.dropZoneActive : {}),
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p style={styles.dropText}>Drag and drop your HEIC or HEIF files here</p>
        <p style={styles.orText}>or</p>

        <label style={styles.uploadLabel}>
          Choose Files
          <input
            type="file"
            multiple
            accept=".heic,.heif"
            onChange={handleFiles}
            style={styles.hiddenInput}
          />
        </label>

        {files.length > 0 && (
          <p style={styles.fileCount}>{files.length} file(s) ready to convert</p>
        )}
      </div>

      <button
        onClick={convertImages}
        style={styles.button}
        disabled={loading || files.length === 0}
      >
        {loading ? "Converting..." : "Convert Images"}
      </button>

      {error && <pre style={styles.error}>{error}</pre>}

      <div style={styles.results}>
        {converted.map((file, i) => (
          <div key={i} style={styles.card}>
            <p style={styles.fileName}>{file.name}</p>
            <a href={file.url} download={file.name} style={styles.downloadLink}>
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
    padding: "40px 20px",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
  },
  logo: {
    display: "block",
    margin: "0 auto 20px auto",
    maxWidth: "220px",
    width: "100%",
    height: "auto",
  },
  title: {
    fontSize: "32px",
    marginBottom: "30px",
  },
  dropZone: {
    maxWidth: "700px",
    margin: "0 auto 25px auto",
    padding: "50px 20px",
    border: "2px dashed #39ff14",
    borderRadius: "16px",
    background: "#111",
    transition: "0.2s ease",
  },
  dropZoneActive: {
    background: "#1a1a1a",
    borderColor: "#ffffff",
  },
  dropText: {
    fontSize: "20px",
    marginBottom: "10px",
  },
  orText: {
    fontSize: "14px",
    opacity: 0.8,
    marginBottom: "18px",
  },
  uploadLabel: {
    display: "inline-block",
    padding: "12px 24px",
    background: "#39ff14",
    color: "#000",
    fontWeight: "bold",
    borderRadius: "8px",
    cursor: "pointer",
  },
  hiddenInput: {
    display: "none",
  },
  fileCount: {
    marginTop: "18px",
    fontSize: "14px",
    color: "#ccc",
  },
  button: {
    padding: "12px 28px",
    background: "#39ff14",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
    marginTop: "10px",
  },
  error: {
    color: "#ff6b6b",
    marginTop: "20px",
    whiteSpace: "pre-wrap",
    maxWidth: "800px",
    marginLeft: "auto",
    marginRight: "auto",
    textAlign: "left",
  },
  results: {
    marginTop: "35px",
    maxWidth: "700px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  card: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "12px",
  },
  fileName: {
    marginBottom: "10px",
  },
  downloadLink: {
    color: "#39ff14",
    textDecoration: "none",
    fontWeight: "bold",
  },
};
