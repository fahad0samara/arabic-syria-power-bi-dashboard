import { useMemo, useRef, useState } from "react";
import {
  Banknote,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Download,
  Globe2,
  HeartPulse,
  Info,
  LayoutDashboard,
  Palette,
  RotateCcw,
  Ruler,
  Tent,
  TrendingDown,
  Users,
  X,
} from "lucide-react";
import {
  AGE_GROUPS,
  GDP_SERIES,
  GOVERNORATES,
  INFLATION_SERIES,
  REGIONS,
  SIZE_CATS,
  SOURCES,
  TIMELINE,
  TOTAL_AREA,
  TOTAL_IDPS,
  TOTAL_POP,
  TOTAL_POP_2011,
  density,
  exportGovernoratesCSV,
  exportTimelineCSV,
  fmtNum,
  fmtPct,
  fmtPop,
  fmtShort,
  fmtSigned,
  gdpPerCapita,
  generatePowerBIThemeJSON,
  idpShare,
  popChange,
  sizeOf,
  type Governorate,
  type SizeCat,
} from "./data/syria";
import {
  Columns,
  Donut,
  GroupedBars,
  HBars,
  LineChart,
  StackedBar,
  SyriaMap,
  divergingColor,
  scaleColor,
} from "./components/charts";

type Page = "overview" | "economy" | "health" | "dax";
type Metric = "popTotal" | "idps" | "density" | "popChange";

const NAV: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "economy", label: "الأداء الاقتصادي", icon: Banknote },
  { id: "health", label: "الصحة والسكان", icon: HeartPulse },
  { id: "dax", label: "Power BI و DAX", icon: Code2 },
];

const METRICS: {
  id: Metric;
  label: string;
  get: (g: Governorate) => number;
  fmt: (v: number) => string;
}[] = [
  { id: "popTotal", label: "عدد السكان", get: (g) => g.popTotal, fmt: (v) => fmtPop(v) },
  { id: "idps", label: "النازحون داخلياً", get: (g) => g.idps, fmt: (v) => fmtPop(v) },
  { id: "density", label: "الكثافة السكانية", get: (g) => density(g), fmt: (v) => `${fmtNum(v)} /كم²` },
  { id: "popChange", label: "التغير منذ 2011", get: (g) => popChange(g), fmt: (v) => fmtSigned(v) },
];

const DAX = [
  {
    name: "Total Population",
    desc: "إجمالي السكان حسب OCHA — لا تخلطه بتقدير البنك الدولي للسكان",
    code: `Total Population = SUM ( Governorates[Total_Population_OCHA] )`,
  },
  {
    name: "Population Density",
    desc: "مجموع السكان ÷ مجموع المساحة — وليس متوسط النسب",
    code: `Population Density =
DIVIDE (
    SUM ( Governorates[Total_Population_OCHA] ),
    SUM ( Governorates[Area_Km2] )
)`,
  },
  {
    name: "Population Share %",
    desc: "حصة المحافظة من الإجمالي، مع تجاهل فلتر المحافظة في المقام",
    code: `Population Share % =
DIVIDE (
    [Total Population],
    CALCULATE ( [Total Population], REMOVEFILTERS ( Governorates ) )
)`,
  },
  {
    name: "IDP Share %",
    desc: "نسبة النازحين داخلياً من سكان النطاق المحدد",
    code: `IDP Share % =
DIVIDE (
    SUM ( Governorates[IDPs_OCHA] ),
    [Total Population]
)`,
  },
  {
    name: "Population Change vs 2011 %",
    desc: "التغير بين تقدير المكتب المركزي 2011 وتقدير OCHA",
    code: `Population Change vs 2011 % =
VAR Base = SUM ( Governorates[Population_2011_CBS] )
RETURN DIVIDE ( [Total Population] - Base, Base )`,
  },
  {
    name: "Size Category",
    desc: "عمود محسوب: كبيرة > 2 مليون، متوسطة ≥ 1 مليون، وإلا صغيرة",
    code: `Size Category =
SWITCH (
    TRUE (),
    Governorates[Total_Population_OCHA] > 2000000, "كبيرة",
    Governorates[Total_Population_OCHA] >= 1000000, "متوسطة",
    "صغيرة"
)`,
  },
  {
    name: "Top Governorate",
    desc: "اسم المحافظة الأعلى سكاناً ضمن التصفية الحالية",
    code: `Top Governorate =
VAR T = TOPN ( 1, ALLSELECTED ( Governorates ), [Total Population], DESC )
RETURN CONCATENATEX ( T, Governorates[Governorate_AR], "، " )`,
  },
];

/* -------------------------------- مكوّنات -------------------------------- */

function SourceTag({ text }: { text: string }) {
  return (
    <span className="inline-block shrink-0 rounded bg-[#1d4f48]/8 px-1.5 py-0.5 text-[9.5px] font-semibold text-[#1d4f48]/70">
      {text}
    </span>
  );
}

function Kpi({
  icon: Icon,
  title,
  value,
  sub,
  source,
}: {
  icon: typeof Users;
  title: string;
  value: string;
  sub: string;
  source: string;
}) {
  return (
    <div className="card flex min-h-[112px] flex-col justify-between p-3.5">
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 h-7 w-7 shrink-0 text-[#2a6f67]" strokeWidth={1.7} />
        <div className="min-w-0">
          <div className="text-[11.5px] font-semibold leading-tight text-[#1d4f48]/75">{title}</div>
          <div className="truncate text-[21px] font-bold leading-snug" dir="auto">
            {value}
          </div>
        </div>
      </div>
      <div className="mt-2 border-t border-[#1d4f48]/10 pt-1.5 text-[11px] text-[#1d4f48]/75">
        <div className="text-center" dir="auto">
          {sub}
        </div>
        <div className="mt-1 text-center">
          <SourceTag text={source} />
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  sub,
  source,
  children,
  className = "",
}: {
  title: string;
  sub?: string;
  source: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card p-4 ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[14.5px] font-bold leading-tight">{title}</h3>
          {sub && <p className="mt-0.5 text-[11.5px] text-[#1d4f48]/70">{sub}</p>}
        </div>
        <SourceTag text={source} />
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-[#f5ede2] p-2.5">
      <div className="text-[11px] text-[#1d4f48]/70">{label}</div>
      <div className="text-[17px] font-bold leading-snug tabular-nums" dir="auto">
        {value}
      </div>
      <div className="text-[10.5px] text-[#1d4f48]/70" dir="auto">
        {sub}
      </div>
    </div>
  );
}

function Insight({ value, label, source }: { value: string; label: string; source: string }) {
  return (
    <div className="card p-3">
      <div className="text-[20px] font-bold tabular-nums" dir="auto">
        {value}
      </div>
      <div className="text-[11.5px] text-[#1d4f48]/75">{label}</div>
      <div className="mt-1">
        <SourceTag text={source} />
      </div>
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-[#e0b252] bg-[#e0b252]/25 px-2.5 py-1 font-semibold text-[#6b4c0d]">
      {label}
      <button onClick={onClear} className="cursor-pointer leading-none hover:text-red-700" aria-label={`إزالة ${label}`}>
        ×
      </button>
    </span>
  );
}

/* -------------------------------- التطبيق -------------------------------- */

export default function App() {
  const [page, setPage] = useState<Page>("overview");
  const [region, setRegion] = useState("الكل");
  const [gov, setGov] = useState("الكل");
  const [sizes, setSizes] = useState<SizeCat[]>([]);
  const [metric, setMetric] = useState<Metric>("popTotal");
  const [range, setRange] = useState<"all" | "recent">("all");
  const [copied, setCopied] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number>(0);

  const notify = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  };

  const govOptions = useMemo(
    () => GOVERNORATES.filter((g) => region === "الكل" || g.region === region),
    [region]
  );

  const filtered = useMemo(
    () =>
      GOVERNORATES.filter(
        (g) =>
          (region === "الكل" || g.region === region) &&
          (gov === "الكل" || g.name === gov) &&
          (sizes.length === 0 || sizes.includes(sizeOf(g)))
      ),
    [region, gov, sizes]
  );

  const activeIds = useMemo(() => new Set(filtered.map((g) => g.id)), [filtered]);
  const hasFilter = region !== "الكل" || gov !== "الكل" || sizes.length > 0;
  const selectedId = GOVERNORATES.find((g) => g.name === gov)?.id ?? "";
  const detailGov = gov !== "الكل" ? GOVERNORATES.find((g) => g.name === gov) : undefined;

  const reset = () => {
    setRegion("الكل");
    setGov("الكل");
    setSizes([]);
  };

  const toggleSize = (s: SizeCat) => {
    setSizes((p) => {
      const next = p.includes(s) ? p.filter((x) => x !== s) : [...p, s];
      if (gov !== "الكل") {
        const g = GOVERNORATES.find((x) => x.name === gov);
        if (g && next.length > 0 && !next.includes(sizeOf(g))) setGov("الكل");
      }
      return next;
    });
  };

  const pickGov = (id: string) => {
    const g = GOVERNORATES.find((x) => x.id === id);
    if (!g) return;
    if (gov === g.name) {
      setGov("الكل");
      return;
    }
    setGov(g.name);
    setRegion(g.region);
    setSizes((s) => (s.length && !s.includes(sizeOf(g)) ? [] : s));
  };

  /* مؤشرات النطاق المحدد — كلها من جدول المحافظات (OCHA + CBS) */
  const sumPop = filtered.reduce((s, g) => s + g.popTotal, 0);
  const sumPop2011 = filtered.reduce((s, g) => s + g.pop2011, 0);
  const sumArea = filtered.reduce((s, g) => s + g.area, 0);
  const sumIdps = filtered.reduce((s, g) => s + g.idps, 0);
  const sumSites = filtered.reduce((s, g) => s + g.idpsInSites, 0);
  const avgDensity = sumArea ? sumPop / sumArea : 0;
  const idpPct = sumPop ? (sumIdps / sumPop) * 100 : 0;
  const changePct = sumPop2011 ? ((sumPop - sumPop2011) / sumPop2011) * 100 : 0;

  /* المقارنات الوطنية — من المصدر نفسه (OCHA + CBS) */
  const natDensity = TOTAL_POP / TOTAL_AREA;
  const natIdpShare = (TOTAL_IDPS / TOTAL_POP) * 100;
  const natChange = ((TOTAL_POP - TOTAL_POP_2011) / TOTAL_POP_2011) * 100;
  const mostIdp = GOVERNORATES.reduce((m, g) => (idpShare(g) > idpShare(m) ? g : m), GOVERNORATES[0]);
  const mostPop = GOVERNORATES.reduce((m, g) => (g.popTotal > m.popTotal ? g : m), GOVERNORATES[0]);
  const damascus = GOVERNORATES.find((g) => g.id === "damascus")!;

  const byPop = useMemo(() => [...filtered].sort((a, b) => b.popTotal - a.popTotal), [filtered]);
  const byIdpShare = useMemo(() => [...filtered].sort((a, b) => idpShare(b) - idpShare(a)), [filtered]);
  const byDensity = useMemo(() => [...filtered].sort((a, b) => density(b) - density(a)), [filtered]);

  const topPop = byPop[0];
  const topIdp = byIdpShare[0];
  const activeMetric = METRICS.find((m) => m.id === metric)!;
  const isDiverging = metric === "popChange";

  const mapValues = useMemo(
    () => Object.fromEntries(GOVERNORATES.map((g) => [g.id, activeMetric.get(g)])),
    [activeMetric]
  );
  const mapNames = useMemo(() => Object.fromEntries(GOVERNORATES.map((g) => [g.id, g.name])), []);
  const mapMin = Math.min(...Object.values(mapValues));
  const mapMax = Math.max(...Object.values(mapValues));

  const donutItems = useMemo(
    () => SIZE_CATS.map((c) => ({ label: c, value: filtered.filter((g) => sizeOf(g) === c).length })),
    [filtered]
  );

  const regionItems = useMemo(
    () =>
      REGIONS.map((r) => {
        const v = filtered.filter((g) => g.region === r).reduce((s, g) => s + g.popTotal, 0);
        return { label: r, value: v, display: fmtShort(v) };
      }).filter((r) => r.value > 0),
    [filtered]
  );

  /* السلاسل الوطنية — البنك الدولي فقط */
  const last = TIMELINE[TIMELINE.length - 1];
  const gdpLast = GDP_SERIES[GDP_SERIES.length - 1];
  const gdpPeak = GDP_SERIES.reduce((m, p) => (p.gdp > m.gdp ? p : m), GDP_SERIES[0]);
  const infLast = INFLATION_SERIES[INFLATION_SERIES.length - 1];
  const gdpRange = range === "all" ? GDP_SERIES : GDP_SERIES.slice(-6);
  const popRange = range === "all" ? TIMELINE : TIMELINE.slice(-6);
  const perCapPeak = GDP_SERIES.map((g) => ({ year: g.year, v: gdpPerCapita(g.year, g.gdp) })).reduce((m, p) =>
    p.v > m.v ? p : m
  );

  const download = (content: string, name: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    notify(`تم تنزيل ${name}`);
  };

  const copy = async (text: string, i: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      notify("تعذّر النسخ");
    }
  };

  const titles: Record<Page, string> = {
    overview: "نظرة عامة تنفيذية",
    economy: "الأداء الاقتصادي الوطني",
    health: "الصحة والسكان",
    dax: "نموذج Power BI و DAX",
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f5ede2] text-[#1d4f48]">
      <div className="lg:flex lg:items-start">
        {/* -------------------------- الشريط الجانبي -------------------------- */}
        <aside className="flex flex-col gap-4 bg-[#1d4f48] p-4 text-white lg:sticky lg:top-3 lg:m-3 lg:h-[calc(100vh-24px)] lg:w-[248px] lg:shrink-0 lg:overflow-y-auto lg:rounded-2xl">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e0b252] text-[#1d4f48]">
              <Globe2 className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-[17px] font-bold leading-tight">رؤى المحافظات</div>
              <div className="text-[11px] text-white/65">سوريا · 14 محافظة</div>
            </div>
          </div>

          <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {NAV.map((n) => {
              const on = page === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setPage(n.id)}
                  className={`flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition ${
                    on ? "bg-white/20 text-white" : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  <n.icon className={`h-4 w-4 ${on ? "text-[#e0b252]" : "text-white/65"}`} />
                  {n.label}
                </button>
              );
            })}
          </nav>

          <hr className="border-white/20" />

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold">المنطقة</span>
              <span className="relative block">
                <select
                  value={region}
                  onChange={(e) => {
                    setRegion(e.target.value);
                    setGov("الكل");
                  }}
                  className="w-full cursor-pointer rounded-lg border border-white/35 bg-[#163e39] px-3 py-2 text-[13px] text-white outline-none focus:border-[#e0b252]"
                >
                  <option value="الكل">الكل</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold">المحافظة</span>
              <span className="relative block">
                <select
                  value={gov}
                  onChange={(e) => setGov(e.target.value)}
                  className="w-full cursor-pointer rounded-lg border border-white/35 bg-[#163e39] px-3 py-2 text-[13px] text-white outline-none focus:border-[#e0b252]"
                >
                  <option value="الكل">الكل</option>
                  {govOptions.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              </span>
            </label>
          </div>

          <div>
            <div className="mb-1.5 text-[13px] font-bold">فئة الحجم</div>
            <div className="grid grid-cols-3 gap-1.5">
              {SIZE_CATS.map((s) => {
                const on = sizes.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSize(s)}
                    className={`cursor-pointer rounded-lg border py-2 text-[12.5px] font-bold transition ${
                      on
                        ? "border-[#e0b252] bg-[#e0b252] text-[#1d4f48]"
                        : "border-white/30 text-white/90 hover:bg-white/10"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-white/60">
              كبيرة &gt; 2 مليون · متوسطة 1–2 مليون · صغيرة &lt; مليون
            </p>
          </div>

          <button
            onClick={reset}
            disabled={!hasFilter}
            className={`mt-auto flex items-center justify-center gap-2 rounded-lg border-2 py-2 text-[13.5px] font-bold transition ${
              hasFilter
                ? "cursor-pointer border-[#e0b252] text-[#e0b252] hover:bg-[#e0b252] hover:text-[#1d4f48]"
                : "cursor-not-allowed border-white/20 text-white/35"
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            إعادة ضبط الفلاتر
          </button>

          <p className="text-[10px] leading-relaxed text-white/55">
            الفلاتر وجدول المحافظات: {SOURCES.ocha}. التغير منذ 2011: {SOURCES.cbs}.
          </p>
        </aside>

        {/* ---------------------------- المحتوى ---------------------------- */}
        <main className="min-w-0 flex-1 space-y-3 p-3.5 md:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h1 className="text-[26px] font-bold leading-tight md:text-[30px]">{titles[page]}</h1>
              <p className="text-[12px] text-[#1d4f48]/75">
                {page === "overview" && "السكان والنزوح والمساحة — 14 محافظة"}
                {page === "economy" && `مؤشرات وطنية · الناتج حتى ${gdpLast.year} والتضخم حتى ${infLast.year}`}
                {page === "health" && "العمر المتوقع والكثافة والتركيب العمري"}
                {page === "dax" && "جداول CSV ومقاييس جاهزة للاستيراد في Power BI"}
              </p>
            </div>
            {hasFilter && (
              <div className="flex flex-wrap gap-1.5 text-[11.5px]">
                {region !== "الكل" && (
                  <Chip
                    label={region}
                    onClear={() => {
                      setRegion("الكل");
                      setGov("الكل");
                    }}
                  />
                )}
                {gov !== "الكل" && <Chip label={gov} onClear={() => setGov("الكل")} />}
                {sizes.map((s) => (
                  <Chip key={s} label={s} onClear={() => toggleSize(s)} />
                ))}
              </div>
            )}
          </div>

          {/* ============================ نظرة عامة ============================ */}
          {page === "overview" && (
            <>
              <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                <Kpi
                  icon={Users}
                  title="إجمالي السكان"
                  value={fmtPop(sumPop)}
                  sub={`${filtered.length} محافظة · ${fmtSigned(changePct, 1)} عن 2011`}
                  source={`${SOURCES.ocha} · ${SOURCES.cbs}`}
                />
                <Kpi
                  icon={Ruler}
                  title="الكثافة السكانية"
                  value={`${fmtNum(avgDensity)} /كم²`}
                  sub={`المساحة ${fmtNum(sumArea)} كم²`}
                  source={SOURCES.ocha}
                />
                <Kpi
                  icon={Tent}
                  title="النازحون داخلياً"
                  value={fmtPop(sumIdps)}
                  sub={`${fmtPct(idpPct, 0)} من السكان · ${fmtPop(sumSites)} في المخيمات`}
                  source={SOURCES.ocha}
                />
                <Kpi
                  icon={Users}
                  title="الأعلى سكاناً"
                  value={topPop?.name ?? "—"}
                  sub={topPop && sumPop ? `${fmtPop(topPop.popTotal)} · ${fmtPct((topPop.popTotal / sumPop) * 100, 0)}` : "—"}
                  source={SOURCES.ocha}
                />
                <Kpi
                  icon={TrendingDown}
                  title="الأعلى نسبة نزوح"
                  value={topIdp?.name ?? "—"}
                  sub={topIdp ? `${fmtPct(idpShare(topIdp), 0)} من سكانها` : "—"}
                  source={SOURCES.ocha}
                />
              </section>

              <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Insight value={fmtPct(idpShare(mostIdp), 1)} label={`${mostIdp.name} — أعلى نسبة نازحين من السكان`} source={SOURCES.ocha} />
                <Insight value={`×${fmtNum(density(damascus) / natDensity, 0)}`} label="كثافة دمشق مقارنة بالمتوسط الوطني" source={`${SOURCES.ocha} · ${SOURCES.cbs}`} />
                <Insight value={fmtPct((mostPop.popTotal / TOTAL_POP) * 100, 1)} label={`${mostPop.name} — الحصة الأكبر من السكان`} source={SOURCES.ocha} />
                <Insight value={fmtSigned(natChange, 1)} label="التغير السكاني الوطني منذ 2011" source={`${SOURCES.ocha} · ${SOURCES.cbs}`} />
              </section>

              {detailGov && (
                <section className="card p-4">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[20px] font-bold">{detailGov.name}</h2>
                      <span className="rounded-full bg-[#1d4f48]/10 px-2.5 py-0.5 text-[11px] font-bold">
                        المنطقة {detailGov.region}
                      </span>
                      <span className="rounded-full bg-[#1d4f48]/10 px-2.5 py-0.5 text-[11px] font-bold">
                        فئة {sizeOf(detailGov)}
                      </span>
                      {detailGov.id === "damascus" && (
                        <span className="rounded-full bg-[#e0b252] px-2.5 py-0.5 text-[11px] font-bold text-[#1d4f48]">
                          العاصمة
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setGov("الكل")}
                      className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-semibold text-[#1d4f48]/75 hover:bg-[#1d4f48]/5"
                    >
                      <X className="h-3.5 w-3.5" />
                      إغلاق
                    </button>
                  </div>
                  <p className="mb-3 text-[12.5px] text-[#1d4f48]/75">
                    المركز الإداري: {detailGov.capital} · {detailGov.notes}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6">
                    <Stat label="السكان" value={fmtPop(detailGov.popTotal)} sub={`بالضبط: ${fmtNum(detailGov.popTotal)} نسمة`} />
                    <Stat
                      label="التغير منذ 2011"
                      value={fmtSigned(popChange(detailGov), 1)}
                      sub={`كان ${fmtPop(detailGov.pop2011)} في 2011`}
                    />
                    <Stat
                      label="الكثافة"
                      value={`${fmtNum(density(detailGov))} /كم²`}
                      sub={`المتوسط الوطني ${fmtNum(natDensity)}`}
                    />
                    <Stat
                      label="المساحة"
                      value={`${fmtNum(detailGov.area)} كم²`}
                      sub={`${fmtPct((detailGov.area / TOTAL_AREA) * 100, 1)} من سوريا`}
                    />
                    <Stat
                      label="النازحون"
                      value={fmtPop(detailGov.idps)}
                      sub={`${fmtPct(idpShare(detailGov), 1)} من السكان (وطنياً ${fmtPct(natIdpShare, 1)})`}
                    />
                    <Stat
                      label="في المخيمات"
                      value={fmtPop(detailGov.idpsInSites)}
                      sub={
                        detailGov.idps > 0
                          ? `${fmtPct((detailGov.idpsInSites / detailGov.idps) * 100, 0)} من نازحي المحافظة`
                          : "لا نازحين مسجلين"
                      }
                    />
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center gap-2 text-[12.5px] font-bold">
                      تركيبة السكان
                      <SourceTag text={SOURCES.ocha} />
                    </div>
                    <StackedBar
                      segments={[
                        { label: "مقيمون", value: detailGov.resident, color: "#1d4f48" },
                        { label: "عائدون", value: detailGov.returnees, color: "#7fa8a3" },
                        {
                          label: "نازحون خارج المخيمات",
                          value: Math.max(detailGov.idps - detailGov.idpsInSites, 0),
                          color: "#e0b252",
                        },
                        { label: "نازحون في المخيمات", value: detailGov.idpsInSites, color: "#a8502e" },
                      ]}
                      format={fmtNum}
                    />
                  </div>
                </section>
              )}

              <section className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
                <div className="card p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-[14.5px] font-bold">خريطة المحافظات</h3>
                      <p className="text-[11.5px] text-[#1d4f48]/70">التلوين حسب {activeMetric.label}</p>
                    </div>
                    {gov !== "الكل" && (
                      <button
                        onClick={() => setGov("الكل")}
                        className="cursor-pointer rounded-md bg-[#e0b252]/30 px-2 py-1 text-[11px] font-bold text-[#6b4c0d]"
                      >
                        إلغاء {gov}
                      </button>
                    )}
                  </div>

                  <div className="grid items-center gap-3 md:grid-cols-[1fr_188px]">
                    <SyriaMap
                      values={mapValues}
                      names={mapNames}
                      active={activeIds}
                      format={activeMetric.fmt}
                      selected={selectedId}
                      metricLabel={activeMetric.label}
                      onPick={pickGov}
                      diverging={isDiverging}
                    />
                    <div className="flex h-full flex-col justify-between rounded-xl border border-[#e4d8c2] bg-[#f3e9d9]/70 p-2.5">
                      <div className="space-y-1">
                        {METRICS.map((m) => {
                          const on = metric === m.id;
                          return (
                            <label
                              key={m.id}
                              className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] ${
                                on ? "bg-white font-bold shadow-sm" : "hover:bg-white/60"
                              }`}
                            >
                              <input
                                type="radio"
                                name="metric"
                                checked={on}
                                onChange={() => setMetric(m.id)}
                                className="h-3.5 w-3.5 cursor-pointer accent-[#1d4f48]"
                              />
                              {m.label}
                            </label>
                          );
                        })}
                      </div>
                      <div className="mt-3 pt-2">
                        <div
                          className="h-2.5 rounded-full"
                          style={{
                            background: isDiverging
                              ? `linear-gradient(to right, ${divergingColor(-1)}, ${divergingColor(0)}, ${divergingColor(1)})`
                              : `linear-gradient(to right, ${scaleColor(0)}, ${scaleColor(0.5)}, ${scaleColor(1)})`,
                          }}
                        />
                        <div className="mt-1 flex justify-between text-[11px] font-semibold">
                          <span>{isDiverging ? "تراجع" : "منخفض"}</span>
                          <span>{isDiverging ? "نمو" : "مرتفع"}</span>
                        </div>
                        <div className="flex justify-between text-[10px] tabular-nums text-[#1d4f48]/70">
                          <span dir="ltr">{activeMetric.fmt(mapMin)}</span>
                          <span dir="ltr">{activeMetric.fmt(mapMax)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card flex flex-col p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="text-[14.5px] font-bold">ترتيب المحافظات</h3>
                    <SourceTag text={SOURCES.ocha} />
                  </div>
                  <div className="max-h-[320px] flex-1 overflow-auto">
                    <table className="w-full text-[12px]">
                      <thead className="sticky top-0 bg-[#fffdf8] text-[#1d4f48]/75">
                        <tr className="border-b border-[#1d4f48]/20">
                          <th className="w-6 py-2 text-right font-semibold">#</th>
                          <th className="py-2 text-right font-semibold">المحافظة</th>
                          <th className="py-2 text-right font-semibold">السكان</th>
                          <th className="py-2 text-right font-semibold">الكثافة</th>
                          <th className="py-2 text-right font-semibold">التغير</th>
                          <th className="py-2 text-center font-semibold">نزوح</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byPop.map((g, i) => {
                          const sel = gov === g.name;
                          const sh = idpShare(g);
                          const ch = popChange(g);
                          return (
                            <tr
                              key={g.id}
                              onClick={() => pickGov(g.id)}
                              className={`cursor-pointer whitespace-nowrap border-b border-[#1d4f48]/8 ${
                                sel ? "bg-[#e0b252]/25 font-semibold" : "hover:bg-[#f3ead8]"
                              }`}
                            >
                              <td className="py-1.5 text-[#1d4f48]/65">{i + 1}</td>
                              <td className="py-1.5 font-bold">{g.name}</td>
                              <td className="py-1.5 font-semibold tabular-nums text-[#2a6f67]" dir="ltr">
                                {fmtShort(g.popTotal)}
                              </td>
                              <td className="py-1.5 tabular-nums" dir="ltr">
                                {fmtNum(density(g))}
                              </td>
                              <td
                                className={`py-1.5 font-semibold tabular-nums ${
                                  ch > 0 ? "text-[#2a6f67]" : "text-[#a8502e]"
                                }`}
                                dir="ltr"
                              >
                                {fmtSigned(ch, 1)}
                              </td>
                              <td className="py-1.5 text-center">
                                <span
                                  className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                                    sh >= 50
                                      ? "bg-[#f6d2c4] text-[#7c2d12]"
                                      : sh >= 25
                                      ? "bg-[#fbe6bc] text-[#7c530d]"
                                      : "bg-[#cfe3dc] text-[#1d4f48]"
                                  }`}
                                  dir="ltr"
                                >
                                  {sh.toFixed(0)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {byPop.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-[#1d4f48]/55">
                              لا توجد محافظات مطابقة للفلاتر
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 border-t border-[#1d4f48]/10 pt-2 text-[10.5px] text-[#1d4f48]/65">
                    التغير = الفرق مع تقدير 2011 · النزوح = نسبة النازحين من السكان
                  </p>
                </div>
              </section>

              <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Panel title="المحافظات حسب السكان" source={SOURCES.ocha}>
                  <HBars
                    items={byPop.map((g) => ({
                      id: g.id,
                      label: g.name,
                      value: g.popTotal,
                      display: fmtShort(g.popTotal),
                    }))}
                    selectedId={selectedId}
                    onPick={pickGov}
                  />
                </Panel>
                <Panel title="حسب فئة الحجم" sub="انقر على شريحة للتصفية" source={SOURCES.ocha}>
                  <Donut
                    items={donutItems}
                    center={String(filtered.length)}
                    sub="محافظة"
                    selectedLabel={sizes.length === 1 ? sizes[0] : undefined}
                    onPick={(l) => toggleSize(l as SizeCat)}
                  />
                </Panel>
                <Panel title="السكان حسب المنطقة" sub="انقر على عمود للتصفية" source={SOURCES.ocha} className="md:col-span-2 lg:col-span-1">
                  <Columns
                    items={regionItems}
                    height={148}
                    selectedLabel={region !== "الكل" ? region : undefined}
                    onPick={(r) => {
                      setRegion((p) => (p === r ? "الكل" : r));
                      setGov("الكل");
                    }}
                  />
                </Panel>
              </section>

              <section className="grid gap-3 lg:grid-cols-2">
                <Panel
                  title="السكان: تقدير 2011 مقابل تقدير OCHA"
                  sub="منهجيتان مختلفتان للمحور الزمني — لا يجمع بينهما في رقم واحد"
                  source={`${SOURCES.cbs} · ${SOURCES.ocha}`}
                >
                  <GroupedBars
                    items={byPop.map((g) => ({ label: g.name, a: g.pop2011, b: g.popTotal }))}
                    labelA="2011"
                    labelB="OCHA"
                    format={fmtShort}
                  />
                </Panel>
                <Panel title="نسبة النازحين من سكان المحافظة" source={SOURCES.ocha}>
                  <HBars
                    barColor="#c9892b"
                    items={byIdpShare.map((g) => ({
                      id: g.id,
                      label: g.name,
                      value: idpShare(g),
                      display: fmtPct(idpShare(g), 0),
                    }))}
                    selectedId={selectedId}
                    onPick={pickGov}
                  />
                </Panel>
              </section>
            </>
          )}

          {/* ============================ الاقتصاد ============================ */}
          {page === "economy" && (
            <>
              <div className="flex items-start gap-2 rounded-xl border border-[#e0b252]/50 bg-[#fbf2df] p-3 text-[12px] leading-relaxed text-[#6b4c0d]">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  كل أرقام هذه الصفحة من <b>{SOURCES.wb}</b> وعلى مستوى الدولة. آخر سنة منشورة هي{" "}
                  <b>{gdpLast.year}</b> للناتج و<b>{infLast.year}</b> للتضخم. الناتج بالدولار شديد التقلب بسبب
                  سعر الصرف، فيُقرأ كمؤشر اتجاه لا كقيمة مطلقة.
                </span>
              </div>

              <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi
                  icon={Banknote}
                  title={`الناتج المحلي ${gdpLast.year}`}
                  value={`${gdpLast.gdp} مليار $`}
                  sub={`الذروة ${gdpPeak.gdp} مليار $ عام ${gdpPeak.year}`}
                  source={SOURCES.wb}
                />
                <Kpi
                  icon={Users}
                  title="نصيب الفرد"
                  value={`$${fmtNum(gdpPerCapita(gdpLast.year, gdpLast.gdp))}`}
                  sub={`كان $${fmtNum(perCapPeak.v)} في ${perCapPeak.year}`}
                  source={`${SOURCES.wb} · محسوب`}
                />
                <Kpi
                  icon={TrendingDown}
                  title="التراجع منذ الذروة"
                  value={fmtPct(((gdpLast.gdp - gdpPeak.gdp) / gdpPeak.gdp) * 100, 0)}
                  sub={`${gdpPeak.year} – ${gdpLast.year}`}
                  source={SOURCES.wb}
                />
                <Kpi
                  icon={Banknote}
                  title={`التضخم ${infLast.year}`}
                  value={fmtPct(infLast.inflation, 1)}
                  sub="آخر سنة منشورة"
                  source={SOURCES.wb19}
                />
              </section>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  {(
                    [
                      ["all", `2010 – ${gdpLast.year}`],
                      ["recent", "آخر 6 سنوات"],
                    ] as const
                  ).map(([id, l]) => (
                    <button
                      key={id}
                      onClick={() => setRange(id)}
                      className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[12px] font-bold ${
                        range === id ? "bg-[#1d4f48] text-white" : "border border-[#1d4f48]/25 bg-white hover:bg-[#1d4f48]/5"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => download(exportTimelineCSV(), "syria_timeline.csv", "text/csv;charset=utf-8")}
                  className="flex cursor-pointer items-center gap-1.5 text-[12px] font-semibold text-[#2a6f67] hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  تنزيل CSV
                </button>
              </div>

              <section className="grid gap-3 lg:grid-cols-2">
                <Panel title="الناتج المحلي الإجمالي" sub={`مليار دولار — حتى ${gdpLast.year}`} source={SOURCES.wb}>
                  <LineChart
                    data={gdpRange.map((p) => ({ x: String(p.year), y: p.gdp }))}
                    format={(v) => `${v} مليار $`}
                    axis={(v) => v.toFixed(0)}
                  />
                </Panel>
                <Panel title="نصيب الفرد من الناتج" sub="دولار للفرد — محسوب من الناتج وعدد السكان" source={`${SOURCES.wb} · محسوب`}>
                  <LineChart
                    color="#1d4f48"
                    data={gdpRange.map((p) => ({ x: String(p.year), y: gdpPerCapita(p.year, p.gdp) }))}
                    format={(v) => `$${fmtNum(v)}`}
                    axis={(v) => fmtNum(v, 0)}
                  />
                </Panel>
                <Panel
                  title="معدل التضخم السنوي"
                  sub={`التغير في أسعار المستهلك (%) — حتى ${infLast.year}`}
                  source={SOURCES.wb19}
                  className="lg:col-span-2"
                >
                  <LineChart
                    color="#c9892b"
                    data={INFLATION_SERIES.map((p) => ({ x: String(p.year), y: p.inflation }))}
                    format={(v) => `${v}%`}
                    axis={(v) => `${Math.round(v)}%`}
                  />
                </Panel>
              </section>
            </>
          )}

          {/* ========================== الصحة والسكان ========================== */}
          {page === "health" && (
            <>
              <div className="flex items-start gap-2 rounded-xl border border-[#e0b252]/50 bg-[#fbf2df] p-3 text-[12px] leading-relaxed text-[#6b4c0d]">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  بطاقات المقارنة مع المحافظات تعتمد <b>{SOURCES.ocha}</b> (مجموع المحافظات ={" "}
                  <b>{fmtNum(TOTAL_POP)}</b> نسمة). أما المخططات الزمنية فتعتمد <b>{SOURCES.wb}</b> ومنهجية وطنية
                  مختلفة (السكان 2022 = <b>22.46 مليون</b>)، لذا لا يُقارن بينهما في رقم واحد.
                </span>
              </div>

              <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi
                  icon={Users}
                  title="السكان (النطاق المحدد)"
                  value={fmtPop(sumPop)}
                  sub={`${fmtPop(sumPop2011)} في 2011 (${fmtSigned(changePct, 1)})`}
                  source={`${SOURCES.ocha} · ${SOURCES.cbs}`}
                />
                <Kpi
                  icon={HeartPulse}
                  title={`العمر المتوقع ${last.year}`}
                  value={`${last.life} سنة`}
                  sub="على مستوى الدولة — ليس لكل محافظة"
                  source={SOURCES.wb}
                />
                <Kpi
                  icon={Ruler}
                  title="الكثافة"
                  value={`${fmtNum(avgDensity)} /كم²`}
                  sub={`المتوسط الوطني ${fmtNum(natDensity)} /كم²`}
                  source={SOURCES.ocha}
                />
                <Kpi
                  icon={Tent}
                  title="النازحون في المخيمات"
                  value={fmtPop(sumSites)}
                  sub={sumIdps ? `${fmtPct((sumSites / sumIdps) * 100, 0)} من النازحين` : "—"}
                  source={SOURCES.ocha}
                />
              </section>

              <section className="grid gap-3 lg:grid-cols-2">
                <Panel
                  title="العمر المتوقع عند الولادة"
                  sub="بالسنوات — يحتسب وفيات النزاع، والانخفاض العنيف يبدأ 2012"
                  source={SOURCES.wb}
                >
                  <LineChart
                    yMin={60}
                    data={TIMELINE.map((p) => ({ x: String(p.year), y: p.life }))}
                    format={(v) => `${v} سنة`}
                    axis={(v) => v.toFixed(0)}
                  />
                </Panel>
                <Panel
                  title="تطور عدد السكان"
                  sub="مليون نسمة — منهجية وطنية، تختلف عن مجموع بيانات المحافظات"
                  source={SOURCES.wb}
                >
                  <div className="flex gap-2">
                    {(
                      [
                        ["all", "كل السنوات"],
                        ["recent", "آخر 6"],
                      ] as const
                    ).map(([id, l]) => (
                      <button
                        key={id}
                        onClick={() => setRange(id)}
                        className={`cursor-pointer rounded-full px-3 py-1 text-[11px] font-bold ${
                          range === id ? "bg-[#1d4f48] text-white" : "border border-[#1d4f48]/25 bg-white"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <LineChart
                    yMin={18}
                    color="#1d4f48"
                    data={popRange.map((p) => ({ x: String(p.year), y: p.pop }))}
                    format={(v) => `${v} مليون`}
                    axis={(v) => v.toFixed(0)}
                  />
                </Panel>
                <Panel title="التركيب العمري" sub="النسبة من السكان — 2023" source={SOURCES.wb23}>
                  <Donut items={AGE_GROUPS} center="30.3%" sub="تحت 15 سنة" valuesArePercent />
                </Panel>
                <Panel
                  title="الكثافة حسب المحافظة"
                  sub="مقياس لوغاريتمي — دمشق أعلى بكثير من البقية"
                  source={`${SOURCES.ocha} · ${SOURCES.cbs}`}
                >
                  <HBars
                    logScale
                    items={byDensity.map((g) => ({
                      id: g.id,
                      label: g.name,
                      value: density(g),
                      display: fmtNum(density(g)),
                    }))}
                    selectedId={selectedId}
                    onPick={pickGov}
                  />
                </Panel>
              </section>
            </>
          )}

          {/* =========================== Power BI / DAX =========================== */}
          {page === "dax" && (
            <>
              <div className="card p-5">
                <h2 className="text-[18px] font-bold">الاستيراد إلى Power BI Desktop</h2>
                <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[#1d4f48]/80">
                  نزّل الجداول (UTF-8 مع BOM)، استوردها عبر Get Data ← Text/CSV بترميز 65001، ثم انسخ المقاييس إلى
                  جدول قياسات. الخلايا الفارغة تعني عدم توفر بيانات منشورة لتلك السنة — لا تُملأ بقيم تقديرية.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => download(exportGovernoratesCSV(), "syria_governorates.csv", "text/csv;charset=utf-8")}
                    className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#1d4f48] px-3.5 py-2 text-[12px] font-bold text-white hover:bg-[#163e39]"
                  >
                    <Download className="h-4 w-4 text-[#e0b252]" />
                    المحافظات CSV
                  </button>
                  <button
                    onClick={() => download(exportTimelineCSV(), "syria_timeline.csv", "text/csv;charset=utf-8")}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#1d4f48]/25 bg-white px-3.5 py-2 text-[12px] font-bold hover:bg-[#1d4f48]/5"
                  >
                    <Download className="h-4 w-4" />
                    السلاسل الوطنية CSV
                  </button>
                  <button
                    onClick={() => download(generatePowerBIThemeJSON(), "Syria_Theme.json", "application/json")}
                    className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#e0b252] px-3.5 py-2 text-[12px] font-bold text-[#1d4f48] hover:bg-[#d4a43e]"
                  >
                    <Palette className="h-4 w-4" />
                    ثيم الألوان
                  </button>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="mb-3 text-[15px] font-bold">التعريفات وتحويف المنهجيات</h3>
                <p className="mb-3 text-[12.5px] leading-relaxed text-[#1d4f48]/80">
                  اثنان من مؤشرات السكان في هذا التقرير واردان من مصدرين مختلفتين، ولذلك يختلفان عددياً. لا يصح جمع
                  أحدهما مع الآخر أو مقارنتهما مباشرة:
                </p>
                <div className="grid gap-2.5 md:grid-cols-2">
                  <div className="rounded-xl border border-[#1d4f48]/15 bg-[#f5ede2] p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-[12.5px] font-bold">مجموع بيانات المحافظات</span>
                      <SourceTag text={SOURCES.ocha} />
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-[#1d4f48]/80">
                      يُستخدم في جدول المحافظات والفلاتر وبطاقات «نظرة عامة». الإجمالي{" "}
                      <b dir="ltr">{fmtNum(TOTAL_POP)}</b> نسمة، ويغطي المقيمين والعائدين والنازحين فقط.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#1d4f48]/15 bg-[#f5ede2] p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-[12.5px] font-bold">السلسلة الزمنية الوطنية</span>
                      <SourceTag text={SOURCES.wb} />
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-[#1d4f48]/80">
                      تُستخدم في مخططات السكان والعمر المتوقع والاقتصاد. السكان 2022 = <b>22.46 مليون</b>، وهي
                      تقديرات مُنمذجة لسكان البلاد بالكامل.
                    </p>
                  </div>
                </div>
              </div>

              <section className="grid gap-3 md:grid-cols-2">
                {DAX.map((m, i) => (
                  <div key={m.name} className="card p-4">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[13px] font-bold" dir="ltr">
                        {m.name}
                      </span>
                      <button
                        onClick={() => copy(m.code, i)}
                        className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#2a6f67] hover:underline"
                      >
                        {copied === i ? (
                          <>
                            <Check className="h-3 w-3" /> نُسخ
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> نسخ
                          </>
                        )}
                      </button>
                    </div>
                    <p className="mb-2 text-[11.5px] text-[#1d4f48]/75">{m.desc}</p>
                    <pre dir="ltr" className="overflow-auto rounded-lg bg-[#1d4f48] p-3 text-left font-mono text-[12px] leading-5 text-[#d5efe8]">
                      {m.code}
                    </pre>
                  </div>
                ))}
              </section>
            </>
          )}

          <footer className="border-t border-[#1d4f48]/15 pt-3 text-[11px] leading-relaxed text-[#1d4f48]/70">
            <p>
              <b>المصادر:</b> {SOURCES.cbs} للمساحات وتقديرات السكان 2011 · {SOURCES.ocha} لسكان المحافظات
              والنازحين والعائدين · {SOURCES.wb} للسلاسل الوطنية (السكان، العمر المتوقع، الناتج، التضخم) · حدود
              المحافظات: UN OCHA / geoBoundaries.
            </p>
            <p className="mt-1">
              <b>تنبيه:</b> أرقام السكان في سوريا تقديرية بسبب غياب تعداد رسمي منذ 2004 وحركة النزوح الواسعة، وقد
              تتفاوت بين المصادر وبين سنوات النشر.
            </p>
          </footer>
        </main>
      </div>

      {toast && (
        <div className="animate-fade-in fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#1d4f48] px-4 py-2 text-[12px] font-bold text-white shadow-lg">
          <Check className="h-4 w-4 text-[#e0b252]" />
          {toast}
        </div>
      )}
    </div>
  );
}
