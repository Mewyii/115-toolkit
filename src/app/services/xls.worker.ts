/// <reference lib="webworker" />

import * as XLSX from 'xlsx';
import * as cptable from 'xlsx/dist/cpexcel';
import { readWorkbook, XlsWorkerRequest, XlsWorkerResponse } from './xls-read';

(XLSX as any).set_cptable(cptable);

addEventListener('message', ({ data }: MessageEvent<XlsWorkerRequest>) => {
  try {
    const workbookData = readWorkbook(data.buffer, data.options);
    postMessage({ id: data.id, workbookData } as XlsWorkerResponse);
  } catch (error) {
    postMessage({ id: data.id, error: error instanceof Error ? error.message : String(error) } as XlsWorkerResponse);
  }
});
