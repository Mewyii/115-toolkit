import { Injectable } from '@angular/core';
import { WorkbookData, XLSService } from './xls.service';
import { AnsprechpartnerRolle, FundstellenInfo, FundstellenInfoExcel } from './fundstellen.service';
import { KontaktInfo } from './verteiler.service';

@Injectable({
  providedIn: 'root',
})
export class ConverterService {
  constructor(private xlsService: XLSService) {}

  async getAndAggregateFundstellenExcelSheetData(file: File) {
    const workbookData = await this.xlsService.readFile(file);

    const excelData: FundstellenInfoExcel[] = workbookData.sheetData.find((x) => x.name === 'sc_benachrichtigung')?.data ?? [];

    const aggregatedData: FundstellenInfo[] = [];

    const fundstellenWithoutAnsprechpartner: FundstellenInfoExcel[] = [];

    for (let item of excelData) {
      const ansprechPartner = this.getAnsprechpartner(item);
      if (ansprechPartner) {
        const itemIndex = aggregatedData.findIndex((x) => x.url === item.url);

        if (itemIndex > -1) {
          const currentItem = aggregatedData[itemIndex];

          aggregatedData[itemIndex] = { ...currentItem, ansprechpartner: [...currentItem.ansprechpartner, ansprechPartner] };

          const newHauptAnsprechpartnerRolle = this.getHauptAnsprechpartnerRolle(currentItem.hauptAnsprechpartnerRolle, ansprechPartner.rolle);
          if (newHauptAnsprechpartnerRolle !== currentItem.hauptAnsprechpartnerRolle) {
            aggregatedData[itemIndex] = { ...aggregatedData[itemIndex], hauptAnsprechpartnerEmail: ansprechPartner.mail, hauptAnsprechpartnerRolle: ansprechPartner.rolle };
          }
        } else {
          aggregatedData.push({
            typ: item.typ,
            url: item.url,
            Teilnehmername: item.Teilnehmername,
            hauptAnsprechpartnerEmail: ansprechPartner.mail,
            hauptAnsprechpartnerRolle: ansprechPartner.rolle,
            teilnehmernummer: item.teilnehmernummer,
            orgaid: item.orgaid,
            'FS-name': item['FS-name'],
            ansprechpartner: [ansprechPartner],
          });
        }
      } else {
        fundstellenWithoutAnsprechpartner.push(item);
      }
    }

    for (const fundstelle of fundstellenWithoutAnsprechpartner) {
      if (!aggregatedData.some((x) => x.Teilnehmername === fundstelle.Teilnehmername)) {
        console.log(fundstelle.Teilnehmername);
      }
    }

    return aggregatedData.sort((a, b) => a.url.localeCompare(b.url));
  }

  convertDataArraysToWorkbookData(items: any[]): WorkbookData {
    return {
      sheetData: [{ name: 'Daten', data: items }],
    };
  }

  private getAnsprechpartner(item: FundstellenInfoExcel): { mail: string; rolle: AnsprechpartnerRolle } | undefined {
    if (this.itemPropertyExists(item['Hauptansprechpartner IT und Technik'])) {
      return { mail: item['Hauptansprechpartner IT und Technik'], rolle: 'technik' };
    } else if (this.itemPropertyExists(item['Hauptansprechpartner Personal und Organisation'])) {
      return { mail: item['Hauptansprechpartner Personal und Organisation'], rolle: 'orga' };
    } else if (this.itemPropertyExists(item.Informationsmanager)) {
      return { mail: item.Informationsmanager, rolle: 'info' };
    } else if (this.itemPropertyExists(item['Politische Leitung'])) {
      return { mail: item['Politische Leitung'], rolle: 'pol-leitung' };
    } else if (this.itemPropertyExists(item['Qualitätsmanager'])) {
      return { mail: item['Qualitätsmanager'], rolle: 'quali' };
    } else if (this.itemPropertyExists(item['Presse und Öffentlichkeitsarbeit'])) {
      return { mail: item['Presse und Öffentlichkeitsarbeit'], rolle: 'öa' };
    } else {
      return undefined;
    }
  }

  private itemPropertyExists(property?: string) {
    return property && property !== 'N/A' && property !== 'NULL';
  }

  private getHauptAnsprechpartnerRolle(oldRolle: AnsprechpartnerRolle, newRolle: AnsprechpartnerRolle) {
    const oldPrio = this.getHauptAnsprechpartnerPrio(oldRolle);
    const newPrio = this.getHauptAnsprechpartnerPrio(newRolle);
    if (newPrio > oldPrio) {
      return newRolle;
    } else {
      return oldRolle;
    }
  }

  private getHauptAnsprechpartnerPrio(rolle: AnsprechpartnerRolle) {
    switch (rolle) {
      case 'technik':
        return 6;
      case 'info':
        return 5;
      case 'quali':
        return 4;
      case 'pol-leitung':
        return 3;
      case 'orga':
        return 2;
      case 'öa':
        return 1;
      default:
        return 0;
    }
  }
}
