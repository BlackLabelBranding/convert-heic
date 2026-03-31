import React, { useState } from "react";
import { heicTo } from "heic-to";
import JSZip from "jszip";

export default function App() {
  const [files, setFiles] = useState([]);
  const [converted, setConverted] = useState([]);
  const [loading, setLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  const tools = [
    { name: "HEIC to JPG", href: "#", active: true },
    { name: "Image Resize", href: "#", active: false },
    { name: "PDF Tools", href: "#", active: false },
    { name: "Background Remove", href: "#", active: false },
    { name: "More Tools", href: "#", active: false },
  ];

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

    const finalName = file.name.replace(/\.(heic|heif)$/i, ".jpg");

    return {
      name: finalName,
      blob: finalBlob,
      url: URL.createObjectURL(finalBlob),
    };
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
        const convertedFile = await convertOneFile(file);
        results.push(convertedFile);
      } catch (err) {
        const msg = describeError(err);
        console.error("Conversion failed for", file.name, err, msg);
        failures.push(`${file.name}: ${msg}`);
      }
    }

    setConverted(results);

    if (failures.length) {
      setError(
        `Some files failed to convert.\n${failures.join(
          "\n"
        )}\n\nWorks best with standard still HEIC photos and Chrome desktop.`
      );
    }

    setLoading(false);
  };

  const downloadAllAsZip = async () => {
    if (!converted.length) return;

    setZipLoading(true);

    try {
      const zip = new JSZip();

      converted.forEach((file) => {
        zip.file(file.name, file.blob);
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);

      const link = document.createElement("a");
      link.href = zipUrl;
      link.download = "black-label-heic-converted-images.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(zipUrl);
    } catch (err) {
      console.error("ZIP creation failed", err);
      setError("Failed to create ZIP download.");
    }

    setZipLoading(false);
  };

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.navBrand}>Black Label Tools</div>
        <div style={styles.navLinks}>
          {tools.map((tool) => (
            <a
              key={tool.name}
              href={tool.href}
              style={{
                ...styles.navLink,
                ...(tool.active ? styles.navLinkActive : {}),
              }}
            >
              {tool.name}
            </a>
          ))}
        </div>
      </nav>

      <div style={styles.container}>
        <img
          src="https://xopcttkrmjvwdddawdaa.supabase.co/storage/v1/object/public/Logos/blacklabellogoog.png"
          alt="Black Label Branding"
          style={styles.logo}
        />

        <img
          src="https://xopcttkrmjvwdddawdaa.supabase.co/storage/v1/object/public/Logos/HEICtoJPEG.png"
          alt="HEIC to JPG Tool Icon"
          style={styles.toolIcon}
        />

        <h1 style={styles.title}>Black Label Branding .HEIC to JPG Tool</h1>
        <p style={styles.subtitle}>
          Convert iPhone HEIC and HEIF images into JPG files instantly.
        </p>

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

        <div style={styles.buttonRow}>
          <button
            onClick={convertImages}
            style={styles.button}
            disabled={loading || files.length === 0}
          >
            {loading ? "Converting..." : "Convert Images"}
          </button>

          <button
            onClick={downloadAllAsZip}
            style={{
              ...styles.secondaryButton,
              ...(converted.length === 0 || zipLoading ? styles.disabledButton : {}),
            }}
            disabled={converted.length === 0 || zipLoading}
          >
            {zipLoading ? "Creating ZIP..." : "Download All as ZIP"}
          </button>
        </div>

        {error && <pre style={styles.error}>{error}</pre>}

        <div style={styles.results}>
          {converted.map((file, i) => (
            <div key={i} style={styles.card}>
              <div>
                <p style={styles.fileName}>{file.name}</p>
              </div>
              <a href={file.url} download={file.name} style={styles.downloadLink}>
                Download
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#000",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
  },
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "18px 24px",
    borderBottom: "1px solid #1f1f1f",
    background: "rgba(0,0,0,0.92)",
    backdropFilter: "blur(10px)",
  },
  navBrand: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#39ff14",
    whiteSpace: "nowrap",
  },
  navLinks: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  navLink: {
    color: "#ccc",
    textDecoration: "none",
    padding: "8px 14px",
    borderRadius: "999px",
    border: "1px solid #222",
    background: "#111",
    fontSize: "14px",
    transition: "0.2s ease",
  },
  navLinkActive: {
    color: "#000",
    background: "#39ff14",
    border: "1px solid #39ff14",
    fontWeight: "bold",
  },
  container: {
    maxWidth: "980px",
    margin: "0 auto",
    padding: "40px 20px 60px",
    textAlign: "center",
  },
  logo: {
    display: "block",
    margin: "0 auto 18px auto",
    maxWidth: "220px",
    width: "100%",
    height: "auto",
  },
  toolIcon: {
    display: "block",
    margin: "0 auto 18px auto",
    width: "110px",
    height: "110px",
    borderRadius: "24px",
    boxShadow: "0 0 24px rgba(57,255,20,0.2)",
  },
  title: {
    fontSize: "34px",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#b3b3b3",
    marginBottom: "30px",
    fontSize: "16px",
  },
  dropZone: {
    maxWidth: "760px",
    margin: "0 auto 25px auto",
    padding: "50px 20px",
    border: "2px dashed #39ff14",
    borderRadius: "20px",
    background: "#111",
    transition: "0.2s ease",
  },
  dropZoneActive: {
    background: "#181818",
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
    borderRadius: "10px",
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
  buttonRow: {
    display: "flex",
    justifyContent: "center",
    gap: "14px",
    flexWrap: "wrap",
    marginTop: "10px",
  },
  button: {
    padding: "12px 28px",
    background: "#39ff14",
    color: "#000",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
  },
  secondaryButton: {
    padding: "12px 28px",
    background: "#111",
    color: "#fff",
    border: "1px solid #39ff14",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
  },
  disabledButton: {
    opacity: 0.45,
    cursor: "not-allowed",
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
    maxWidth: "760px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  card: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  fileName: {
    margin: 0,
    textAlign: "left",
    wordBreak: "break-word",
  },
  downloadLink: {
    color: "#39ff14",
    textDecoration: "none",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
};
