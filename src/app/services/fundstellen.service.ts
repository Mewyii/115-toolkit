import { Injectable } from '@angular/core';

export type FundstellenType = 'XML' | 'MF' | 'XZF' | 'XZFI' | 'FBS';
export type FundstellenStatus = 'aktiv' | 'inaktiv';
export type TeilnehmerStatus = '115-Teilnehmer' | 'Basisabdeckung' | 'Ungültig';

export interface TeilnehmerWithFundstelle {
  teilnehmernummer: string;
  name: string;
  kurzName: string;
  land: string;
  status: FundstellenStatus;
  fundstelle: FundstellenInfo;
}

export interface FundstellenInfo {
  type: FundstellenType;
  beschreibung: string;
  status: FundstellenStatus;
  url: string;
}

export type FundstellenTypeInfos = { [key in FundstellenType]: number };

export interface FundstellenUrlInfo {
  type: FundstellenType;
  url: string;
  count: number;
  teilnehmer: string[];
}

@Injectable({
  providedIn: 'root',
})
export class FundstellenService {
  public teilnehmerWithFundstellen: TeilnehmerWithFundstelle[] = [];

  public typeInfos: FundstellenTypeInfos = this.getInitialTypeInfos();

  public urlInfos: FundstellenUrlInfo[] = [];

  public logUrls: string[] = [];
  constructor() {}

  setTeilnehmerWithFundstellen(teilnehmerWithFundstellen: TeilnehmerWithFundstelle[]) {
    this.typeInfos = this.getInitialTypeInfos();

    for (const teilnehmerWithFundstelle of teilnehmerWithFundstellen) {
      this.typeInfos[teilnehmerWithFundstelle.fundstelle.type]++;

      const coreUrl = teilnehmerWithFundstelle.fundstelle.url.split('/').slice(0, 3).join('/') + '/';
      const urlInfoIndex = this.urlInfos.findIndex((x) => x.url === coreUrl && x.type === teilnehmerWithFundstelle.fundstelle.type);
      if (urlInfoIndex > -1) {
        this.urlInfos[urlInfoIndex].count++;
        this.urlInfos[urlInfoIndex].teilnehmer.push(teilnehmerWithFundstelle.name);
      } else {
        this.urlInfos.push({ url: coreUrl, count: 1, type: teilnehmerWithFundstelle.fundstelle.type, teilnehmer: [teilnehmerWithFundstelle.name] });
      }
      this.urlInfos.sort((a, b) => b.count - a.count);
    }

    this.teilnehmerWithFundstellen = teilnehmerWithFundstellen;
  }

  setLogUrls(urls: string[]) {
    this.logUrls = urls;
  }

  private getInitialTypeInfos() {
    return {
      FBS: 0,
      MF: 0,
      XML: 0,
      XZF: 0,
      XZFI: 0,
    };
  }
}
