import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { readWorkbook, ReadFileOptions, WorkbookData, XlsWorkerResponse } from './xls-read';

export type { ReadFileOptions, WorkbookData } from './xls-read';

export interface SheetDataMapping<T> {
  name: string;
  mappingFunction: (entry: any) => T;
}

@Injectable({
  providedIn: 'root',
})
export class XLSService {
  private worker?: Worker;
  private nextRequestId = 0;
  private pendingRequests = new Map<number, { resolve: (data: WorkbookData) => void; reject: (error: Error) => void }>();

  constructor() {}

  private getWorker() {
    if (!this.worker && typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./xls.worker', import.meta.url), { type: 'module' });
      this.worker.onmessage = ({ data }: MessageEvent<XlsWorkerResponse>) => {
        const request = this.pendingRequests.get(data.id);
        if (!request) {
          return;
        }
        this.pendingRequests.delete(data.id);
        if (data.error || !data.workbookData) {
          request.reject(new Error(data.error ?? 'Unknown error while reading workbook'));
        } else {
          request.resolve(data.workbookData);
        }
      };
      this.worker.onerror = (event) => {
        const error = new Error(event.message || 'XLS worker failed');
        this.pendingRequests.forEach((request) => request.reject(error));
        this.pendingRequests.clear();
      };
    }
    return this.worker;
  }

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
    const buffer = await file.arrayBuffer();
    const worker = this.getWorker();

    if (!worker) {
      return readWorkbook(buffer, options);
    }

    const id = this.nextRequestId++;
    return new Promise<WorkbookData>((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      // Transfer the buffer instead of copying it.
      worker.postMessage({ id, buffer, options }, [buffer]);
    });
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
