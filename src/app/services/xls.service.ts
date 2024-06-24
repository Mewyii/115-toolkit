import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface WorkbookData {
  sheetData: { name: string; data: any[] }[];
}

export interface SheetDataMapping<T> {
  name: string;
  mappingFunction: (entry: any) => T;
}

interface ReadFileOptions {
  firstLinesToSkip?: number;
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

    XLSX.writeFile(workbook, name + '.xlsx');
  }

  async readFile(file: File, options?: ReadFileOptions) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const workbookData: WorkbookData = { sheetData: [] };

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];

      if (options) {
        if (options.firstLinesToSkip) {
          const range = XLSX.utils.decode_range(sheet['!ref']!);
          range.s.r = options.firstLinesToSkip;

          sheet['!ref'] = XLSX.utils.encode_range(range);
        }
      }

      const sheetData = XLSX.utils.sheet_to_json(sheet) as any[];
      workbookData.sheetData.push({ name: sheetName, data: sheetData });
    }

    return workbookData;
  }

  async convertWorkbookDataToCustomData<T extends object>(
    workbookData: WorkbookData,
    sheetMappings: SheetDataMapping<T>[],
    getId?: (object: T) => string,
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

        if (getId) {
          const index = convertedData.findIndex((x) => getId(x) === getId(convertedSheetData));

          if (index > -1) {
            convertedData[index] = { ...convertedSheetData, ...convertedData[index] };
          } else {
            convertedData.push(convertedSheetData);
          }
          if (!getId(convertedSheetData)) {
            console.log('Missing ID:' + key);
          }
        } else {
          convertedData.push(convertedSheetData);
        }
      }
    }

    if (sortFunction) {
      return convertedData.sort((a, b) => sortFunction(a, b));
    }

    return convertedData;
  }

  exportAsCSV(name: string, data: any[], separator?: string) {
    const replacer = (key: any, value: any) => (value === null ? '' : value);
    const header = Object.keys(data[0]);
    let csv = data.map((row) => header.map((fieldName) => JSON.stringify(row[fieldName], replacer)).join(separator ?? ';'));
    csv.unshift(header.join(separator ?? ';'));
    let csvArray = csv.join('\r\n');

    const a = document.createElement('a');
    const blob = new Blob([csvArray], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    a.href = url;
    a.download = name + '.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }
}
