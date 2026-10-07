import type { BeschlussInfos, ProjektInfos, StandardInfos } from './fitko-website.component';

export interface ZuordnungResponse {
  zuordnungen: { id: string; relevanz?: 'direkt' | 'thematisch'; begruendung?: string }[];
}

export interface ErgaenzungResponse {
  schwerpunktthema?: string | null;
  themenbereich?: string[] | null;
  umsetzendeOrga?: string[] | null;
  verwaltungsbereiche?: string[] | null;
  kommunen?: string | null;
  umsetzungsfrist?: string | null;
  begruendung?: string;
}

// JSON schemas for structured outputs: enums restrict the AI to IDs/values that actually exist
export function createZuordnungSchema(ids: string[]) {
  return {
    type: 'object',
    properties: {
      zuordnungen: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', enum: uniqueValues(ids) },
            relevanz: { type: 'string', enum: ['direkt', 'thematisch'] },
            begruendung: { type: 'string' },
          },
          required: ['id', 'relevanz', 'begruendung'],
          additionalProperties: false,
        },
      },
    },
    required: ['zuordnungen'],
    additionalProperties: false,
  };
}

export function createErgaenzungSchema(missingFields: BeschlussErgaenzungsFeld[], listen: BeschlussAuswahllisten) {
  const enumList = (values: string[]) => ({ type: 'array', items: { type: 'string', enum: uniqueValues(values) } });

  const fieldSchemas: Record<BeschlussErgaenzungsFeld, unknown> = {
    schwerpunktthema: { type: 'string', enum: uniqueValues(listen.schwerpunktthemen) },
    themenbereich: enumList(listen.themenbereiche),
    umsetzendeOrga: enumList(listen.organisationen),
    verwaltungsbereiche: enumList(listen.verwaltungsbereiche),
    kommunen: { type: 'string', enum: ['Ja', 'Nein'] },
    umsetzungsfrist: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  };

  const properties: Record<string, unknown> = {};
  for (const field of missingFields) {
    properties[field] = fieldSchemas[field];
  }
  properties['begruendung'] = { type: 'string' };

  return {
    type: 'object',
    properties,
    required: [...missingFields, 'begruendung'],
    additionalProperties: false,
  };
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.map((x) => clean(x)).filter((x) => !!x)));
}

export interface BeschlussAuswahllisten {
  schwerpunktthemen: string[];
  themenbereiche: string[];
  organisationen: string[];
  verwaltungsbereiche: string[];
}

export type BeschlussErgaenzungsFeld =
  | 'schwerpunktthema'
  | 'themenbereich'
  | 'umsetzendeOrga'
  | 'verwaltungsbereiche'
  | 'kommunen'
  | 'umsetzungsfrist';

export function getMissingBeschlussFields(beschluss: BeschlussInfos): BeschlussErgaenzungsFeld[] {
  const fields: BeschlussErgaenzungsFeld[] = [
    'schwerpunktthema',
    'themenbereich',
    'umsetzendeOrga',
    'verwaltungsbereiche',
    'kommunen',
    'umsetzungsfrist',
  ];
  return fields.filter((field) => !clean(beschluss[field]));
}

export function createBeschlussErgaenzungPrompt(
  beschluss: BeschlussInfos,
  missingFields: BeschlussErgaenzungsFeld[],
  listen: BeschlussAuswahllisten,
): string {
  const fieldDescriptions: Record<BeschlussErgaenzungsFeld, string> = {
    schwerpunktthema: `"schwerpunktthema" (PFLICHT, genau ein Wert): Wähle genau einen Wert aus dieser Liste:\n${formatList(listen.schwerpunktthemen)}`,
    themenbereich: `"themenbereich" (OPTIONAL, Liste mit 0 bis n Werten): Wähle passende Werte aus dieser Liste. Wenn keiner eindeutig passt, gib eine leere Liste zurück:\n${formatList(listen.themenbereiche)}`,
    umsetzendeOrga: `"umsetzendeOrga" (OPTIONAL, Liste mit 0 bis n Werten): Organisationen, die laut Beschluss etwas umsetzen sollen. Wähle nur aus dieser Liste. Wenn der Beschluss dazu nichts aussagt, gib eine leere Liste zurück:\n${formatList(listen.organisationen)}`,
    verwaltungsbereiche: `"verwaltungsbereiche" (PFLICHT, Liste mit mindestens einem Wert): Verwaltungsbereiche, für die der Beschluss relevant ist. Wähle nur aus dieser Liste:\n${formatList(listen.verwaltungsbereiche)}`,
    kommunen: `"kommunen" (PFLICHT, "Ja" oder "Nein"): Ist der Beschluss für Kommunen relevant, z. B. weil Kommunen etwas umsetzen müssen oder direkt von den Ergebnissen betroffen sind?`,
    umsetzungsfrist: `"umsetzungsfrist" (OPTIONAL, Text oder null): Frist, bis zu der der Beschluss umgesetzt sein soll. Nur angeben, wenn sie sich aus dem Beschlusstext ableiten lässt (z. B. "31.12.2026" oder "bis Ende 2026"), sonst null.`,
  };

  const exampleValues: Record<BeschlussErgaenzungsFeld, string> = {
    schwerpunktthema: '"<Wert>"',
    themenbereich: '["<Wert>"]',
    umsetzendeOrga: '["<Wert>"]',
    verwaltungsbereiche: '["<Wert>"]',
    kommunen: '"Ja"',
    umsetzungsfrist: '"<Frist>" oder null',
  };

  const fieldList = missingFields.map((field, index) => `${index + 1}. ${fieldDescriptions[field]}`).join('\n\n');
  const exampleJson = missingFields.map((field) => `"${field}": ${exampleValues[field]}`).join(', ');

  return `Du bist Expertin bzw. Experte für die Digitalisierung der öffentlichen Verwaltung in Deutschland und kennst die Arbeit des IT-Planungsrats und der FITKO.

## Aufgabe
Zu dem folgenden Gremienbeschluss fehlen einige Angaben. Ergänze ausschließlich die unten aufgeführten Felder auf Basis des Beschlusses.
Verwende bei Auswahllisten die Werte exakt so, wie sie in der Liste stehen (gleiche Schreibweise). Erfinde keine neuen Werte.

## Beschluss
${formatBeschluss(beschluss)}

## Zu ergänzende Felder
${fieldList}

## Antwortformat
Antworte ausschließlich mit gültigem JSON ohne weitere Erläuterungen oder Markdown, das genau diese Felder enthält:
{${exampleJson}, "begruendung": "<kurze Begründung der Zuordnungen in ein bis zwei Sätzen>"}`;
}

export function createBeschlussStandardPrompt(beschluss: BeschlussInfos, standards: StandardInfos[]): string {
  const standardList = standards
    .filter((x) => !!clean(x.standardId))
    .map((x) => `- ID: ${clean(x.standardId)}\n  Titel: ${clean(x.titel)}\n  Kurzbeschreibung: ${clean(x.kurzbeschreibung) || '-'}`)
    .join('\n');

  return `Du bist Expertin bzw. Experte für die Digitalisierung der öffentlichen Verwaltung in Deutschland und kennst die Arbeit des IT-Planungsrats und der FITKO.

## Aufgabe
Ordne dem folgenden Gremienbeschluss die IT-Standards aus der Liste zu, zu denen er einen inhaltlichen Bezug hat.
Unterscheide dabei zwei Stufen:
- "direkt": Der Beschluss betrifft den Standard unmittelbar, z. B. weil er ihn beschließt, verbindlich erklärt, finanziert, weiterentwickelt, ändert, in Betrieb oder außer Betrieb nimmt, namentlich nennt oder einen Bericht dazu zur Kenntnis nimmt.
- "thematisch": Der Standard wird nicht genannt, ist aber für die Umsetzung oder das Thema des Beschlusses klar relevant (z. B. gleicher fachlicher Gegenstand, gleiches Vorhaben, Abkürzung oder Synonym des Standards).
Achte auch auf Abkürzungen, Synonyme und Umschreibungen der Standardtitel im Beschlusstext.
Ordne keine Standards zu, die nur sehr allgemein zur Verwaltungsdigitalisierung passen.

## Beschluss
${formatBeschluss(beschluss)}

## Verfügbare Standards
${standardList}

## Antwortformat
Antworte ausschließlich mit einem JSON-Objekt, ohne Markdown-Codeblock und ohne weiteren Text, in genau diesem Format:
{"zuordnungen": [{"id": "<Standard-ID>", "relevanz": "direkt" | "thematisch", "begruendung": "<kurze Begründung in einem Satz>"}]}
Verwende nur IDs exakt so, wie sie in der obigen Liste stehen. Wenn kein Standard passt, antworte mit {"zuordnungen": []}.`;
}

export function createBeschlussProjektPrompt(beschluss: BeschlussInfos, projekte: ProjektInfos[]): string {
  const projektList = projekte
    .filter((x) => !!clean(x.projektId))
    .map((x) => `- ID: ${clean(x.projektId)}\n  Name: ${clean(x.name)}\n  Kurzbeschreibung: ${clean(x.kurzbeschreibung) || '-'}`)
    .join('\n');

  return `Du bist Expertin bzw. Experte für die Digitalisierung der öffentlichen Verwaltung in Deutschland und kennst die Arbeit des IT-Planungsrats und der FITKO.

## Aufgabe
Ordne dem folgenden Gremienbeschluss die Projekte aus der Liste zu, zu denen er einen inhaltlichen Bezug hat.
Unterscheide dabei zwei Stufen:
- "direkt": Der Beschluss betrifft das Projekt unmittelbar, z. B. weil er es startet, beauftragt, finanziert, verlängert, ändert, abschließt, namentlich nennt oder dessen Ergebnisse bzw. Berichte zur Kenntnis nimmt.
- "thematisch": Das Projekt wird nicht genannt, behandelt aber denselben fachlichen Gegenstand oder setzt das Thema des Beschlusses klar um (z. B. gleiches Vorhaben, Abkürzung oder Synonym des Projektnamens).
Achte auch auf Abkürzungen, Synonyme und Umschreibungen der Projektnamen im Beschlusstext.
Ordne keine Projekte zu, die nur sehr allgemein zur Verwaltungsdigitalisierung passen.

## Beschluss
${formatBeschluss(beschluss)}

## Verfügbare Projekte
${projektList}

## Antwortformat
Antworte ausschließlich mit einem JSON-Objekt, ohne Markdown-Codeblock und ohne weiteren Text, in genau diesem Format:
{"zuordnungen": [{"id": "<Projekt-ID>", "relevanz": "direkt" | "thematisch", "begruendung": "<kurze Begründung in einem Satz>"}]}
Verwende nur IDs exakt so, wie sie in der obigen Liste stehen. Wenn kein Projekt passt, antworte mit {"zuordnungen": []}.`;
}

function formatList(values: string[]): string {
  return values
    .map((x) => clean(x))
    .filter((x) => !!x)
    .map((x) => `- ${x}`)
    .join('\n');
}

function formatBeschluss(beschluss: BeschlussInfos): string {
  const lines = [
    `Titel: ${clean(beschluss.titel)}`,
    `Beschlussnummer: ${clean(beschluss.beschlussnummer)}`,
    `Gremium: ${clean(beschluss.gremium)}`,
    `Art: ${clean(beschluss.art)}`,
    `Sitzung: ${clean(beschluss.sitzung)}`,
    `Schwerpunktthema: ${clean(beschluss.schwerpunktthema)}`,
    `Themenbereich: ${clean(beschluss.themenbereich)}`,
    `Umsetzende Organisation: ${clean(beschluss.umsetzendeOrga)}`,
    `Relevanz für Verwaltungsbereiche: ${clean(beschluss.verwaltungsbereiche)}`,
    `Relevanz für Kommunen: ${clean(beschluss.kommunen)}`,
    `Umsetzungsfrist: ${clean(beschluss.umsetzungsfrist)}`,
    `Beschlusstext:\n${clean(beschluss.beschlusstext)}`,
  ];

  return lines.filter((line) => !/:\s*$/.test(line)).join('\n');
}

// Beschlusstexte can contain HTML markup from the source system
function clean(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
