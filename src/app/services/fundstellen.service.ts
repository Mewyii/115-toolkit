import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export type AnsprechpartnerRolle = '-' | 'technik' | 'orga' | 'info' | 'pol-leitung' | 'öa' | 'quali';

export interface Ansprechpartner {
  mail: string;
  rolle: AnsprechpartnerRolle;
}

export type FundstellenType = 'XML' | 'MF' | 'XZF' | 'XZFI' | 'FBS';
export interface FundstellenInfoBase {
  Teilnehmername: string;
  teilnehmernummer: string;
  orgaid: string;
  'FS-name': string;
  typ: FundstellenType;
  url: string;
}

export interface FundstellenInfoExcel extends FundstellenInfoBase {
  'Hauptansprechpartner IT und Technik': string;
  'Hauptansprechpartner Personal und Organisation': string;
  Informationsmanager: string;
  'Politische Leitung': string;
  'Presse und Öffentlichkeitsarbeit': string;
  Qualitätsmanager: string;
}

export interface FundstellenInfo extends FundstellenInfoBase {
  ansprechpartner: Ansprechpartner[];
  hauptAnsprechpartnerEmail: string;
  hauptAnsprechpartnerRolle: AnsprechpartnerRolle;
}

type TypeInfos = { [key in FundstellenType]: number };

interface UrlInfo {
  url: string;
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class FundstellenService {
  public fundstellenInfos: FundstellenInfo[] = [];

  public typeInfos: TypeInfos = {
    FBS: 0,
    MF: 0,
    XML: 0,
    XZF: 0,
    XZFI: 0,
  };

  public ansprechpartner: { [key in AnsprechpartnerRolle]: number } = {
    technik: 0,
    'pol-leitung': 0,
    info: 0,
    orga: 0,
    quali: 0,
    öa: 0,
    '-': 0,
  };

  public ansprechpartnerCount: { [key: number]: number } = {};

  public urlInfos: UrlInfo[] = [];

  public logUrls: string[] = [];
  constructor() {}

  setFundstellenInfos(fundstellenInfos: FundstellenInfo[]) {
    const ansprechpartner = {
      technik: 0,
      'pol-leitung': 0,
      info: 0,
      orga: 0,
      quali: 0,
      öa: 0,
      '-': 0,
    };

    const ansprechpartnerCount: { [key: number]: number } = {};

    for (const fundstellenInfo of fundstellenInfos) {
      this.typeInfos[fundstellenInfo.typ]++;

      const coreUrl = fundstellenInfo.url.split('/').slice(0, 3).join('/') + '/';
      const urlInfoIndex = this.urlInfos.findIndex((x) => x.url === coreUrl);
      if (urlInfoIndex > -1) {
        this.urlInfos[urlInfoIndex].count++;
      } else {
        this.urlInfos.push({ url: coreUrl, count: 1 });
      }
      this.urlInfos.sort((a, b) => b.count - a.count);

      for (const partner of fundstellenInfo.ansprechpartner) {
        ansprechpartner[partner.rolle]++;
      }

      const currentCount = ansprechpartnerCount[fundstellenInfo.ansprechpartner.length];
      ansprechpartnerCount[fundstellenInfo.ansprechpartner.length] = currentCount ? currentCount + 1 : 1;
    }

    this.ansprechpartner = ansprechpartner;
    this.ansprechpartnerCount = ansprechpartnerCount;
    this.fundstellenInfos = fundstellenInfos;
  }

  setLogUrls(urls: string[]) {
    this.logUrls = urls;
  }
}
