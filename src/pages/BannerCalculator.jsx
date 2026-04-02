import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function BannerCalculator() {
  const [width, setWidth] = useState("5");
  const [height, setHeight] = useState("8");
  const [quantity, setQuantity] = useState("1");
  const [materialWeight, setMaterialWeight] = useState("15oz");
  const [printType, setPrintType] = useState("Single-Sided");
  const [polePocketLf, setPolePocketLf] = useState("0");
  const [ropeLf, setRopeLf] = useState("0");
  const [windSlits, setWindSlits] = useState(false);
  const [rush, setRush] = useState(false);

  const tools = [
    { name: "Home", href: "/", active: false },
    { name: "HEIC to JPG", href: "/heic-to-jpg", active: false },
    { name: "Banner Calculator", href: "/banner-calculator", active: true },
    { name: "Image Resize", href: "#", active: false, disabled: true },
    { name: "PDF Tools", href: "#", active: false, disabled: true },
    { name: "Background Remove", href: "#", active: false, disabled: true },
  ];

  const materials = {
    "13oz": {
      label: "13oz Standard",
      options: {
        "Single-Sided": {
          costSmall: 1.25,
          costLarge: 1.0,
          margin: 0.6,
        },
      },
    },
    "15oz": {
      label: "15oz Recommended",
      options: {
        "Single-Sided": {
          costSmall: 1.75,
          costLarge: 1.25,
          margin: 0.625,
        },
      },
    },
    "18oz": {
      label: "18oz Heavy Duty",
      options: {
        "Single-Sided": {
          costSmall: 2.25,
          costLarge: 1.75,
          margin: 0.65,
        },
        "Double-Sided": {
          costSmall: 4.25,
          costLarge: 3.25,
          margin: 0.7,
        },
      },
    },
  };

  const availablePrintTypes = Object.keys(materials[materialWeight].options);

  useEffect(() => {
    if (!availablePrintTypes.includes(printType)) {
      setPrintType(availablePrintTypes[0]);
    }
  }, [materialWeight, printType, availablePrintTypes]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);

  const formatPercent = (value) => `${(value * 100).toFixed(1)}%`;

  const parsePositive = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  const parseNonNegative = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };

  const calculations = useMemo(() => {
    const widthNum = parsePositive(width);
    const heightNum = parsePositive(height);
    const quantityNum = Math.max(1, Math.floor(parsePositive(quantity) || 1));
    const polePocketNum = parseNonNegative(polePocketLf);
    const ropeNum = parseNonNegative(ropeLf);

    const sqFtEach = widthNum * heightNum;
    const totalSqFt = sqFtEach * quantityNum;
    const tier = quantityNum >= 1000 ? "1000+" : "1-999";

    const materialConfig = materials[materialWeight].options[printType];
    const baseCostPerSqFt =
      quantityNum >= 1000 ? materialConfig.costLarge : materialConfig.costSmall;
    const retailPerSqFt = baseCostPerSqFt / (1 - materialConfig.margin);

    const baseMaterialCost = totalSqFt * baseCostPerSqFt;
    const retailMaterialPrice = totalSqFt * retailPerSqFt;

    const polePocketCost = polePocketNum > 0 ? polePocketNum * 1 + 10 : 0;
    const polePocketRetail = polePocketNum > 0 ? polePocketNum * 3.5 + 10 : 0;

    const ropeCost = ropeNum * 1;
    const ropeRetail = ropeNum * 3;

    const windSlitsCost = windSlits ? totalSqFt * 0.5 : 0;
    const windSlitsRetail = windSlits ? totalSqFt * 1.25 : 0;

    const subtotalCost =
      baseMaterialCost + polePocketCost + ropeCost + windSlitsCost;
    const subtotalRetail =
      retailMaterialPrice + polePocketRetail + ropeRetail + windSlitsRetail;

    const rushSurcharge = rush ? subtotalRetail : 0;
    const totalRetail = subtotalRetail + rushSurcharge;
    const totalInternalCost = subtotalCost;
    const grossProfit = totalRetail - totalInternalCost;
    const grossMargin = totalRetail > 0 ? grossProfit / totalRetail : 0;
    const unitPrice = quantityNum > 0 ? totalRetail / quantityNum : 0;

    return {
      quantityNum,
      sqFtEach,
      totalSqFt,
      tier,
      baseCostPerSqFt,
      retailPerSqFt,
      baseMaterialCost,
      retailMaterialPrice,
      polePocketRetail,
      ropeRetail,
      windSlitsRetail,
      rushSurcharge,
      totalRetail,
      totalInternalCost,
      grossProfit,
      grossMargin,
      unitPrice,
      selectedLabel: `${materialWeight} ${printType}`,
    };
  }, [
    width,
    height,
    quantity,
    materialWeight,
    printType,
    polePocketLf,
    ropeLf,
    windSlits,
    rush,
  ]);

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.navBrand}>Black Label Tools</div>
        <div style={styles.navLinks}>
          {tools.map((tool) =>
            tool.disabled ? (
              <span
                key={tool.name}
                style={{
                  ...styles.navLink,
                  ...(tool.active ? styles.navLinkActive : {}),
                  ...styles.navLinkDisabled,
                }}
              >
                {tool.name}
              </span>
            ) : (
              <Link
                key={tool.name}
                to={tool.href}
                style={{
                  ...styles.navLink,
                  ...(tool.active ? styles.navLinkActive : {}),
                }}
              >
                {tool.name}
              </Link>
            )
          )}
        </div>
      </nav>

      <div style={styles.container}>
        <img
          src="https://xopcttkrmjvwdddawdaa.supabase.co/storage/v1/object/public/Logos/blacklabellogoog.png"
          alt="Black Label Branding"
          style={styles.logo}
        />

        <h1 style={styles.title}>Black Label Banner Calculator</h1>
        <p style={styles.subtitle}>
          Live pricing for banner quotes with material weight, print type,
          quantity tiers, add-ons, rush pricing, and margin visibility.
        </p>

        <div style={styles.calculatorGrid}>
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Quote Inputs</h2>

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Width (ft)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Height (ft)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Quantity</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Material Weight</label>
                <select
                  value={materialWeight}
                  onChange={(e) => setMaterialWeight(e.target.value)}
                  style={styles.input}
                >
                  {Object.keys(materials).map((key) => (
                    <option key={key} value={key}>
                      {materials[key].label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Print Type</label>
                <select
                  value={printType}
                  onChange={(e) => setPrintType(e.target.value)}
                  style={styles.input}
                >
                  {availablePrintTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Selected Material</label>
                <div style={styles.readOnlyBox}>{calculations.selectedLabel}</div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Pole Pocket Linear Feet</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={polePocketLf}
                  onChange={(e) => setPolePocketLf(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Rope Linear Feet</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={ropeLf}
                  onChange={(e) => setRopeLf(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.toggleRow}>
              <button
                type="button"
                onClick={() => setWindSlits(!windSlits)}
                style={{
                  ...styles.toggleButton,
                  ...(windSlits ? styles.toggleButtonActive : {}),
                }}
              >
                Wind Slits
                <span style={styles.toggleSubtext}>Retail: $1.25 / sq ft</span>
              </button>

              <button
                type="button"
                onClick={() => setRush(!rush)}
                style={{
                  ...styles.toggleButton,
                  ...(rush ? styles.toggleButtonRush : {}),
                }}
              >
                Rush
                <span style={styles.toggleSubtext}>
                  Adds 100% of subtotal retail
                </span>
              </button>
            </div>
          </div>

          <div style={styles.summaryColumn}>
            <div style={styles.panel}>
              <h2 style={styles.panelTitle}>Order Metrics</h2>

              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Selected Material</span>
                <span style={styles.metricValue}>{calculations.selectedLabel}</span>
              </div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Active Pricing Tier</span>
                <span style={styles.metricValue}>{calculations.tier}</span>
              </div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Banner Sq Ft Each</span>
                <span style={styles.metricValue}>
                  {calculations.sqFtEach.toFixed(2)}
                </span>
              </div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Total Sq Ft</span>
                <span style={styles.metricValue}>
                  {calculations.totalSqFt.toFixed(2)}
                </span>
              </div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Base Cost / Sq Ft</span>
                <span style={styles.metricValue}>
                  {formatCurrency(calculations.baseCostPerSqFt)}
                </span>
              </div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Retail / Sq Ft</span>
                <span style={styles.metricValue}>
                  {formatCurrency(calculations.retailPerSqFt)}
                </span>
              </div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Base Material Cost</span>
                <span style={styles.metricValue}>
                  {formatCurrency(calculations.baseMaterialCost)}
                </span>
              </div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Retail Material Price</span>
                <span style={styles.metricValue}>
                  {formatCurrency(calculations.retailMaterialPrice)}
                </span>
              </div>
            </div>

            <div style={styles.panel}>
              <h2 style={styles.panelTitle}>Totals</h2>

              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Pole Pocket Retail</span>
                <span style={styles.metricValue}>
                  {formatCurrency(calculations.polePocketRetail)}
                </span>
              </div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Rope Retail</span>
                <span style={styles.metricValue}>
                  {formatCurrency(calculations.ropeRetail)}
                </span>
              </div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Wind Slits Retail</span>
                <span style={styles.metricValue}>
                  {formatCurrency(calculations.windSlitsRetail)}
                </span>
              </div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Rush Surcharge</span>
                <span style={styles.metricValue}>
                  {formatCurrency(calculations.rushSurcharge)}
                </span>
              </div>

              <div style={styles.divider} />

              <div style={styles.metricRow}>
                <span style={styles.totalLabel}>Total Retail</span>
                <span style={styles.totalValue}>
                  {formatCurrency(calculations.totalRetail)}
                </span>
              </div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Unit Price</span>
                <span style={styles.metricValue}>
                  {formatCurrency(calculations.unitPrice)}
                </span>
              </div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Total Internal Cost</span>
                <span style={styles.metricValue}>
                  {formatCurrency(calculations.totalInternalCost)}
                </span>
              </div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Gross Profit</span>
                <span style={styles.profitValue}>
                  {formatCurrency(calculations.grossProfit)}
                </span>
              </div>
              <div style={styles.metricRow}>
                <span style={styles.metricLabel}>Gross Margin</span>
                <span style={styles.profitValue}>
                  {formatPercent(calculations.grossMargin)}
                </span>
              </div>
            </div>
          </div>
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
  navLinkDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  container: {
    maxWidth: "1180px",
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
  title: {
    fontSize: "34px",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#b3b3b3",
    marginBottom: "30px",
    fontSize: "16px",
    maxWidth: "760px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  calculatorGrid: {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: "20px",
    alignItems: "start",
  },
  panel: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "20px",
    padding: "24px",
    textAlign: "left",
  },
  panelTitle: {
    fontSize: "22px",
    marginTop: 0,
    marginBottom: "20px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "14px",
    color: "#ccc",
    marginBottom: "8px",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #333",
    background: "#000",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
  },
  readOnlyBox: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #333",
    background: "#0a0a0a",
    color: "#39ff14",
    fontSize: "15px",
    minHeight: "47px",
    display: "flex",
    alignItems: "center",
    fontWeight: "bold",
  },
  toggleRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
    marginTop: "18px",
  },
  toggleButton: {
    background: "#000",
    color: "#fff",
    border: "1px solid #333",
    borderRadius: "14px",
    padding: "14px",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: "bold",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  toggleButtonActive: {
    background: "#39ff14",
    color: "#000",
    border: "1px solid #39ff14",
  },
  toggleButtonRush: {
    background: "#facc15",
    color: "#000",
    border: "1px solid #facc15",
  },
  toggleSubtext: {
    fontWeight: "normal",
    fontSize: "12px",
    opacity: 0.8,
  },
  summaryColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  metricRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #1e1e1e",
  },
  metricLabel: {
    color: "#b3b3b3",
    fontSize: "14px",
  },
  metricValue: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: "15px",
    textAlign: "right",
  },
  divider: {
    height: "1px",
    background: "#333",
    margin: "12px 0",
  },
  totalLabel: {
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
  },
  totalValue: {
    color: "#39ff14",
    fontSize: "22px",
    fontWeight: "bold",
  },
  profitValue: {
    color: "#39ff14",
    fontWeight: "bold",
    fontSize: "15px",
    textAlign: "right",
  },
};
