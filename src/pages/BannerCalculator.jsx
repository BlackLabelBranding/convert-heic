import React, { useMemo, useState } from 'react';

const MATERIALS = {
  '13oz Single-Sided': {
    label: '13oz Single-Sided',
    costSmall: 1.25,
    costLarge: 1.0,
    margin: 0.6,
  },
  '15oz Single-Sided': {
    label: '15oz Single-Sided',
    costSmall: 1.75,
    costLarge: 1.25,
    margin: 0.625,
  },
  '18oz Single-Sided': {
    label: '18oz Single-Sided',
    costSmall: 2.25,
    costLarge: 1.75,
    margin: 0.65,
  },
  '18oz Double-Sided': {
    label: '18oz Double-Sided',
    costSmall: 4.25,
    costLarge: 3.25,
    margin: 0.7,
  },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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

export default function BannerCalculator() {
  const [width, setWidth] = useState('5');
  const [height, setHeight] = useState('8');
  const [quantity, setQuantity] = useState('1');
  const [material, setMaterial] = useState('15oz Single-Sided');
  const [polePocketLf, setPolePocketLf] = useState('0');
  const [ropeLf, setRopeLf] = useState('0');
  const [windSlits, setWindSlits] = useState(false);
  const [rush, setRush] = useState(false);

  const calculations = useMemo(() => {
    const widthNum = parsePositive(width);
    const heightNum = parsePositive(height);
    const quantityNum = Math.max(1, Math.floor(parsePositive(quantity) || 1));
    const polePocketNum = parseNonNegative(polePocketLf);
    const ropeNum = parseNonNegative(ropeLf);

    const sqFtEach = widthNum * heightNum;
    const totalSqFt = sqFtEach * quantityNum;
    const tier = quantityNum >= 1000 ? '1000+' : '1-999';
    const materialConfig = MATERIALS[material];
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
    };
  }, [height, material, polePocketLf, quantity, ropeLf, rush, width, windSlits]);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="rounded-t-3xl bg-slate-900 px-6 py-5 text-white md:px-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-300">
            Black Label Tools
          </p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Banner Pricing Calculator
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Live pricing for banner quotes with material switching, quantity tiers,
                add-ons, and margin visibility.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
              <div className="text-slate-300">Active Pricing Tier</div>
              <div className="text-lg font-semibold text-white">
                {calculations.tier}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">Quote Inputs</h2>
              <p className="text-sm text-slate-500">
                Change dimensions, material, quantity, and finishing options.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Width (ft)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Height (ft)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Quantity
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Material
                </span>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                >
                  {Object.keys(MATERIALS).map((key) => (
                    <option key={key} value={key}>
                      {MATERIALS[key].label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Pole Pocket Linear Feet
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={polePocketLf}
                  onChange={(e) => setPolePocketLf(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Rope Linear Feet
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={ropeLf}
                  onChange={(e) => setRopeLf(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setWindSlits((prev) => !prev)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  windSlits
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-900'
                }`}
              >
                <div className="text-sm font-semibold">Wind Slits</div>
                <div className="mt-1 text-xs opacity-80">
                  Retail priced at $1.25 / sq ft
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRush((prev) => !prev)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  rush
                    ? 'border-amber-500 bg-amber-500 text-slate-950'
                    : 'border-slate-300 bg-white text-slate-900'
                }`}
              >
                <div className="text-sm font-semibold">Rush Turnaround</div>
                <div className="mt-1 text-xs opacity-80">
                  Adds 100% of subtotal retail
                </div>
              </button>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Order Metrics</h2>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div className="text-slate-500">Banner Sq Ft Each</div>
                <div className="text-right font-semibold text-slate-900">
                  {calculations.sqFtEach.toFixed(2)}
                </div>

                <div className="text-slate-500">Total Sq Ft</div>
                <div className="text-right font-semibold text-slate-900">
                  {calculations.totalSqFt.toFixed(2)}
                </div>

                <div className="text-slate-500">Base Cost / Sq Ft</div>
                <div className="text-right font-semibold text-slate-900">
                  {formatCurrency(calculations.baseCostPerSqFt)}
                </div>

                <div className="text-slate-500">Retail / Sq Ft</div>
                <div className="text-right font-semibold text-slate-900">
                  {formatCurrency(calculations.retailPerSqFt)}
                </div>

                <div className="text-slate-500">Base Material Cost</div>
                <div className="text-right font-semibold text-slate-900">
                  {formatCurrency(calculations.baseMaterialCost)}
                </div>

                <div className="text-slate-500">Retail Material Price</div>
                <div className="text-right font-semibold text-slate-900">
                  {formatCurrency(calculations.retailMaterialPrice)}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Add-Ons and Totals</h2>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div className="text-slate-500">Pole Pocket Retail</div>
                <div className="text-right font-semibold text-slate-900">
                  {formatCurrency(calculations.polePocketRetail)}
                </div>

                <div className="text-slate-500">Rope Retail</div>
                <div className="text-right font-semibold text-slate-900">
                  {formatCurrency(calculations.ropeRetail)}
                </div>

                <div className="text-slate-500">Wind Slits Retail</div>
                <div className="text-right font-semibold text-slate-900">
                  {formatCurrency(calculations.windSlitsRetail)}
                </div>

                <div className="text-slate-500">Rush Surcharge</div>
                <div className="text-right font-semibold text-slate-900">
                  {formatCurrency(calculations.rushSurcharge)}
                </div>

                <div className="col-span-2 my-1 h-px bg-slate-200" />

                <div className="text-slate-700">Total Retail</div>
                <div className="text-right text-lg font-bold text-slate-950">
                  {formatCurrency(calculations.totalRetail)}
                </div>

                <div className="text-slate-500">Unit Price</div>
                <div className="text-right font-semibold text-slate-900">
                  {formatCurrency(calculations.unitPrice)}
                </div>

                <div className="text-slate-500">Total Internal Cost</div>
                <div className="text-right font-semibold text-slate-900">
                  {formatCurrency(calculations.totalInternalCost)}
                </div>

                <div className="text-slate-500">Gross Profit</div>
                <div className="text-right font-semibold text-emerald-700">
                  {formatCurrency(calculations.grossProfit)}
                </div>

                <div className="text-slate-500">Gross Margin</div>
                <div className="text-right font-semibold text-emerald-700">
                  {formatPercent(calculations.grossMargin)}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
