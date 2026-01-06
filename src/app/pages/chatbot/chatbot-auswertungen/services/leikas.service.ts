import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import * as XLSX from 'xlsx';

interface LeikaInfo {
  key: number;
  name: string;
  lage?: string;
}

interface LeikaRawEntry {
  Schluessel: number;
  Bezeichnung2?: string;
  Bezeichnung: string;
  'Portalverbund Lagen': string;
}

@Injectable()
export class LeikasService {
  constructor(private http: HttpClient) {}

  readonly leikas$ = this.loadLeikas().pipe(shareReplay(1));

  private loadLeikas(): Observable<LeikaInfo[]> {
    return this.http
      .get('assets/leikas/leika_leistungen_de.csv', {
        responseType: 'arraybuffer',
      })
      .pipe(map((buffer) => this.parseCsv(buffer)));
  }

  private parseCsv(buffer: ArrayBuffer): LeikaInfo[] {
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
      .map((entry) => ({
        key: entry['Schluessel'],
        name: entry['Bezeichnung2'] ?? entry['Bezeichnung'],
        lage: entry['Portalverbund Lagen'],
      }));
  }
}
