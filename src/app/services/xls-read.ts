import * as XLSX from 'xlsx';

export interface WorkbookData {
  sheetData: { name: string; data: any[] }[];
}

export interface ReadFileOptions {
  firstLinesToSkip?: number;
}

export interface XlsWorkerRequest {
  id: number;
  buffer: ArrayBuffer;
  options?: ReadFileOptions;
}

export interface XlsWorkerResponse {
  id: number;
  workbookData?: WorkbookData;
  error?: string;
}

// Shared by the web worker and the main-thread fallback.
export function readWorkbook(data: ArrayBuffer, options?: ReadFileOptions): WorkbookData {
  const workbook = XLSX.read(data);
  const workbookData: WorkbookData = { sheetData: [] };

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    if (options?.firstLinesToSkip && sheet['!ref']) {
      const range = XLSX.utils.decode_range(sheet['!ref']);
      range.s.r = options.firstLinesToSkip;

      sheet['!ref'] = XLSX.utils.encode_range(range);
    }

    const sheetData = XLSX.utils.sheet_to_json(sheet) as any[];
    workbookData.sheetData.push({ name: sheetName, data: sheetData });
  }

  return workbookData;
}
