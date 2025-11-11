import { Component, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import {
  ConverterService,
  FundstellenService,
  FundstellenStatus,
  FundstellenType,
  SheetDataMapping,
  TeilnehmerWithFundstelle,
  FundstellenUrlInfo,
  XLSService,
  FundstellenTypeInfos,
} from 'src/app/services';

@Component({
    selector: 'app-fundstellen-auswertung',
    templateUrl: './fundstellen-auswertung.component.html',
    styleUrls: ['./fundstellen-auswertung.component.scss'],
    standalone: false
})
export class FundstellenAuswertungComponent implements OnInit {
  public urlInfos: FundstellenUrlInfo[] = [];

  public typeInfos: FundstellenTypeInfos = this.getInitialTypeInfos();

  public shownTypes: { [key in FundstellenType]: boolean } = {
    FBS: true,
    MF: true,
    XML: true,
    XZF: true,
    XZFI: true,
  };

  public shownStatus: { [key in FundstellenStatus]: boolean } = {
    aktiv: true,
    inaktiv: true,
  };

  private sheetMapping: SheetDataMapping<TeilnehmerWithFundstelle>[] = [
    {
      name: 'Fundstellelist v1.0 (BIRT 4.8.0',
      mappingFunction: (entry) => ({
        teilnehmernummer: entry.teilnehmernummer,
        name: entry.name,
        kurzName: entry.kurzname,
        land: entry.staat,
        status: entry.status,
        fundstelle: {
          type: entry['FS typ'],
          beschreibung: entry['FS Beschreibung'],
          status: entry['FS status'],
          url: entry['FS url'],
        },
      }),
    },
  ];

  constructor(public xlsService: XLSService, public fundstellenService: FundstellenService, public converterService: ConverterService) {}

  ngOnInit(): void {}

  async onFundstellenExcelFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    const workbookData = await this.xlsService.readFile(file);

    const teilnehmerWithFundstellen = await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.sheetMapping);

    this.fundstellenService.setTeilnehmerWithFundstellen(teilnehmerWithFundstellen);

    this.filterTeilnehmerWithFundstellen();

    input.value = '';
  }

  getType(key: string) {
    return this.shownTypes[key as FundstellenType];
  }

  updateTypeFilter(key: string, event: MatCheckboxChange) {
    const value = event.checked;
    this.shownTypes[key as FundstellenType] = value;

    this.filterTeilnehmerWithFundstellen();
  }

  updateStatusFilter(key: string, event: MatCheckboxChange) {
    const value = event.checked;
    this.shownStatus[key as FundstellenStatus] = value;

    this.filterTeilnehmerWithFundstellen();
  }

  filterTeilnehmerWithFundstellen() {
    this.urlInfos = [];
    this.typeInfos = this.getInitialTypeInfos();

    const filteredTeilnehmer = this.fundstellenService.teilnehmerWithFundstellen.filter(
      (x) => this.shownTypes[x.fundstelle.type] === true && this.shownStatus[x.fundstelle.status] === true
    );
    for (const teilnehmerWithFundstelle of filteredTeilnehmer) {
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
