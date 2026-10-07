import type { BeschlussInfos, ProjektInfos, SitzungInfos, StandardInfos } from './fitko-website.component';
import {
  BESCHLUSS_ARTEN,
  BESCHLUSS_ERGEBNISSE,
  Beschluss,
  GREMIEN,
  IsoDate,
  Link,
  ORGANISATIONEN,
  PROJEKT_ARTEN,
  PROJEKT_STATUS,
  Projekt,
  SCHWERPUNKT_THEMEN,
  STANDARD_STATUS,
  STANDARD_TYPEN,
  STANDARD_VERBUENDE,
  Sitzung,
  Standard,
  THEMEN_BEREICHE,
  VERWALTUNGS_BEREICHE,
} from './portfolio-schema';

export function convertBeschluesse(beschluesse: BeschlussInfos[]): Beschluss[] {
  return beschluesse.filter((x) => !!toText(x.beschlussnummer)).map((x) => convertBeschluss(x));
}

export function convertBeschluss(infos: BeschlussInfos): Beschluss {
  const context = 'Beschluss ' + toText(infos.beschlussnummer);

  return {
    titel: toText(infos.titel) ?? '',
    gremium: toEnum(infos.gremium, GREMIEN, context, 'gremium') ?? ('' as any),
    art: toEnum(infos.art, BESCHLUSS_ARTEN, context, 'art') ?? ('' as any),
    beschlussNummer: toText(infos.beschlussnummer) ?? '',
    sitzung: toText(infos.sitzung) ?? '',
    beschlussDatum: toIsoDate(infos.beschlussdatum) ?? '',
    beschlussText: toText(infos.beschlusstext) ?? '',
    beschlussAnlagen: toLinks(infos.beschlussanlagen),
    beschlussErgebnis: toEnum(infos.beschlussergebnis, BESCHLUSS_ERGEBNISSE, context, 'beschlussErgebnis'),
    istHighlightBeschluss: toBoolean(infos.highlight),
    highlightBeschlussBeschreibung: toText(infos.highlightBeschreibung),
    schwerpunktThema: toEnum(infos.schwerpunktthema, SCHWERPUNKT_THEMEN, context, 'schwerpunktThema'),
    themenBereiche: toEnumList(infos.themenbereich, THEMEN_BEREICHE, context, 'themenBereiche'),
    umsetzendeOrganisationen: toEnumList(infos.umsetzendeOrga, ORGANISATIONEN, context, 'umsetzendeOrganisationen'),
    relevanzFürVerwaltungsbereiche: toEnumList(infos.verwaltungsbereiche, VERWALTUNGS_BEREICHE, context, 'relevanzFürVerwaltungsbereiche'),
    istRelevantFürKommunen: toBoolean(infos.kommunen),
    umsetzungsFrist: toText(infos.umsetzungsfrist),
  };
}

export function convertSitzungen(sitzungen: SitzungInfos[]): Sitzung[] {
  return sitzungen.filter((x) => !!toText(x.titel)).map((x) => convertSitzung(x));
}

export function convertSitzung(infos: SitzungInfos): Sitzung {
  const context = 'Sitzung ' + toText(infos.titel);

  return {
    gremium: toEnum(infos.gremium, GREMIEN, context, 'gremium') ?? ('' as any),
    titel: toText(infos.titel) ?? '',
    datum: toIsoDate(infos.datum) ?? '',
  };
}

export function convertStandards(standards: StandardInfos[]): Standard[] {
  return standards.filter((x) => !!toText(x.standardId)).map((x) => convertStandard(x));
}

export function convertStandard(infos: StandardInfos): Standard {
  const context = 'Standard ' + toText(infos.standardId);

  return {
    titel: toText(infos.titel) ?? '',
    standardId: toText(infos.standardId) ?? '',
    'istITPLR-finanziert': toBoolean(infos.finanzierungDurchITPLR),
    istVerbindlich: toBoolean(infos.verbindlichDurchITPLR),
    status: toEnum(infos.status, STANDARD_STATUS, context, 'status'),
    kurzBeschreibung: toText(infos.kurzbeschreibung),
    teaser: toText(infos.teaser),
    standardTyp: toEnum(infos.standardtyp, STANDARD_TYPEN, context, 'standardTyp'),
    themenBereiche: toEnumListFromValues(
      [infos.themenbereich1, infos.themenbereich2, infos.themenbereich3, infos.weitereThemenbereiche],
      THEMEN_BEREICHE,
      context,
      'themenBereiche',
    ),
    steuerung: toText(infos.steuerung),
    betriebsKonzept: toLinks(infos.betriebskonzeptLink)?.[0],
    rechtlicheGrundlage: toText(infos.rechtlicheGrundlage),
    betreiber: toText(infos.betreiber),
    relevanzFürVerwaltungsbereiche: toEnumListFromValues(infos.verwaltungsbereiche, VERWALTUNGS_BEREICHE, context, 'relevanzFürVerwaltungsbereiche'),
    istRelevantFürKommunen: toBoolean(infos.kommunen),
    relevanteLinks: toLinks(infos.weiterfuehrendeLinks),
    ansprechPerson: toText(infos.ansprechperson),
    logo: toLinks(infos.logo)?.[0],
    standardVerbund: toEnum(infos.standardverbund, STANDARD_VERBUENDE, context, 'standardVerbund'),
  };
}

export function convertProjekte(projekte: ProjektInfos[]): Projekt[] {
  return projekte.filter((x) => !!toText(x.projektId)).map((x) => convertProjekt(x));
}

export function convertProjekt(infos: ProjektInfos): Projekt {
  const context = 'Projekt ' + toText(infos.projektId);

  return {
    name: toText(infos.name) ?? '',
    projektId: toText(infos.projektId) ?? '',
    status: toEnum(infos.status, PROJEKT_STATUS, context, 'status'),
    startDatum: toIsoDate(infos.startdatum),
    endDatum: toIsoDate(infos.enddatum),
    kurzBeschreibung: toText(infos.kurzbeschreibung),
    teaser: toText(infos.teaser),
    schwerpunktThema: toEnum(infos.schwerpunktthema, SCHWERPUNKT_THEMEN, context, 'schwerpunktThema'),
    themenBereiche: toEnumListFromValues(
      [infos.themenbereich1, infos.themenbereich2, infos.themenbereich3, infos.weitereThemenbereiche],
      THEMEN_BEREICHE,
      context,
      'themenBereiche',
    ),
    projektArt: toEnum(infos.projektart, PROJEKT_ARTEN, context, 'projektArt'),
    organisation: toText(infos.verantwortlicheOrga),
    projektLeitung: toText(infos.projektleitung),
    projektBeteiligte: toText(infos.projektbeteiligte),
    relevanzFürVerwaltungsbereiche: toEnumListFromValues(infos.verwaltungsbereiche, VERWALTUNGS_BEREICHE, context, 'relevanzFürVerwaltungsbereiche'),
    istRelevantFürKommunen: toBoolean(infos.kommunen),
    budget: toText(infos.budget),
    finanzierung: toText(infos.finanzierung),
    ausgangsLage: toText(infos.ausgangslage),
    projektZiele: toText(infos.projektziele),
    erwarteteErgebnisse: toText(infos.erwarteteErgebnisse),
    'historie/meilensteine': toText(infos.meilensteine),
    ergebnisse: toText(infos.ergebnisse),
    ansprechPerson: toText(infos.ansprechperson),
    relevanteLinks: toLinks(infos.weiterfuehrendeLinks),
  };
}

function toText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = String(value).trim();
  return text ? text : undefined;
}

function toBoolean(value: unknown): boolean | undefined {
  const text = toText(value)?.toLowerCase();
  if (text === undefined) {
    return undefined;
  }
  return ['ja', 'x', 'true', 'wahr', '1', 'yes'].includes(text);
}

// Excel delivers dates either as serial numbers or as text (e.g. "24.03.2025")
function toIsoDate(value: unknown): IsoDate | undefined {
  if (typeof value === 'number') {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return date.toISOString().substring(0, 10);
  }

  const text = toText(value);
  if (!text) {
    return undefined;
  }

  const germanDate = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (germanDate) {
    const [, day, month, year] = germanDate;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return text;
}

function splitList(value: unknown): string[] {
  const text = toText(value);
  if (!text) {
    return [];
  }
  return text
    .split(/[;,\n]/)
    .map((x) => x.trim())
    .filter((x) => !!x);
}

function toEnum<T extends string>(value: unknown, allowed: readonly T[], context: string, field: string): T | undefined {
  const text = toText(value);
  if (!text) {
    return undefined;
  }

  const match = allowed.find((x) => x.toLowerCase() === text.toLowerCase());
  if (!match) {
    console.warn(`${context}: Unbekannter Wert für "${field}": "${text}"`);
    return text as T;
  }
  return match;
}

function toEnumList<T extends string>(value: unknown, allowed: readonly T[], context: string, field: string): T[] | undefined {
  const values = splitList(value)
    .map((x) => toEnum(x, allowed, context, field))
    .filter((x): x is T => !!x);

  return values.length ? values : undefined;
}

// Combines several Excel columns (each possibly containing a list) into one de-duplicated list
function toEnumListFromValues<T extends string>(values: unknown[], allowed: readonly T[], context: string, field: string): T[] | undefined {
  const result = values.flatMap((x) => toEnumList(x, allowed, context, field) ?? []);
  const unique = Array.from(new Set(result));

  return unique.length ? unique : undefined;
}

function toLinks(value: unknown): Link[] | undefined {
  const text = toText(value);
  if (!text) {
    return undefined;
  }

  const links = text
    .split(/\n/)
    .map((x) => x.trim())
    .filter((x) => !!x)
    .map((line) => {
      const url = line.match(/https?:\/\/\S+/)?.[0];
      const linkText = url
        ? line
            .replace(url, '')
            .replace(/[:\-–|]\s*$/, '')
            .trim()
        : line;
      return { text: linkText || url, url } as Link;
    });

  return links.length ? links : undefined;
}
