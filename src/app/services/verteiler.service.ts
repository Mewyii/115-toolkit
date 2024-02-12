import { Injectable } from '@angular/core';
import { SheetDataMapping, XLSService } from './xls.service';

export interface KontaktInfo {
  Teilnehmer: string;
  Nachname?: string;
  Vorname?: string;
  Straße?: string;
  PLZ?: string;
  Ort?: string;
  Bundesland?: string;
  Telefon?: string;
  Mobil?: string;
  EMail: string;
  Vertretung?: string;
  ZAG?: boolean;
  'AG Betrieb'?: boolean;
  'AG Qualität'?: boolean;
  'AG ÖA'?: boolean;
  'TAG Strategie'?: boolean;
  CAB?: boolean;
  'AG Wissensmanagement'?: boolean;
  Serviccenterleiter?: boolean;
  Landesansprechpartner?: boolean;
  'Operativer Ausfall'?: boolean;
  'Lenkungsausschuss-Arbeitsebene'?: boolean;
  Alumni?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class VerteilerService {
  public sheetMappings: SheetDataMapping<KontaktInfo>[] = [
    {
      name: 'AG Betrieb',
      mappingFunction: (entry) => ({
        Teilnehmer: entry['Firma1 kein Ersatz'],
        Nachname: entry.Nachname,
        Vorname: entry.Vorname,
        Straße: entry['Straße Postfach'],
        PLZ: entry.PLZ,
        Ort: entry.Ort,
        Bundesland: entry.Bundesland,
        Telefon: entry.Telefon,
        Mobil: entry.Mobil,
        EMail: entry.EMail,
        'AG Betrieb': true,
      }),
    },
    {
      name: 'AG ÖA',
      mappingFunction: (entry) => ({
        Teilnehmer: entry['Firma1'],
        Nachname: entry.Nachname,
        Vorname: entry.Vorname,
        PLZ: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[0] : '',
        Ort: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[1] : '',
        Bundesland: entry.Bundesland,
        Telefon: entry.Telefon,
        EMail: entry.schaefer,
        'AG ÖA': true,
      }),
    },
    {
      name: 'AG Qualität',
      mappingFunction: (entry) => ({
        Teilnehmer: entry['Firma1'],
        Nachname: entry.Nachname,
        Vorname: entry.Vorname,
        Straße: entry['Straße Postfach'],
        PLZ: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[0] : '',
        Ort: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[1] : '',
        Bundesland: entry.Bundesland,
        Telefon: entry.Telefon,
        EMail: entry.EMail,
        'AG Qualität': true,
      }),
    },
    {
      name: 'ZAG',
      mappingFunction: (entry) => ({
        Teilnehmer: entry['Firma1'],
        Nachname: entry.Nachname,
        Vorname: entry.Vorname,
        Straße: entry['Straße Postfach'],
        PLZ: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[0] : '',
        Ort: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[1] : '',
        Bundesland: entry.Bundesland,
        Telefon: entry.Telefon,
        EMail: entry.EMail,
        Vertretung: entry['Vertreter (CC)'],
        ZAG: true,
      }),
    },
    {
      name: 'CAB',
      mappingFunction: (entry) => ({
        Teilnehmer: entry['Firma1'],
        Nachname: entry.Nachname,
        Vorname: entry.Vorname,
        Straße: entry['Straße Postfach'],
        PLZ: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[0] : '',
        Ort: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[1] : '',
        Bundesland: entry.Bundesland,
        Telefon: entry.Telefon,
        EMail: entry.EMail,
        CAB: true,
      }),
    },
    {
      name: 'TAG Strategie',
      mappingFunction: (entry) => ({
        Teilnehmer: entry['Firma1'],
        Nachname: entry.Nachname,
        Vorname: entry.Vorname,
        Straße: entry['Straße Postfach'],
        PLZ: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[0] : '',
        Ort: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[1] : '',
        Bundesland: entry.Bundesland,
        Telefon: entry.Telefon,
        EMail: entry.EMail,
        'TAG Strategie': true,
      }),
    },
    {
      name: 'AG Wissensmanagement',
      mappingFunction: (entry) => ({
        Teilnehmer: entry['Firma1'],
        Nachname: entry.Nachname,
        Vorname: entry.Vorname,
        Straße: entry['Straße Postfach'],
        PLZ: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[0] : '',
        Ort: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[1] : '',
        Bundesland: entry.Bundesland,
        Telefon: entry.Telefon,
        EMail: entry.EMail,
        'AG Wissensmanagement': true,
      }),
    },
    {
      name: 'Servicecenterleiter',
      mappingFunction: (entry) => ({
        Teilnehmer: entry['Firma1'],
        Nachname: entry.Nachname,
        Vorname: entry.Vorname,
        Straße: entry['Straße Postfach'],
        PLZ: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[0] : '',
        Ort: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[1] : '',
        Bundesland: entry.Bundesland,
        Telefon: entry.Telefon,
        EMail: entry.EMail,
        Servicecenterleiter: true,
      }),
    },
    {
      name: 'Landesansprechpartner',
      mappingFunction: (entry) => ({
        Teilnehmer: entry['Firma1'],
        Nachname: entry.Nachname,
        Vorname: entry.Vorname,
        Straße: entry['Straße Postfach'],
        PLZ: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[0] : '',
        Ort: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[1] : '',
        Bundesland: entry.Bundesland,
        Telefon: entry.Telefon,
        EMail: entry.EMail,
        Landesansprechpartner: true,
      }),
    },
    {
      name: 'Operativer Ausfall',
      mappingFunction: (entry) => ({
        Teilnehmer: entry['Firma1'],
        Nachname: entry.Nachname,
        Vorname: entry.Vorname,
        Straße: entry['Straße Postfach'],
        PLZ: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[0] : '',
        Ort: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[1] : '',
        Bundesland: entry.Bundesland,
        Telefon: entry.Telefon,
        EMail: entry.EMail,
        'Operativer Ausfall': true,
      }),
    },
    {
      name: 'Lenkungsausschuss-Arbeitsebene',
      mappingFunction: (entry) => ({
        Teilnehmer: entry['Firma1'],
        Nachname: entry.Nachname,
        Vorname: entry.Vorname,
        Straße: entry['Straße Postfach'],
        PLZ: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[0] : '',
        Ort: entry['PLZ Ort'] ? entry['PLZ Ort'].split(' ')[1] : '',
        Bundesland: entry.Bundesland,
        Telefon: entry.Telefon,
        EMail: entry.EMail,
        'Lenkungsausschuss-Arbeitsebene': true,
      }),
    },
    {
      name: 'Alumni',
      mappingFunction: (entry) => ({
        Teilnehmer: entry.Teilnehmer,
        Nachname: entry.Nachname,
        Vorname: entry.Vorname,
        EMail: entry.Email,
        Alumni: true,
      }),
    },
  ];

  public kontaktInfos: KontaktInfo[] = [];
  constructor(private xlsService: XLSService) {}

  async getAndAggregateVerteilerExcelSheetData(file: File) {
    const workbookData = await this.xlsService.readFile(file);

    const aggregatedData: KontaktInfo[] = [];

    for (const verteilerSheet of this.sheetMappings) {
      const excelData: any[] = workbookData.sheetData.find((x) => x.name === verteilerSheet.name)?.data ?? [];

      if (excelData.length < 1) {
        console.log('Table not found or empty: ' + verteilerSheet.name);
      }

      for (const entry of excelData) {
        const contactInfo = verteilerSheet.mappingFunction(entry);

        const index = aggregatedData.findIndex((x) => (x.EMail ?? '').toLocaleLowerCase() === (contactInfo.EMail ?? '').toLocaleLowerCase());

        if (index > -1) {
          aggregatedData[index] = { ...contactInfo, ...aggregatedData[index] };
        } else {
          aggregatedData.push(contactInfo);
        }

        if (!contactInfo.Teilnehmer) {
          console.log('Missing ID:' + verteilerSheet.name + contactInfo.Vorname + contactInfo.Nachname);
        }
      }
    }

    this.kontaktInfos = aggregatedData.sort((a, b) => a.Teilnehmer.localeCompare(b.Teilnehmer));

    return this.kontaktInfos;
  }
}
