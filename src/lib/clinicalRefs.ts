// TendHerMom Verified Clinical Sources
// Master bibliography for the triage engine (Apple Guideline 1.4.1 compliance).
// Each reference is cited by its `num` across triagePathways.ts and rendered in
// the ClinicalSourcesScreen / SourceRefsSheet.

export interface ClinicalRef {
  num: number;
  org: string;
  year: string;
  title: string;
  url: string;
  kind: RefKind;
}

export type RefKind =
  | "who"
  | "nice"
  | "rcog"
  | "acog"
  | "esc"
  | "fda"
  | "nigeria"
  | "journal";

export const REF_KIND_META: Record<RefKind, { label: string; order: number }> = {
  who: { label: "World Health Organization", order: 1 },
  nice: { label: "NICE Clinical Guidelines (UK)", order: 2 },
  rcog: { label: "RCOG Green-top Guidelines (UK)", order: 3 },
  acog: { label: "ACOG Practice Bulletins (US)", order: 4 },
  esc: { label: "European Society of Cardiology", order: 5 },
  fda: { label: "US FDA Safety Communications", order: 6 },
  nigeria: { label: "Nigerian Health Data & Guidelines", order: 7 },
  journal: { label: "Peer-Reviewed Research", order: 8 },
};

export const CLINICAL_REFS: ClinicalRef[] = [
  {
    num: 1,
    org: "World Health Organization (WHO)",
    year: "2011",
    title: "WHO recommendations for prevention and treatment of pre-eclampsia and eclampsia",
    url: "https://www.who.int/publications/i/item/9789241548335",
    kind: "who",
  },
  {
    num: 2,
    org: "World Health Organization (WHO)",
    year: "2012",
    title: "WHO recommendations for the prevention and treatment of postpartum haemorrhage",
    url: "https://www.who.int/publications/i/item/9789241548502",
    kind: "who",
  },
  {
    num: 3,
    org: "World Health Organization (WHO)",
    year: "2014",
    title: "WHO recommendations on postnatal care of the mother and newborn",
    url: "https://www.who.int/publications/i/item/9789241506649",
    kind: "who",
  },
  {
    num: 4,
    org: "World Health Organization (WHO)",
    year: "2015",
    title: "WHO recommendations for prevention and treatment of maternal peripartum infections",
    url: "https://www.who.int/publications/i/item/9789241549363",
    kind: "who",
  },
  {
    num: 5,
    org: "World Health Organization (WHO)",
    year: "2016",
    title: "WHO recommendations on antenatal care for a positive pregnancy experience",
    url: "https://www.who.int/publications/i/item/9789241549912",
    kind: "who",
  },
  {
    num: 6,
    org: "World Health Organization (WHO)",
    year: "2017",
    title: "Managing complications in pregnancy and childbirth: A guide for midwives and doctors (2nd ed., IMPAC)",
    url: "https://www.who.int/publications/i/item/9789241565493",
    kind: "who",
  },
  {
    num: 7,
    org: "World Health Organization (WHO)",
    year: "2017",
    title: "Statement on maternal sepsis (WHO/RHR/17.02)",
    url: "https://www.who.int/publications/i/item/WHO-RHR-17.02",
    kind: "who",
  },
  {
    num: 8,
    org: "World Health Organization (WHO)",
    year: "2022",
    title: "Abortion care guideline",
    url: "https://www.who.int/publications/i/item/9789240039483",
    kind: "who",
  },
  {
    num: 9,
    org: "World Health Organization (WHO)",
    year: "2022",
    title: "WHO recommendations on maternal and newborn care for a positive postnatal experience",
    url: "https://www.who.int/publications/i/item/9789240045989",
    kind: "who",
  },
  {
    num: 10,
    org: "World Health Organization (WHO)",
    year: "2022",
    title: "Guide for integration of perinatal mental health in maternal and child health services",
    url: "https://www.who.int/publications/i/item/9789240057142",
    kind: "who",
  },
  {
    num: 11,
    org: "World Health Organization (WHO)",
    year: "2023",
    title: "Trends in maternal mortality 2000 to 2020: estimates by WHO, UNICEF, UNFPA, World Bank Group and UNDESA",
    url: "https://www.who.int/publications/i/item/9789240068759",
    kind: "who",
  },
  {
    num: 12,
    org: "World Health Organization (WHO)",
    year: "2023",
    title: "WHO guidelines for malaria",
    url: "https://www.who.int/publications/i/item/guidelines-for-malaria",
    kind: "who",
  },
  {
    num: 13,
    org: "UNICEF, WHO, World Bank Group & UN DESA (UN IGME)",
    year: "2023",
    title: "Never Forgotten: The situation of stillbirth around the globe",
    url: "https://data.unicef.org/resources/never-forgotten-stillbirth-estimates-report/",
    kind: "who",
  },
  {
    num: 14,
    org: "National Institute for Health and Care Excellence (NICE)",
    year: "2014, updated 2020",
    title: "Antenatal and postnatal mental health: clinical management and service guidance (CG192)",
    url: "https://www.nice.org.uk/guidance/cg192",
    kind: "nice",
  },
  {
    num: 15,
    org: "National Institute for Health and Care Excellence (NICE)",
    year: "2015, updated 2022",
    title: "Preterm labour and birth (NG25)",
    url: "https://www.nice.org.uk/guidance/ng25",
    kind: "nice",
  },
  {
    num: 16,
    org: "National Institute for Health and Care Excellence (NICE)",
    year: "2019, updated 2023",
    title: "Hypertension in pregnancy: diagnosis and management (NG133)",
    url: "https://www.nice.org.uk/guidance/ng133",
    kind: "nice",
  },
  {
    num: 17,
    org: "National Institute for Health and Care Excellence (NICE)",
    year: "2019, updated 2023",
    title: "Ectopic pregnancy and miscarriage: diagnosis and initial management (NG126)",
    url: "https://www.nice.org.uk/guidance/ng126",
    kind: "nice",
  },
  {
    num: 18,
    org: "National Institute for Health and Care Excellence (NICE)",
    year: "2021",
    title: "Antenatal care (NG201)",
    url: "https://www.nice.org.uk/guidance/ng201",
    kind: "nice",
  },
  {
    num: 19,
    org: "National Institute for Health and Care Excellence (NICE)",
    year: "2021, updated 2023",
    title: "Intrapartum care (NG235)",
    url: "https://www.nice.org.uk/guidance/ng235",
    kind: "nice",
  },
  {
    num: 20,
    org: "National Institute for Health and Care Excellence (NICE)",
    year: "2021",
    title: "Postnatal care (NG194)",
    url: "https://www.nice.org.uk/guidance/ng194",
    kind: "nice",
  },
  {
    num: 21,
    org: "Royal College of Obstetricians and Gynaecologists (RCOG)",
    year: "2011",
    title: "Reduced Fetal Movements (Green-top Guideline No. 57)",
    url: "https://www.rcog.org.uk/guidance/browse-all-guidance/green-top-guidelines/reduced-fetal-movements-green-top-guideline-no-57/",
    kind: "rcog",
  },
  {
    num: 22,
    org: "Royal College of Obstetricians and Gynaecologists (RCOG)",
    year: "2011",
    title: "Antepartum Haemorrhage (Green-top Guideline No. 63)",
    url: "https://www.rcog.org.uk/guidance/browse-all-guidance/green-top-guidelines/antepartum-haemorrhage-green-top-guideline-no-63/",
    kind: "rcog",
  },
  {
    num: 23,
    org: "Royal College of Obstetricians and Gynaecologists (RCOG)",
    year: "2011",
    title: "Management of Sickle Cell Disease in Pregnancy (Green-top Guideline No. 61)",
    url: "https://www.rcog.org.uk/guidance/browse-all-guidance/green-top-guidelines/management-of-sickle-cell-disease-in-pregnancy-green-top-guideline-no-61/",
    kind: "rcog",
  },
  {
    num: 24,
    org: "Royal College of Obstetricians and Gynaecologists (RCOG)",
    year: "2012",
    title: "Bacterial Sepsis in Pregnancy (Green-top Guideline No. 64a)",
    url: "https://www.rcog.org.uk/guidance/browse-all-guidance/green-top-guidelines/bacterial-sepsis-in-pregnancy-green-top-guideline-no-64a/",
    kind: "rcog",
  },
  {
    num: 25,
    org: "Royal College of Obstetricians and Gynaecologists (RCOG)",
    year: "2014",
    title: "Umbilical Cord Prolapse (Green-top Guideline No. 50)",
    url: "https://www.rcog.org.uk/guidance/browse-all-guidance/green-top-guidelines/umbilical-cord-prolapse-green-top-guideline-no-50/",
    kind: "rcog",
  },
  {
    num: 26,
    org: "Royal College of Obstetricians and Gynaecologists (RCOG)",
    year: "2015",
    title: "Thromboembolic Disease in Pregnancy and the Puerperium: Acute Management (Green-top Guideline No. 37b)",
    url: "https://www.rcog.org.uk/guidance/browse-all-guidance/green-top-guidelines/thromboembolic-disease-in-pregnancy-and-the-puerperium-acute-management-green-top-guideline-no-37b/",
    kind: "rcog",
  },
  {
    num: 27,
    org: "Royal College of Obstetricians and Gynaecologists (RCOG)",
    year: "2015",
    title: "Chickenpox in Pregnancy (Green-top Guideline No. 13)",
    url: "https://www.rcog.org.uk/guidance/browse-all-guidance/green-top-guidelines/chickenpox-in-pregnancy-green-top-guideline-no-13/",
    kind: "rcog",
  },
  {
    num: 28,
    org: "Royal College of Obstetricians and Gynaecologists (RCOG)",
    year: "2022",
    title: "Intrahepatic Cholestasis of Pregnancy (Green-top Guideline No. 43), BJOG 129(13), e95–e114",
    url: "https://pubmed.ncbi.nlm.nih.gov/35678192/",
    kind: "rcog",
  },
  {
    num: 29,
    org: "Royal College of Obstetricians and Gynaecologists (RCOG)",
    year: "2024",
    title: "Management of Nausea and Vomiting of Pregnancy and Hyperemesis Gravidarum (Green-top Guideline No. 69), BJOG 131(7), e1–e30",
    url: "https://pubmed.ncbi.nlm.nih.gov/38317415/",
    kind: "rcog",
  },
  {
    num: 30,
    org: "American College of Obstetricians and Gynecologists (ACOG)",
    year: "2018",
    title: "Practice Bulletin No. 196: Thromboembolism in pregnancy. Obstetrics & Gynecology, 132(1), e1–e17",
    url: "https://pubmed.ncbi.nlm.nih.gov/29939938/",
    kind: "acog",
  },
  {
    num: 31,
    org: "American College of Obstetricians and Gynecologists (ACOG)",
    year: "2020",
    title: "Gestational hypertension and preeclampsia: Practice Bulletin No. 222. Obstetrics & Gynecology, 135(6), e237–e260",
    url: "https://pubmed.ncbi.nlm.nih.gov/32443079/",
    kind: "acog",
  },
  {
    num: 32,
    org: "European Society of Cardiology (ESC)",
    year: "2018",
    title: "ESC Guidelines for the management of cardiovascular diseases during pregnancy. European Heart Journal, 39(34), 3165–3241",
    url: "https://pubmed.ncbi.nlm.nih.gov/30165544/",
    kind: "esc",
  },
  {
    num: 33,
    org: "U.S. Food and Drug Administration (FDA)",
    year: "2020",
    title: "FDA Drug Safety Communication: Avoiding NSAIDs in pregnancy at 20 weeks or later because they can result in low amniotic fluid",
    url: "https://www.fda.gov/drugs/drug-safety-and-availability",
    kind: "fda",
  },
  {
    num: 34,
    org: "Adewuya, A. O., Eegunranti, A. B. & Lawal, A. M.",
    year: "2005",
    title: "Prevalence of postnatal depression in Western Nigerian women: a controlled study. Int J Psychiatry Clin Pract, 9(1), 60–64",
    url: "https://pubmed.ncbi.nlm.nih.gov/24945340/",
    kind: "journal",
  },
  {
    num: 35,
    org: "Berglov, A., Hallager, S. & Weis, N.",
    year: "2019",
    title: "Hepatitis E during pregnancy: maternal and foetal case-fatality rates and adverse outcomes — a systematic review. J Viral Hepat, 26(11), 1240–1248",
    url: "https://pubmed.ncbi.nlm.nih.gov/31197913/",
    kind: "journal",
  },
  {
    num: 36,
    org: "Boafor, T. K., Olayemi, E., Galadanci, N., et al.",
    year: "2016",
    title: "Pregnancy outcomes in women with sickle-cell disease in low and high income countries: a systematic review and meta-analysis. BJOG, 123(5), 691–698",
    url: "https://pubmed.ncbi.nlm.nih.gov/26667608/",
    kind: "journal",
  },
  {
    num: 37,
    org: "Cox, J. L., Holden, J. M. & Sagovsky, R.",
    year: "1987",
    title: "Detection of postnatal depression: development of the 10-item Edinburgh Postnatal Depression Scale. Br J Psychiatry, 150(6), 782–786",
    url: "https://pubmed.ncbi.nlm.nih.gov/3651732/",
    kind: "journal",
  },
  {
    num: 38,
    org: "Dahiru, T. & Aliyu, A. A.",
    year: "2016",
    title: "Stillbirth in Nigeria: rates and risk factors based on 2013 Nigeria DHS. Open Access Library Journal, 3(8), 1–12",
    url: "https://doi.org/10.4236/oalib.1102749",
    kind: "journal",
  },
  {
    num: 39,
    org: "Daru, J., Zamora, J., Fernández-Félix, B. M., et al.",
    year: "2018",
    title: "Risk of maternal mortality in women with severe anaemia during pregnancy and post partum: a multilevel analysis. The Lancet Global Health, 6(5), e548–e554",
    url: "https://pubmed.ncbi.nlm.nih.gov/29571592/",
    kind: "journal",
  },
  {
    num: 40,
    org: "Eclampsia Trial Collaborative Group",
    year: "1995",
    title: "Which anticonvulsant for women with eclampsia? Evidence from the Collaborative Eclampsia Trial. The Lancet, 345(8963), 1455–1463",
    url: "https://pubmed.ncbi.nlm.nih.gov/7769899/",
    kind: "journal",
  },
  {
    num: 41,
    org: "Fakeye, T. O., Adisa, R. & Musa, I. E.",
    year: "2009",
    title: "Attitude and use of herbal medicines among pregnant women in Nigeria. BMC Complement Altern Med, 9(1), 53",
    url: "https://pubmed.ncbi.nlm.nih.gov/20043858/",
    kind: "journal",
  },
  {
    num: 42,
    org: "Federal Ministry of Health (FMOH) Nigeria",
    year: "2020",
    title: "National Guidelines for Diagnosis and Treatment of Malaria (4th ed.). Abuja: National Malaria Elimination Programme",
    url: "https://www.nmep.gov.ng",
    kind: "nigeria",
  },
  {
    num: 43,
    org: "Karaye, K. M., Ishaq, N. A., Sa'idu, H., et al. (PEACE Registry)",
    year: "2020",
    title: "Incidence, clinical characteristics, and risk factors of peripartum cardiomyopathy in Nigeria. ESC Heart Failure, 7(1), 235–243",
    url: "https://pubmed.ncbi.nlm.nih.gov/31990462/",
    kind: "journal",
  },
  {
    num: 44,
    org: "Liddle, S. D. & Pennick, V.",
    year: "2015",
    title: "Interventions for preventing and treating low-back and pelvic pain during pregnancy. Cochrane Database Syst Rev, (9), CD001139",
    url: "https://pubmed.ncbi.nlm.nih.gov/26422811/",
    kind: "journal",
  },
  {
    num: 45,
    org: "Luzzatto, L., Ally, M. & Notaro, R.",
    year: "2020",
    title: "Glucose-6-phosphate dehydrogenase deficiency. Blood, 136(11), 1225–1240",
    url: "https://pubmed.ncbi.nlm.nih.gov/32702756/",
    kind: "journal",
  },
  {
    num: 46,
    org: "Mbamara, S. U., Obiechina, N., Eleje, G. U., et al.",
    year: "2012",
    title: "Uterine rupture: a five-year review at a tertiary hospital in Nnewi, Southeast Nigeria. Niger J Clin Pract, 15(4), 445–449",
    url: "https://pubmed.ncbi.nlm.nih.gov/23238195/",
    kind: "journal",
  },
  {
    num: 47,
    org: "Musa, J., Mohammed, C., Ocheke, A., et al.",
    year: "2018",
    title: "Eclampsia in Nigeria: a 10-year review of clinical characteristics and fetomaternal outcomes in Jos. Trop J Obstet Gynaecol, 35(1), 35–41",
    url: "https://www.ajol.info/index.php/tjog",
    kind: "journal",
  },
  {
    num: 48,
    org: "National Population Commission (NPC) [Nigeria] & ICF",
    year: "2019",
    title: "Nigeria Demographic and Health Survey 2018",
    url: "https://dhsprogram.com/publications/publication-fr359-dhs-final-reports.cfm",
    kind: "nigeria",
  },
  {
    num: 49,
    org: "National Population Commission (NPC) [Nigeria] & ICF",
    year: "2024",
    title: "Nigeria Demographic and Health Survey 2023–24: Key Indicators Report",
    url: "https://dhsprogram.com/publications/publication-PR157-Preliminary-Reports-Key-Indicators-Reports.cfm",
    kind: "nigeria",
  },
  {
    num: 50,
    org: "Odinka, J. I., Nwoke, M., Chukwuorji, J. C., et al.",
    year: "2018",
    title: "Post-partum depression, anxiety and marital satisfaction: a perspective from Southeastern Nigeria. S Afr J Psychiatr, 24, 1109",
    url: "https://pubmed.ncbi.nlm.nih.gov/30263209/",
    kind: "journal",
  },
  {
    num: 51,
    org: "Oladapo, O. T., Adetoro, O. O., Ekele, B. A., et al. (Nigeria Near-Miss Network)",
    year: "2016",
    title: "When getting there is not enough: a nationwide cross-sectional study of 998 maternal deaths and 1451 near-misses in public tertiary hospitals in Nigeria. BJOG, 123(6), 928–938",
    url: "https://pubmed.ncbi.nlm.nih.gov/25974281/",
    kind: "journal",
  },
  {
    num: 52,
    org: "Ovadia, C., Seed, P. T., Sklavounos, A., et al.",
    year: "2019",
    title: "Association of adverse perinatal outcomes of intrahepatic cholestasis of pregnancy with biochemical markers: meta-analyses. The Lancet, 393(10174), 899–909",
    url: "https://pubmed.ncbi.nlm.nih.gov/30773280/",
    kind: "journal",
  },
  {
    num: 53,
    org: "Chuh, A., Zawar, V., Sciallis, G. F. & Kempf, W.",
    year: "2007",
    title: "Polymorphic eruption of pregnancy and viral exanthems in pregnancy. Int J Dermatol, 46(8), 795–802",
    url: "https://pubmed.ncbi.nlm.nih.gov/17651159/",
    kind: "journal",
  },
];

/** Short author tag shown on citation chips, e.g. "WHO", "NICE", "RCOG", "Daru et al." */
export function refTag(r: ClinicalRef): string {
  if (r.kind === "who") return "WHO";
  if (r.kind === "nice") return "NICE";
  if (r.kind === "rcog") return "RCOG";
  if (r.kind === "acog") return "ACOG";
  if (r.kind === "esc") return "ESC";
  if (r.kind === "fda") return "FDA";
  if (r.kind === "nigeria") return r.num === 42 ? "FMOH Nigeria" : "NDHS Nigeria";
  return `${r.org.split(",")[0]} et al.`.replace(" et al. et al.", " et al.");
}

/** Compact chip label, e.g. "WHO 2017", "NICE NG133", "RCOG GT57", "Daru 2018". */
export function refShort(r: ClinicalRef): string {
  const year = r.year.split(",")[0].split("–")[0];
  switch (r.kind) {
    case "who":
      return r.num === 13 ? `UNICEF ${year}` : `WHO ${year}`;
    case "nice": {
      const m = r.title.match(/\b((?:NG|CG|PH|QS|TA)\d+)\b/);
      return m ? `NICE ${m[1]}` : `NICE ${year}`;
    }
    case "rcog": {
      const m = r.title.match(/Green-top Guideline No\.\s*(\d+)/);
      return m ? `RCOG GT${m[1]}` : `RCOG ${year}`;
    }
    case "acog": {
      const m = r.title.match(/Bulletin No\.\s*(\d+)/);
      return m ? `ACOG PB${m[1]}` : `ACOG ${year}`;
    }
    case "esc":
      return `ESC ${year}`;
    case "fda":
      return `FDA ${year}`;
    case "nigeria":
      return r.num === 42 ? `FMOH ${year}` : `NDHS ${year}`;
    default: {
      const surname = r.org.split(",")[0].split(" ")[0];
      return `${surname} ${year}`;
    }
  }
}

export function refsByNums(nums: readonly number[]): ClinicalRef[] {
  return CLINICAL_REFS.filter((r) => nums.includes(r.num)).sort(
    (a, b) => a.num - b.num,
  );
}

export function refsGroupedByKind(): { kind: RefKind; label: string; refs: ClinicalRef[] }[] {
  return (Object.keys(REF_KIND_META) as RefKind[])
    .sort((a, b) => REF_KIND_META[a].order - REF_KIND_META[b].order)
    .map((kind) => ({
      kind,
      label: REF_KIND_META[kind].label,
      refs: CLINICAL_REFS.filter((r) => r.kind === kind),
    }));
}
