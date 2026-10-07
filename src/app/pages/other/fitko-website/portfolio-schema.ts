// TypeScript definitions for "Schema Portfolio.json" (JSON Schema draft 2020-12).
// Property names match the JSON keys of the schema so objects can be serialized directly.

export interface Link {
  text?: string;
  url?: string;
}

export const BESCHLUSS_ARTEN = ['Beschluss', 'Information'] as const;
export type BeschlussArt = (typeof BESCHLUSS_ARTEN)[number];

export const BESCHLUSS_ERGEBNISSE = ['einstimmig angenommen', 'mehrheitlich angenommen'] as const;
export type BeschlussErgebnis = (typeof BESCHLUSS_ERGEBNISSE)[number];

export const SCHWERPUNKT_THEMEN = [
  'Digitale Transformation',
  'Digitale Infrastruktur',
  'Digitale Anwendungen',
  'Datennutzung',
  'Informationssicherheit',
  'Übergreifend',
] as const;
export type SchwerpunktThema = (typeof SCHWERPUNKT_THEMEN)[number];

export const THEMEN_BEREICHE = [
  'OZG/Ende-zu-Ende-Digitalisierung',
  'NOOTS',
  'EfA - Einer für Alle',
  'Deutschland-Architektur',
  'D-Stack',
  'Marktplätze',
] as const;
export type ThemenBereich = (typeof THEMEN_BEREICHE)[number];

export const VERWALTUNGS_BEREICHE = [
  'Agrar',
  'Arbeit & Soziales',
  'Bau',
  'Digitales',
  'Energie',
  'Gesundheit',
  'Finanzen',
  'Inneres',
  'Jugend & Familie',
  'Umwelt',
  'Verkehr',
  'Wirtschaft',
  'Bildung',
  'Sport',
  'Justiz/E-Justice',
] as const;
export type VerwaltungsBereich = (typeof VERWALTUNGS_BEREICHE)[number];

export const ORGANISATIONEN = [
  'FITKO',
  'Bund',
  'Baden-Württemberg',
  'Bayern',
  'Berlin',
  'Brandenburg',
  'Bremen',
  'Hamburg',
  'Hessen',
  'Mecklenburg-Vorpommern',
  'Niedersachsen',
  'Nordrhein-Westfalen',
  'Rheinland-Pfalz',
  'Saarland',
  'Sachsen',
  'Sachsen-Anhalt',
  'Schleswig-Holstein',
  'Thüringen',
] as const;
export type Organisation = (typeof ORGANISATIONEN)[number];

export const GREMIEN = [
  'IT-Planungsrat',
  'AL-Runde',
  'Föderales IT-Architekturboard',
  'Föderale IT-Standardisierungsboard',
] as const;
export type Gremium = (typeof GREMIEN)[number];

export const STANDARD_STATUS = [
  'Identifizierung und Bedarfsmeldung',
  'Prüfung und Bewertung',
  'Umsetzung',
  'Überführung in Regelbetrieb',
  'Regelbetrieb und Monitoring',
  'Dekommissionierung',
] as const;
export type StandardStatus = (typeof STANDARD_STATUS)[number];

export const STANDARD_TYPEN = [
  'Architektur-Standard',
  'Taxonomie',
  'Technisch-fachliche Klassifizierungen',
  'Datenstruktur',
  'Designsprachen und -systeme',
  'Datenaustausch-Standard',
  'Transport- und Sicherheits-Standard',
] as const;
export type StandardTyp = (typeof STANDARD_TYPEN)[number];

export const STANDARD_VERBUENDE = ['DCAT-AP.de', 'XBau', 'XBildung', 'XStandards Einkauf', 'Servicestandard'] as const;
export type StandardVerbund = (typeof STANDARD_VERBUENDE)[number];

export const PROJEKT_ARTEN = [
  'Vorprojekt',
  'Machbarkeitstudie',
  'Umsetzungsprojekt',
  'Föderales Digitalisierungsprojekt',
] as const;
export type ProjektArt = (typeof PROJEKT_ARTEN)[number];

export const PROJEKT_STATUS = ['aktiv', 'abgeschlossen'] as const;
export type ProjektStatus = (typeof PROJEKT_STATUS)[number];

export const STEUERUNGS_ANSAETZE = [
  '1 - FITKO als Owner',
  '2 - FITKO als Partner',
  '3 - FITKO als Auftraggeberin',
] as const;
export type SteuerungsAnsatz = (typeof STEUERUNGS_ANSAETZE)[number];

/** ISO date string (YYYY-MM-DD) */
export type IsoDate = string;
export type Email = string;

export interface Beschluss {
  titel: string;
  gremium: Gremium;
  art: BeschlussArt;
  beschlussNummer: string;
  sitzung: string;
  beschlussDatum: IsoDate;
  beschlussText: string;
  beschlussAnlagen?: Link[];
  beschlussErgebnis?: BeschlussErgebnis;
  istHighlightBeschluss?: boolean;
  highlightBeschlussBeschreibung?: string;
  schwerpunktThema?: SchwerpunktThema;
  themenBereiche?: ThemenBereich[];
  umsetzendeOrganisationen?: Organisation[];
  relevanzFürVerwaltungsbereiche?: VerwaltungsBereich[];
  istRelevantFürKommunen?: boolean;
  umsetzungsFrist?: string;
}

export interface Sitzung {
  gremium: Gremium;
  titel: string;
  datum: IsoDate;
}

export interface Standard {
  titel: string;
  standardId: string;
  'istITPLR-finanziert'?: boolean;
  istVerbindlich?: boolean;
  status?: StandardStatus;
  kurzBeschreibung?: string;
  teaser?: string;
  standardTyp?: StandardTyp;
  themenBereiche?: ThemenBereich[];
  steuerung?: string;
  betriebsKonzept?: Link;
  rechtlicheGrundlage?: string;
  betreiber?: string;
  relevanzFürVerwaltungsbereiche?: VerwaltungsBereich[];
  istRelevantFürKommunen?: boolean;
  relevanteLinks?: Link[];
  ansprechPerson?: Email;
  logo?: Link;
  standardVerbund?: StandardVerbund;
}

export interface Projekt {
  name: string;
  projektId: string;
  status?: ProjektStatus;
  startDatum?: IsoDate;
  endDatum?: IsoDate;
  kurzBeschreibung?: string;
  teaser?: string;
  // Schema key is "schwerpunktThema " (trailing space) – assumed to be a typo
  schwerpunktThema?: SchwerpunktThema;
  themenBereiche?: ThemenBereich[];
  projektArt?: ProjektArt;
  organisation?: string;
  projektLeitung?: string;
  projektBeteiligte?: string;
  relevanzFürVerwaltungsbereiche?: VerwaltungsBereich[];
  istRelevantFürKommunen?: boolean;
  budget?: string;
  finanzierung?: string;
  ausgangsLage?: string;
  projektZiele?: string;
  erwarteteErgebnisse?: string;
  'historie/meilensteine'?: string;
  ergebnisse?: string;
  ansprechPerson?: Email;
  relevanteLinks?: Link[];
}

export interface ProduktHistorienEintrag {
  jahr?: number;
  highlightText?: string;
  beschlussId?: string;
}

export interface Produkt {
  id?: string;
  name: string;
  kurzBeschreibung: string;
  teaser?: string;
  themenBereiche: ThemenBereich[];
  steuerungsAnsatz: SteuerungsAnsatz;
  produktBoardMitglieder: Organisation[];
  istRelevantFürKommunen: boolean;
  dasKannDasProdukt: string;
  entwicklungsSchwerpunkte: string;
  beteiligungsMöglichkeit?: string;
  schnittstellen?: string;
  produktVorteile?: string;
  historie: ProduktHistorienEintrag[];
  referenzen?: string;
  dokumente?: string;
  ansprechPersonen: Email[];
  relevanteLinks?: Link[];
}

export interface BeschlussStandard {
  beschlussNummer: string;
  standardId: string;
  // Display helpers, not part of the JSON schema
  standardName?: string;
  relevanz?: 'direkt' | 'thematisch';
  begruendung?: string;
}

export interface BeschlussProjekt {
  beschlussNummer: string;
  projektId: string;
  // Display helpers, not part of the JSON schema
  projektName?: string;
  relevanz?: 'direkt' | 'thematisch';
  begruendung?: string;
}

export interface BeschlussProdukt {
  beschlussNummer?: string;
  produktId?: string;
}

export interface ProjektStandard {
  projektId?: string;
  standardId?: string;
}

// Schema defines "projektId" twice here (invalid JSON key duplication) – split into two distinct keys
export interface ProjektProjekt {
  projektId?: string;
  verknuepfteProjektId?: string;
}

export interface ProjektProdukt {
  projektId?: string;
  produktId?: string;
}

export interface ProduktStandard {
  produktId?: string;
  standardId?: string;
}

export interface Portfolio {
  beschlüsse?: Beschluss[];
  sitzungen?: Sitzung[];
  standards?: Standard[];
  projekte?: Projekt[];
  produkte?: Produkt[];
  'beschluss/standard'?: BeschlussStandard[];
  'beschluss/projekt'?: BeschlussProjekt[];
  'beschluss/produkt'?: BeschlussProdukt[];
  'projekt/standard'?: ProjektStandard[];
  'projekt/projekt'?: ProjektProjekt[];
  'projekt/produkt'?: ProjektProdukt[];
  'produkt/standard'?: ProduktStandard[];
}
