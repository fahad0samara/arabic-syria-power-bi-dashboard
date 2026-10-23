/* مصادر البيانات:
   - المحافظات (المساحة، تقدير 2011): المكتب المركزي للإحصاء السوري.
   - المحافظات (السكان، المقيمون، العائدون، النازحون): OCHA، لمحة الاحتياجات الإنسانية HNO 2022.
   - السلاسل الوطنية: البنك الدولي WDI — السكان SP.POP.TOTL، العمر SP.DYN.LE00.IN،
     الناتج NY.GDP.MKTP.CD (آخر سنة منشورة 2022)، التضخم FP.CPI.TOTL.ZG (آخر سنة 2019)،
     التركيب العمري SP.POP.0014/1564/65UP.TO.ZS لسنة 2023.
   - الناتج والتضخم والعمر غير متاحة على مستوى المحافظة، لذلك لا تظهر هناك. */

export type Region = "الجنوبية" | "الوسطى" | "الساحلية" | "الشمالية" | "الشرقية";
export const REGIONS: Region[] = ["الشمالية", "الوسطى", "الساحلية", "الشرقية", "الجنوبية"];

/* كل رقم في اللوحة يحمل مصدره. لا تُخلط منهجيتان في رقم واحد. */
export const SOURCES = {
  cbs: "المكتب المركزي للإحصاء · 2011",
  ocha: "OCHA HNO · 2022",
  wb: "البنك الدولي",
  wb23: "البنك الدولي · 2023",
  wb22: "البنك الدولي · 2022",
  wb19: "البنك الدولي · 2019",
} as const;

export type SizeCat = "كبيرة" | "متوسطة" | "صغيرة";
export const SIZE_CATS: SizeCat[] = ["كبيرة", "متوسطة", "صغيرة"];

export interface Governorate {
  id: string;
  name: string;
  nameEn: string;
  capital: string;
  region: Region;
  area: number;
  pop2011: number;
  resident: number;
  returnees: number;
  idps: number;
  idpsInSites: number;
  popTotal: number;
  notes: string;
}

export const GOVERNORATES: Governorate[] = [
  {
    id: "aleppo", name: "حلب", nameEn: "Aleppo", capital: "حلب", region: "الشمالية",
    area: 18500, pop2011: 4868000, resident: 2680064, returnees: 98886,
    idps: 1235179, idpsInSites: 356875, popTotal: 4014129,
    notes: "أكبر محافظات سوريا سكاناً، ومركز الصناعة والنسيج والتجارة تاريخياً",
  },
  {
    id: "rif", name: "ريف دمشق", nameEn: "Rural Damascus", capital: "دمشق", region: "الجنوبية",
    area: 18032, pop2011: 2836000, resident: 1886408, returnees: 5259,
    idps: 1131443, idpsInSites: 0, popTotal: 3023110,
    notes: "تحيط بالعاصمة، وتضم الغوطة الزراعية ومدينة عدرا الصناعية",
  },
  {
    id: "idlib", name: "إدلب", nameEn: "Idleb", capital: "إدلب", region: "الشمالية",
    area: 6097, pop2011: 1501000, resident: 767538, returnees: 157239,
    idps: 1766584, idpsInSites: 1308033, popTotal: 2691361,
    notes: "أعلى نسبة نزوح في البلاد، واقتصاد قائم على الزيتون والحبوب",
  },
  {
    id: "damascus", name: "دمشق", nameEn: "Damascus", capital: "دمشق", region: "الجنوبية",
    area: 105, pop2011: 1754000, resident: 1218684, returnees: 1323,
    idps: 607494, idpsInSites: 0, popTotal: 1827501,
    notes: "العاصمة، وأصغر المحافظات مساحة وأعلاها كثافة سكانية بفارق كبير",
  },
  {
    id: "hama", name: "حماة", nameEn: "Hama", capital: "حماة", region: "الوسطى",
    area: 8883, pop2011: 1628000, resident: 1258564, returnees: 5299,
    idps: 223211, idpsInSites: 0, popTotal: 1487074,
    notes: "سهول الغاب الخصبة، وصناعات غذائية وخزفية",
  },
  {
    id: "homs", name: "حمص", nameEn: "Homs", capital: "حمص", region: "الوسطى",
    area: 42223, pop2011: 1803000, resident: 1146451, returnees: 8154,
    idps: 311011, idpsInSites: 0, popTotal: 1465616,
    notes: "أكبر المحافظات مساحة (نحو 23% من سوريا)، ومصفاة نفط وفوسفات",
  },
  {
    id: "latakia", name: "اللاذقية", nameEn: "Lattakia", capital: "اللاذقية", region: "الساحلية",
    area: 2297, pop2011: 1008000, resident: 766231, returnees: 0,
    idps: 449697, idpsInSites: 0, popTotal: 1215928,
    notes: "الميناء البحري الرئيسي، والحمضيات والتبغ والسياحة الشاطئية",
  },
  {
    id: "hasakah", name: "الحسكة", nameEn: "Al-Hasakeh", capital: "الحسكة", region: "الشرقية",
    area: 23334, pop2011: 1512000, resident: 776416, returnees: 27500,
    idps: 323393, idpsInSites: 125731, popTotal: 1127309,
    notes: "سلة خبز سوريا: القمح والقطن، وحقول نفط الرميلان",
  },
  {
    id: "daraa", name: "درعا", nameEn: "Dar'a", capital: "درعا", region: "الجنوبية",
    area: 3730, pop2011: 1027000, resident: 958237, returnees: 863,
    idps: 63890, idpsInSites: 0, popTotal: 1022990,
    notes: "سهل حوران الزراعي، ومن أدنى نسب النزوح في البلاد",
  },
  {
    id: "tartus", name: "طرطوس", nameEn: "Tartous", capital: "طرطوس", region: "الساحلية",
    area: 1892, pop2011: 797000, resident: 746698, returnees: 0,
    idps: 182668, idpsInSites: 0, popTotal: 929366,
    notes: "ميناء تجاري، وزراعة محمية مكثفة، ومحافظة مستقبِلة للنازحين",
  },
  {
    id: "deir", name: "دير الزور", nameEn: "Deir-ez-Zor", capital: "دير الزور", region: "الشرقية",
    area: 33060, pop2011: 1239000, resident: 584329, returnees: 16107,
    idps: 164916, idpsInSites: 35642, popTotal: 765352,
    notes: "حقول النفط والغاز الرئيسية، وحوض الفرات، وأكبر انخفاض سكاني",
  },
  {
    id: "raqqa", name: "الرقة", nameEn: "Ar-Raqqa", capital: "الرقة", region: "الشرقية",
    area: 19616, pop2011: 944000, resident: 537404, returnees: 2985,
    idps: 167107, idpsInSites: 99060, popTotal: 707496,
    notes: "سد الفرات وبحيرة الأسد، وزراعة القطن والذرة",
  },
  {
    id: "sweida", name: "السويداء", nameEn: "As-Sweida", capital: "السويداء", region: "الجنوبية",
    area: 5550, pop2011: 370000, resident: 308250, returnees: 378,
    idps: 71867, idpsInSites: 0, popTotal: 380495,
    notes: "كروم العنب والتفاح، والبازلت، واقتصاد يعتمد على تحويلات المغتربين",
  },
  {
    id: "quneitra", name: "القنيطرة", nameEn: "Quneitra", capital: "القنيطرة", region: "الجنوبية",
    area: 1861, pop2011: 90000, resident: 101304, returnees: 308,
    idps: 3512, idpsInSites: 0, popTotal: 105124,
    notes: "أصغر المحافظات سكاناً، مروج وينابيع، ومعظمها خارج السيطرة الفعلية",
  },
];

export const density = (g: Governorate): number => g.popTotal / g.area;
export const idpShare = (g: Governorate): number => (g.idps / g.popTotal) * 100;
export const popChange = (g: Governorate): number => ((g.popTotal - g.pop2011) / g.pop2011) * 100;

export const TOTAL_POP = GOVERNORATES.reduce((s, g) => s + g.popTotal, 0);
export const TOTAL_POP_2011 = GOVERNORATES.reduce((s, g) => s + g.pop2011, 0);
export const TOTAL_AREA = GOVERNORATES.reduce((s, g) => s + g.area, 0);
export const TOTAL_IDPS = GOVERNORATES.reduce((s, g) => s + g.idps, 0);
export const TOTAL_IDPS_SITES = GOVERNORATES.reduce((s, g) => s + g.idpsInSites, 0);
export const TOTAL_RETURNEES = GOVERNORATES.reduce((s, g) => s + g.returnees, 0);

/* كبيرة: أكثر من 2 مليون — متوسطة: 1 إلى 2 مليون — صغيرة: أقل من مليون */
export const sizeOf = (g: Governorate): SizeCat =>
  g.popTotal > 2_000_000 ? "كبيرة" : g.popTotal >= 1_000_000 ? "متوسطة" : "صغيرة";

/* السكان (مليون) والعمر المتوقع (سنة) — البنك الدولي 2010–2023 */
export interface YearPoint {
  year: number;
  pop: number;
  life: number;
}

export const TIMELINE: YearPoint[] = [
  { year: 2010, pop: 22.5, life: 73.5 },
  { year: 2011, pop: 22.9, life: 72.3 },
  { year: 2012, pop: 22.8, life: 66.2 },
  { year: 2013, pop: 21.7, life: 65.2 },
  { year: 2014, pop: 20.3, life: 65.5 },
  { year: 2015, pop: 19.4, life: 63.3 },
  { year: 2016, pop: 19.2, life: 65.2 },
  { year: 2017, pop: 19.2, life: 65.7 },
  { year: 2018, pop: 19.6, life: 67.4 },
  { year: 2019, pop: 20.4, life: 71.0 },
  { year: 2020, pop: 21.0, life: 71.9 },
  { year: 2021, pop: 21.6, life: 72.4 },
  { year: 2022, pop: 22.5, life: 72.8 },
  { year: 2023, pop: 23.6, life: 72.1 },
];

/* الناتج المحلي بمليار الدولار — البنك الدولي 2010–2022 (لا توجد 2023 منشورة) */
export interface GdpPoint {
  year: number;
  gdp: number;
}

export const GDP_SERIES: GdpPoint[] = [
  { year: 2010, gdp: 61.4 },
  { year: 2011, gdp: 67.5 },
  { year: 2012, gdp: 43.2 },
  { year: 2013, gdp: 21.4 },
  { year: 2014, gdp: 21.5 },
  { year: 2015, gdp: 16.5 },
  { year: 2016, gdp: 12.6 },
  { year: 2017, gdp: 16.4 },
  { year: 2018, gdp: 21.5 },
  { year: 2019, gdp: 22.6 },
  { year: 2020, gdp: 12.5 },
  { year: 2021, gdp: 14.9 },
  { year: 2022, gdp: 23.7 },
];

/* التضخم % — البنك الدولي 2010–2019 (لا توجد سنوات لاحقة منشورة) */
export interface InflPoint {
  year: number;
  inflation: number;
}

export const INFLATION_SERIES: InflPoint[] = [
  { year: 2010, inflation: 4.4 },
  { year: 2011, inflation: 4.8 },
  { year: 2012, inflation: 36.7 },
  { year: 2013, inflation: 40.0 },
  { year: 2014, inflation: 10.9 },
  { year: 2015, inflation: 38.5 },
  { year: 2016, inflation: 47.7 },
  { year: 2017, inflation: 18.1 },
  { year: 2018, inflation: 0.9 },
  { year: 2019, inflation: 13.4 },
];

export const gdpPerCapita = (year: number, gdp: number): number => {
  const p = TIMELINE.find((t) => t.year === year);
  return p ? Math.round((gdp * 1000) / p.pop) : 0;
};

/* التركيب العمري 2023 % — البنك الدولي */
export const AGE_GROUPS = [
  { label: "0 – 14 سنة", value: 30.3 },
  { label: "15 – 64 سنة", value: 65.0 },
  { label: "65 سنة فأكثر", value: 4.7 },
];

export const fmtNum = (n: number, d = 0): string =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export const fmtPop = (persons: number): string => {
  if (Math.abs(persons) >= 1_000_000) return `${fmtNum(persons / 1_000_000, 2)} مليون`;
  if (Math.abs(persons) >= 1_000) return `${fmtNum(persons / 1_000, 0)} ألف`;
  return fmtNum(persons);
};

export const fmtShort = (persons: number): string => {
  if (Math.abs(persons) >= 1_000_000) return `${(persons / 1_000_000).toFixed(2)}M`;
  if (Math.abs(persons) >= 1_000) return `${Math.round(persons / 1_000)}K`;
  return String(Math.round(persons));
};

export const fmtPct = (v: number, d = 1): string => `${fmtNum(v, d)}%`;
export const fmtSigned = (v: number, d = 1): string => `${v > 0 ? "+" : ""}${fmtNum(v, d)}%`;

export function exportGovernoratesCSV(): string {
  const headers = [
    "Governorate_ID", "Governorate_AR", "Governorate_EN", "Capital_AR", "Region_AR",
    "Area_Km2", "Population_2011_CBS", "Residents_OCHA", "Returnees_OCHA", "IDPs_OCHA",
    "IDPs_In_Sites_OCHA", "Total_Population_OCHA", "Density_per_Km2", "IDP_Share_Pct",
    "Population_Change_Pct", "Size_Category",
  ];
  const rows = GOVERNORATES.map((g) =>
    [
      g.id, g.name, g.nameEn, g.capital, g.region, g.area, g.pop2011, g.resident,
      g.returnees, g.idps, g.idpsInSites, g.popTotal, density(g).toFixed(1),
      idpShare(g).toFixed(1), popChange(g).toFixed(1), sizeOf(g),
    ].join(",")
  );
  return "\uFEFF" + [headers.join(","), ...rows].join("\n");
}

export function exportTimelineCSV(): string {
  const gdpByYear = new Map(GDP_SERIES.map((g) => [g.year, g.gdp]));
  const infByYear = new Map(INFLATION_SERIES.map((t) => [t.year, t.inflation]));
  const headers = [
    "Year", "Population_Million_WB", "Life_Expectancy_Years_WB",
    "GDP_Billion_USD_WB", "GDP_per_Capita_USD", "Inflation_Pct_WB",
  ];
  const rows = TIMELINE.map((t) => {
    const gdp = gdpByYear.get(t.year);
    const inf = infByYear.get(t.year);
    return [
      t.year, t.pop, t.life,
      gdp ?? "", gdp !== undefined ? gdpPerCapita(t.year, gdp) : "", inf ?? "",
    ].join(",");
  });
  return "\uFEFF" + [headers.join(","), ...rows].join("\n");
}

export function generatePowerBIThemeJSON(): string {
  return JSON.stringify(
    {
      name: "Syria Insights — Teal & Sand",
      dataColors: ["#1d4f48", "#2a6f67", "#4d8c84", "#7fa8a3", "#e0b252", "#c9892b", "#a8502e", "#b5c7c2"],
      background: "#f5ede2",
      foreground: "#1d4f48",
      tableAccent: "#2a6f67",
      visualStyles: {
        page: { "*": { background: [{ color: { solid: { color: "#f5ede2" } } }] } },
        "*": {
          "*": {
            background: [{ color: { solid: { color: "#fffdf8" } } }],
            border: [{ color: { solid: { color: "#e8decb" } }, radius: 14 }],
          },
        },
      },
    },
    null,
    2
  );
}
