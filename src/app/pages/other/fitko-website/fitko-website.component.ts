import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { ConverterService, SheetDataMapping, XLSService } from 'src/app/services';
import { FoundryConfig, parseJsonResponse, sendPromptToFoundry } from './portfolio-ai';
import { convertBeschluesse, convertProjekte, convertSitzungen, convertStandards } from './portfolio-converter';
import {
  BeschlussAuswahllisten,
  BeschlussErgaenzungsFeld,
  createBeschlussErgaenzungPrompt,
  createBeschlussProjektPrompt,
  createBeschlussStandardPrompt,
  createErgaenzungSchema,
  createZuordnungSchema,
  ErgaenzungResponse,
  getMissingBeschlussFields,
  ZuordnungResponse,
} from './portfolio-prompts';
import { BeschlussProjekt, BeschlussStandard, Portfolio } from './portfolio-schema';

export interface BeschlussInfos {
  titel: string;
  gremium: string;
  art: string;
  beschlussnummer: string;
  sitzung: string;
  beschlussdatum: string;
  beschlusstext: string;
  beschlussanlagen: string;
  beschlussergebnis: string;
  highlight: string;
  highlightBeschreibung: string;
  schwerpunktthema: string;
  themenbereich: string;
  umsetzendeOrga: string;
  verwaltungsbereiche: string;
  kommunen: string;
  umsetzungsfrist: string;
}

export interface SitzungInfos {
  gremium: string;
  titel: string;
  datum: string;
}

export interface StandardInfos {
  titel: string;
  standardId: string;
  finanzierungDurchITPLR: string;
  verbindlichDurchITPLR: string;
  status: string;
  kurzbeschreibung: string;
  teaser: string;
  standardtyp: string;
  themenbereich1: string;
  themenbereich1Begruendung: string;
  themenbereich2: string;
  themenbereich2Begruendung: string;
  themenbereich3: string;
  themenbereich3Begruendung: string;
  weitereThemenbereiche: string;
  weitereThemenbereicheBegruendung: string;
  steuerung: string;
  betriebskonzeptLink: string;
  rechtlicheGrundlage: string;
  betreiber: string;
  verwaltungsbereiche: string[];
  verwaltungsbereicheBegruendung: string;
  kommunen: string;
  kommunenBegruendung: string;
  weiterfuehrendeLinks: string;
  ansprechperson: string;
  logo: string;
  standardverbund: string;
}

export interface ProjektInfos {
  name: string;
  projektId: string;
  status: string;
  startdatum: string;
  enddatum: string;
  kurzbeschreibung: string;
  teaser: string;
  schwerpunktthema: string;
  themenbereich1: string;
  themenbereich1Begruendung: string;
  themenbereich2: string;
  themenbereich2Begruendung: string;
  themenbereich3: string;
  themenbereich3Begruendung: string;
  weitereThemenbereiche: string;
  weitereThemenbereicheBegruendung: string;
  projektart: string;
  verantwortlicheOrga: string;
  projektleitung: string;
  projektbeteiligte: string;
  verwaltungsbereiche: string[];
  verwaltungsbereicheBegruendung: string;
  kommunen: string;
  kommunenBegruendung: string;
  budget: string;
  finanzierung: string;
  ausgangslage: string;
  projektziele: string;
  erwarteteErgebnisse: string;
  meilensteine: string;
  ergebnisse: string;
  ansprechperson: string;
  weiterfuehrendeLinks: string;
}

export interface OrganisationInfos {
  organisation: string;
}

export interface SchwerpunktthemaInfos {
  schwerpunktthema: string;
}

export interface ThemenbereichInfos {
  themenbereich: string;
}

export interface VerwaltungsbereichInfos {
  verwaltungsbereich: string;
}

@Component({
  selector: 'app-fitko-website',
  templateUrl: './fitko-website.component.html',
  styleUrls: ['./fitko-website.component.scss'],
  standalone: false,
})
export class FitkoWebsiteComponent implements OnInit {
  public beschlussInfosInitial: BeschlussInfos[] = [];
  public sitzungInfosInitial: SitzungInfos[] = [];
  public beschlussStandardLinks: BeschlussStandard[] = [];
  public beschlussProjektLinks: BeschlussProjekt[] = [];
  public standardInfosInitial: StandardInfos[] = [];
  public projektInfosInitial: ProjektInfos[] = [];
  public organisationInfosInitial: OrganisationInfos[] = [];
  public schwerpunktthemaInfosInitial: SchwerpunktthemaInfos[] = [];
  public themenbereichInfosInitial: ThemenbereichInfos[] = [];
  public verwaltungsbereichInfosInitial: VerwaltungsbereichInfos[] = [];
  public markenbekanntheitsInfos: BeschlussInfos[] = [];
  public duplicates: BeschlussInfos[] = [];

  public infosAreLoading = false;

  // Entered by the user at runtime so that no credentials are stored in the frontend code
  public aiEndpoint = '';
  public aiApiKey = '';
  public aiDeploymentName = 'claude-haiku-5-5';

  public beschluessePageIndex = 0;
  public beschluessePageSize = 5;

  private loadingBeschluesse = new Set<string>();

  private sheetMapping: SheetDataMapping<BeschlussInfos>[] = [
    {
      name: 'Beschluss',
      mappingFunction: (entry) => ({
        titel: entry['Titel*'],
        gremium: entry['Gremium*'],
        art: entry['Art*'],
        beschlussnummer: entry['Beschlussnummer'],
        sitzung: entry['Sitzung*'],
        beschlussdatum: entry['Beschlussdatum*'],
        beschlusstext: entry['Beschlusstext*'],
        beschlussanlagen: entry['Beschlussanlagen'],
        beschlussergebnis: entry['Beschlussergebnis (nur für FIT-AB, ggf. FIT-SB)'],
        highlight: entry['Highlight-/Top-Beschluss'],
        highlightBeschreibung: entry['Kurzbeschreibung bei Highlight-Beschluss'],
        schwerpunktthema: entry['Schwerpunkt-thema'],
        themenbereich: entry['Zuordnung Themenbereich'],
        umsetzendeOrga: entry['Umsetzende Organisation'],
        verwaltungsbereiche: entry['Relevanz für Verwaltungsbereiche'],
        kommunen: entry['Relevanz für Kommunen'],
        umsetzungsfrist: entry['Umsetzungsfrist'],
      }),
    },
  ];

  private sitzungSheetMapping: SheetDataMapping<SitzungInfos>[] = [
    {
      name: 'Sitzung',
      mappingFunction: (entry) => ({
        gremium: entry['Gremium'],
        titel: entry['Titel'],
        datum: entry['Datum'],
      }),
    },
  ];

  private standardSheetMapping: SheetDataMapping<StandardInfos>[] = [
    {
      name: 'Standard',
      mappingFunction: (entry) => ({
        titel: entry['Titel'],
        standardId: entry['Standard-ID'],
        finanzierungDurchITPLR: entry['Finanzierung durch IT-Planungsrat'],
        verbindlichDurchITPLR: entry['Durch IT-Planungsrat verbindlich erklärt'],
        status: entry['Status'],
        kurzbeschreibung: entry['Kurzbeschreibung'],
        teaser: entry['Teaser'],
        standardtyp: entry['Standardtyp'],
        themenbereich1: entry['Zuordnung Themenbereich 1'],
        themenbereich1Begruendung: entry['Begründung Zuordnung Themenbereich 1'],
        themenbereich2: entry['Zuordnung Themenbereich 2'],
        themenbereich2Begruendung: entry['Begründung Zuordnung Themenbereich 2'],
        themenbereich3: entry['Zuordnung Themenbereich 3'],
        themenbereich3Begruendung: entry['Begründung Zuordnung Themenbereich 3'],
        weitereThemenbereiche: entry['Weitere Themenbereiche'],
        weitereThemenbereicheBegruendung: entry['Begründung weitere Themenbereiche'],
        steuerung: entry['Steuerung'],
        betriebskonzeptLink: entry['Link zum Betriebskonzept'],
        rechtlicheGrundlage: entry['Rechtliche Grundlage'],
        betreiber: entry['Betreiber'],
        verwaltungsbereiche: [
          entry['Relevanz für Verwaltungsbereiche'],
          entry['Relevanz für Verwaltungsbereiche 2'],
          entry['Relevanz für Verwaltungsbereiche 3'],
          entry['Relevanz für Verwaltungsbereiche 4'],
          entry['Relevanz für Verwaltungsbereiche 5'],
          entry['Relevanz für Verwaltungsbereiche 6'],
        ].filter((x) => !!x),
        verwaltungsbereicheBegruendung: entry['Begründung für Zuordnung der Verwaltungsbereiche'],
        kommunen: entry['Relevanz für Kommunen'],
        kommunenBegruendung: entry['Begründung Relevanz für Kommunen'],
        weiterfuehrendeLinks: entry['Relevante weiterführende Links'],
        ansprechperson: entry['Ansprechperson'],
        logo: entry['Logo'],
        standardverbund: entry['Standardverbund'],
      }),
    },
  ];

  private projektSheetMapping: SheetDataMapping<ProjektInfos>[] = [
    {
      name: 'Projekt',
      mappingFunction: (entry) => ({
        name: entry['Name'],
        projektId: entry['Projekt-ID'],
        status: entry['Status'],
        startdatum: entry['Startdatum'],
        enddatum: entry['Enddatum'],
        kurzbeschreibung: entry['Kurzbeschreibung'],
        teaser: entry['Teaser'],
        // The header in the sheet contains a trailing space
        schwerpunktthema: entry['Schwerpunkt-thema '] ?? entry['Schwerpunkt-thema'],
        themenbereich1: entry['Zuordnung Themenbereich 1'],
        themenbereich1Begruendung: entry['Begründung Zuordnung Themenbereich 1'],
        themenbereich2: entry['Zuordnung Themenbereich 2'],
        themenbereich2Begruendung: entry['Begründung Zuordnung Themenbereich 2'],
        themenbereich3: entry['Zuordnung Themenbereich 3'],
        themenbereich3Begruendung: entry['Begründung Zuordnung Themenbereich 3'],
        weitereThemenbereiche: entry['Weitere Themenbereiche'],
        weitereThemenbereicheBegruendung: entry['Begründung weitere Themenbereiche'],
        projektart: entry['Projektart'],
        verantwortlicheOrga: entry['Verantwortliche Organisation'],
        projektleitung: entry['Projektleitung'],
        projektbeteiligte: entry['Projektbeteiligte'],
        verwaltungsbereiche: [
          entry['Relevanz für Verwaltungsbereiche'],
          entry['Relevanz für Verwaltungsbereiche 2'],
          entry['Relevanz für Verwaltungsbereiche 3'],
          entry['Relevanz für Verwaltungsbereiche 4'],
          entry['Relevanz für Verwaltungsbereiche 5'],
          entry['Relevanz für Verwaltungsbereiche 6'],
        ].filter((x) => !!x),
        verwaltungsbereicheBegruendung: entry['Begründung für Zuordnung der Verwaltungsbereiche'],
        kommunen: entry['Relevanz für Kommunen'],
        kommunenBegruendung: entry['Begründung Relevanz für Kommunen'],
        budget: entry['Budget'],
        finanzierung: entry['Finanzierung'],
        ausgangslage: entry['Ausgangslage - Warum wurde das Projekt gestartet?'],
        projektziele: entry['Projektziele - Was soll konkret erreicht werden?'],
        erwarteteErgebnisse: entry['Erwartete Ergebnisse'],
        meilensteine: entry['Zeitliche Meilensteine'],
        ergebnisse: entry['Ergebnisse'],
        ansprechperson: entry['Ansprechperson'],
        weiterfuehrendeLinks: entry['Relevante weiterführende Links'],
      }),
    },
  ];

  private organisationSheetMapping: SheetDataMapping<OrganisationInfos>[] = [
    {
      name: 'Auswahlliste Organisation',
      mappingFunction: (entry) => ({
        organisation: entry['Organisation'],
      }),
    },
  ];

  private schwerpunktthemaSheetMapping: SheetDataMapping<SchwerpunktthemaInfos>[] = [
    {
      name: 'Auswahlliste Schwerpunktthema',
      mappingFunction: (entry) => ({
        schwerpunktthema: entry['Schwerpunktthema'],
      }),
    },
  ];

  private themenbereichSheetMapping: SheetDataMapping<ThemenbereichInfos>[] = [
    {
      name: 'Auswahlliste Themenbereich',
      mappingFunction: (entry) => ({
        themenbereich: entry['Themenbereich'],
      }),
    },
  ];

  private verwaltungsbereichSheetMapping: SheetDataMapping<VerwaltungsbereichInfos>[] = [
    {
      name: 'Auswahlliste Verwaltungsbereich',
      mappingFunction: (entry) => ({
        verwaltungsbereich: entry['Verwaltungsbereich'],
      }),
    },
  ];

  constructor(
    public xlsService: XLSService,
    public converterService: ConverterService,
  ) {}

  ngOnInit(): void {}

  async onStammdatenExcelFileSelected(event: Event) {
    this.infosAreLoading = true;

    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    const workbookData = await this.xlsService.readFile(file);

    this.beschlussInfosInitial = await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.sheetMapping);
    this.beschluessePageIndex = 0;
    this.sitzungInfosInitial = (await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.sitzungSheetMapping)).filter((x) => !!x.titel);
    this.standardInfosInitial = await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.standardSheetMapping);
    this.projektInfosInitial = await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.projektSheetMapping);
    this.organisationInfosInitial = (await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.organisationSheetMapping)).filter((x) => !!x.organisation);
    this.schwerpunktthemaInfosInitial = (await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.schwerpunktthemaSheetMapping)).filter(
      (x) => !!x.schwerpunktthema,
    );
    this.themenbereichInfosInitial = (await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.themenbereichSheetMapping)).filter((x) => !!x.themenbereich);
    this.verwaltungsbereichInfosInitial = (await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.verwaltungsbereichSheetMapping)).filter(
      (x) => !!x.verwaltungsbereich,
    );

    this.infosAreLoading = false;
    input.value = '';
  }

  // Beschlusstexte may contain HTML, so tags are stripped before truncating to avoid broken markup
  getPlainText(html: string | undefined) {
    if (!html) {
      return '';
    }
    return String(html)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  getTruncatedText(html: string | undefined, maxLength = 200) {
    const text = this.getPlainText(html);
    return text.length > maxLength ? text.substring(0, maxLength).trimEnd() + '…' : text;
  }

  getBeschluessePage() {
    const start = this.beschluessePageIndex * this.beschluessePageSize;
    return this.beschlussInfosInitial.slice(start, start + this.beschluessePageSize);
  }

  onBeschluessePageChanged(event: PageEvent) {
    this.beschluessePageIndex = event.pageIndex;
    this.beschluessePageSize = event.pageSize;
  }

  getStandardLinksForBeschluss(beschlussNummer: string) {
    return this.beschlussStandardLinks.filter((x) => x.beschlussNummer === beschlussNummer);
  }

  getProjektLinksForBeschluss(beschlussNummer: string) {
    return this.beschlussProjektLinks.filter((x) => x.beschlussNummer === beschlussNummer);
  }

  isBeschlussLoading(beschluss: BeschlussInfos) {
    return this.loadingBeschluesse.has(beschluss.beschlussnummer);
  }

  async onCreateLinksClicked(beschluss: BeschlussInfos) {
    const config: FoundryConfig = { endpoint: this.aiEndpoint, apiKey: this.aiApiKey, deploymentName: this.aiDeploymentName };
    this.loadingBeschluesse.add(beschluss.beschlussnummer);

    try {
      const missingFields = getMissingBeschlussFields(beschluss);
      if (missingFields.length > 0) {
        const listen: BeschlussAuswahllisten = {
          schwerpunktthemen: this.schwerpunktthemaInfosInitial.map((x) => x.schwerpunktthema),
          themenbereiche: this.themenbereichInfosInitial.map((x) => x.themenbereich),
          organisationen: this.organisationInfosInitial.map((x) => x.organisation),
          verwaltungsbereiche: this.verwaltungsbereichInfosInitial.map((x) => x.verwaltungsbereich),
        };
        const ergaenzungPrompt = createBeschlussErgaenzungPrompt(beschluss, missingFields, listen);
        const ergaenzungSchema = createErgaenzungSchema(missingFields, listen);

        const ergaenzungResponse = await sendPromptToFoundry(config, ergaenzungPrompt, ergaenzungSchema);
        console.log('Ergänzung', beschluss.beschlussnummer, ergaenzungResponse);
        this.applyErgaenzung(beschluss, missingFields, parseJsonResponse<ErgaenzungResponse>(ergaenzungResponse));
      }

      const standardPrompt = createBeschlussStandardPrompt(beschluss, this.standardInfosInitial);
      const projektPrompt = createBeschlussProjektPrompt(beschluss, this.projektInfosInitial);

      const [standardResponse, projektResponse] = await Promise.all([
        sendPromptToFoundry(config, standardPrompt, createZuordnungSchema(this.standardInfosInitial.map((x) => x.standardId))),
        sendPromptToFoundry(config, projektPrompt, createZuordnungSchema(this.projektInfosInitial.map((x) => x.projektId))),
      ]);
      console.log('Standards', beschluss.beschlussnummer, standardResponse);
      console.log('Projekte', beschluss.beschlussnummer, projektResponse);

      const standardZuordnungen = parseJsonResponse<ZuordnungResponse>(standardResponse).zuordnungen ?? [];
      const projektZuordnungen = parseJsonResponse<ZuordnungResponse>(projektResponse).zuordnungen ?? [];

      this.beschlussStandardLinks = [
        ...this.beschlussStandardLinks.filter((x) => x.beschlussNummer !== beschluss.beschlussnummer),
        ...standardZuordnungen.flatMap((zuordnung) => {
          const standard = this.standardInfosInitial.find((x) => String(x.standardId).trim() === String(zuordnung.id).trim());
          if (!standard) {
            console.warn(`Unbekannte Standard-ID von der KI: ${zuordnung.id}`);
            return [];
          }
          return [
            {
              beschlussNummer: beschluss.beschlussnummer,
              standardId: standard.standardId,
              standardName: standard.titel,
              relevanz: zuordnung.relevanz,
              begruendung: zuordnung.begruendung,
            },
          ];
        }),
      ];

      this.beschlussProjektLinks = [
        ...this.beschlussProjektLinks.filter((x) => x.beschlussNummer !== beschluss.beschlussnummer),
        ...projektZuordnungen.flatMap((zuordnung) => {
          const projekt = this.projektInfosInitial.find((x) => String(x.projektId).trim() === String(zuordnung.id).trim());
          if (!projekt) {
            console.warn(`Unbekannte Projekt-ID von der KI: ${zuordnung.id}`);
            return [];
          }
          return [
            {
              beschlussNummer: beschluss.beschlussnummer,
              projektId: projekt.projektId,
              projektName: projekt.name,
              relevanz: zuordnung.relevanz,
              begruendung: zuordnung.begruendung,
            },
          ];
        }),
      ];
    } catch (e) {
      console.error(e);
      alert('Fehler beim Aufruf der KI: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      this.loadingBeschluesse.delete(beschluss.beschlussnummer);
    }
  }

  // Only fills fields that were empty before; list values are joined with "; " so the converter can split them again
  private applyErgaenzung(beschluss: BeschlussInfos, missingFields: BeschlussErgaenzungsFeld[], response: ErgaenzungResponse) {
    for (const field of missingFields) {
      const value = response[field];
      if (value === undefined || value === null) {
        continue;
      }

      const text = Array.isArray(value) ? value.join('; ') : String(value);
      if (text.trim()) {
        beschluss[field] = text;
      }
    }
  }

  onSaveDataToJSONFileClicked() {
    const portfolio: Portfolio = {
      beschlüsse: convertBeschluesse(this.beschlussInfosInitial),
      sitzungen: convertSitzungen(this.sitzungInfosInitial),
      standards: convertStandards(this.standardInfosInitial),
      projekte: convertProjekte(this.projektInfosInitial),
      'beschluss/standard': this.beschlussStandardLinks.map((x) => ({ beschlussNummer: x.beschlussNummer, standardId: x.standardId })),
      'beschluss/projekt': this.beschlussProjektLinks.map((x) => ({ beschlussNummer: x.beschlussNummer, projektId: x.projektId })),
    };

    this.downloadJsonFile('Portfolio', portfolio);
  }

  private downloadJsonFile(fileName: string, data: unknown) {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }
}
