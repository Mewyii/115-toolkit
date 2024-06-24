import { Injectable } from '@angular/core';
import { WorkbookData, XLSService } from './xls.service';
import { KontaktInfo } from './verteiler.service';

@Injectable({
  providedIn: 'root',
})
export class ConverterService {
  constructor(private xlsService: XLSService) {}

  convertDataArraysToWorkbookData(items: any[]): WorkbookData {
    return {
      sheetData: [{ name: 'Daten', data: items }],
    };
  }
}
