import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface WorkbookData {
  sheetData: { name: string; data: any[] }[];
}

export interface SheetDataMapping<T> {
  name: string;
  mappingFunction: (entry: any) => T;
}

@Injectable({
  providedIn: 'root',
})
export class XLSService {
  constructor() {}

  exportFile(name: string, workbookData: WorkbookData) {
    const workbook = XLSX.utils.book_new();

    for (const sheet of workbookData.sheetData) {
      const worksheet = XLSX.utils.json_to_sheet(sheet.data);

      workbook.SheetNames.push(sheet.name);
      workbook.Sheets[sheet.name] = worksheet;
    }

    XLSX.writeFile(workbook, name);
  }

  async readFile(file: File) {
    const data = await file.arrayBuffer();

    var workbook = XLSX.read(data);
    const workbookData: WorkbookData = { sheetData: [] };
    for (const sheetName of workbook.SheetNames) {
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];
      workbookData.sheetData.push({ name: sheetName, data: sheetData });
    }
    return workbookData;
  }

  async convertWorkbookDataToCustomData<T extends object>(
    workbookData: WorkbookData,
    sheetMappings: SheetDataMapping<T>[],
    getId: (object: T) => string,
    sortFunction?: (a: T, b: T) => number
  ) {
    const convertedData: T[] = [];

    for (const sheetMapping of sheetMappings) {
      const excelData: any[] = workbookData.sheetData.find((x) => x.name === sheetMapping.name)?.data ?? [];

      if (excelData.length < 1) {
        console.log('Table not found or empty: ' + sheetMapping.name);
      }

      for (const [key, entry] of excelData.entries()) {
        const convertedSheetData = sheetMapping.mappingFunction(entry);

        const index = convertedData.findIndex((x) => getId(x) === getId(convertedSheetData));

        if (index > -1) {
          convertedData[index] = { ...convertedSheetData, ...convertedData[index] };
        } else {
          convertedData.push(convertedSheetData);
        }

        if (!getId(convertedSheetData)) {
          console.log('Missing ID:' + key);
        }
      }
    }

    if (sortFunction) {
      return convertedData.sort((a, b) => sortFunction(a, b));
    }

    return convertedData;
  }
}
