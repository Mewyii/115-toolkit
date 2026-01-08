import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import * as XLSX from 'xlsx';

interface LeikaInfo {
  key: number;
  name: string;
  lage?: string;
  lageCode?: string;
}

interface LeikaRawEntry {
  Schluessel: number;
  Bezeichnung2?: string;
  Bezeichnung: string;
  'Portalverbund Lagen': string;
  'Portalverbund Lagen Codes': number;
}

interface LagenInfo {
  code: string;
  description: string;
}

interface LagenRawEntry {
  code: string;
  'description-de-DE': string;
}

@Injectable()
export class LeikasService {
  constructor(private http: HttpClient) {}

  readonly leikas$ = this.loadLeikas().pipe(shareReplay(1));
  readonly lagen$ = this.loadLagen().pipe(shareReplay(1));

  private loadLagen(): Observable<LagenInfo[]> {
    return this.http
      .get('assets/leikas/pv_lagen.csv', {
        responseType: 'arraybuffer',
      })
      .pipe(
        map((buffer) =>
          this.parseCsv<LagenInfo>(buffer, (entry: LagenRawEntry) => ({
            code: entry.code.toString(),
            description: entry['description-de-DE'],
          }))
        )
      );
  }

  private loadLeikas(): Observable<LeikaInfo[]> {
    return this.http
      .get('assets/leikas/leika_leistungen_de.csv', {
        responseType: 'arraybuffer',
      })
      .pipe(
        map((buffer) =>
          this.parseCsv<LeikaInfo>(buffer, (entry: LeikaRawEntry) => ({
            key: entry['Schluessel'],
            name: entry['Bezeichnung2'] ?? entry['Bezeichnung'],
            lage: entry['Portalverbund Lagen'],
            lageCode: entry['Portalverbund Lagen Codes'] ? entry['Portalverbund Lagen Codes'].toString() : '',
          }))
        )
      );
  }

  private parseCsv<T extends Object>(buffer: ArrayBuffer, map: (entry: any) => T): T[] {
    const workbook = XLSX.read(buffer, {
      type: 'array',
      codepage: 1252,
      FS: ';',
    });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    return XLSX.utils
      .sheet_to_json<LeikaRawEntry>(sheet, {
        defval: null,
      })
      .map((entry) => map(entry));
  }
}
