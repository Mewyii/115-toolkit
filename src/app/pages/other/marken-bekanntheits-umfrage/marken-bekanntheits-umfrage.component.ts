import { Component, OnInit } from '@angular/core';
import { ConverterService, SheetDataMapping, XLSService } from 'src/app/services';

export type TeilnehmerStatus = 'Kein 115-Teilnehmer' | 'Basisabdeckung' | '115-Teilnehmer';
export interface MarkenbekanntheitsInfos {
  Teilnehmernummer?: string;
  Kurzname: string;
  Bundesland?: string;
  Kreiszugehoerigkeit?: string;
  Status?: TeilnehmerStatus;
  Regionalschluessel: string;
  Gemeindeschluessel?: string;
  Verbundstart?: number;
}

export interface MarkenbekanntheitsInfosEnhanced extends MarkenbekanntheitsInfos {
  Name: string;
  IsDuplicate?: boolean;
  IsRenamed?: boolean;
}

@Component({
    selector: 'app-marken-bekanntheits-umfrage',
    templateUrl: './marken-bekanntheits-umfrage.component.html',
    styleUrls: ['./marken-bekanntheits-umfrage.component.scss'],
    standalone: false
})
export class MarkenBekanntheitsUmfrageComponent implements OnInit {
  public markenbekanntheitsInfosInitial: MarkenbekanntheitsInfosEnhanced[] = [];
  public markenbekanntheitsInfos: MarkenbekanntheitsInfosEnhanced[] = [];
  public duplicates: MarkenbekanntheitsInfosEnhanced[] = [];

  public verfugbarkeitsInfosAreLoading = false;

  private sheetMapping: SheetDataMapping<MarkenbekanntheitsInfos>[] = [
    {
      name: 'Stammdatenbericht v3.0 (BIRT 4.',
      mappingFunction: (entry) => ({
        Kurzname: entry.Kurzname,
        Kreiszugehoerigkeit: entry.Kreiszugehörigkeit,
        Bundesland: entry.Bundesland,
        Status: entry.Status,
        Regionalschluessel: entry.Regionalschlüssel,
        Teilnehmernummer: entry.Teilnehmernummer,
        Verbundstart: entry.Verbundstart,
        Gemeindeschluessel: entry.Regionalschlüssel ? entry.Regionalschlüssel.substring(0, 5) + entry.Regionalschlüssel.substring(9) : undefined,
      }),
    },
  ];

  constructor(public xlsService: XLSService, public converterService: ConverterService) {}

  ngOnInit(): void {}

  async onStammdatenExcelFileSelected(event: Event) {
    this.verfugbarkeitsInfosAreLoading = true;

    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    const workbookData = await this.xlsService.readFile(file);

    const getId = (item: MarkenbekanntheitsInfos) => item.Kurzname + item.Regionalschluessel;

    this.markenbekanntheitsInfosInitial = (await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.sheetMapping, getId))
      .filter((x) => x.Regionalschluessel && x.Regionalschluessel.length > 9)
      .sort((a, b) => (a.Bundesland ?? '').localeCompare(b.Bundesland ?? ''))
      .sort((a, b) => a.Kurzname.localeCompare(b.Kurzname))
      .map((item) => ({ Name: item.Kurzname.indexOf(',') > -1 ? item.Kurzname.split(',')[0] : item.Kurzname, ...item }));

    const kommunaleVerfuegbarkeitsInfos = this.markenbekanntheitsInfosInitial.filter(
      (x) => x.Teilnehmernummer && (x.Teilnehmernummer.startsWith('K') || x.Teilnehmernummer.startsWith('S'))
    );

    const kommunaleVerfuegbarkeitsInfosRenamed = this.renameDuplicatesIfPossible(kommunaleVerfuegbarkeitsInfos, getId);

    this.duplicates = kommunaleVerfuegbarkeitsInfosRenamed.filter((x) => x.IsDuplicate === true);

    const kommunaleVerfuegbarkeitsInfosFiltered = this.filterRemainingDuplicates(kommunaleVerfuegbarkeitsInfosRenamed);

    this.markenbekanntheitsInfos = this.adjustStatusOfBayernAndBrandenburgAndHannover(kommunaleVerfuegbarkeitsInfosFiltered);

    this.verfugbarkeitsInfosAreLoading = false;
    input.value = '';
  }

  onSaveDataToExcelFileClicked() {
    const verfuegbarkeitsInfosWithoutHelperProps = this.markenbekanntheitsInfos.map((obj) => {
      const { IsDuplicate, IsRenamed, Kurzname, ...rest } = obj;
      return rest;
    });

    this.xlsService.exportFile('Daten Markenbekanntheit', { sheetData: [{ name: 'Stammdaten', data: verfuegbarkeitsInfosWithoutHelperProps }] });
  }

  private renameDuplicatesIfPossible(verfuegbarkeitsInfos: MarkenbekanntheitsInfosEnhanced[], getId: (object: MarkenbekanntheitsInfosEnhanced) => string) {
    const hasDuplicatedNameInDifferentKreis = (item1: MarkenbekanntheitsInfosEnhanced, item2: MarkenbekanntheitsInfosEnhanced) =>
      item1.Name === item2.Name && item1.Kreiszugehoerigkeit !== item2.Kreiszugehoerigkeit && item1.Regionalschluessel.length === item2.Regionalschluessel.length;
    const hasDuplicatedNameInSameKreis = (item1: MarkenbekanntheitsInfosEnhanced, item2: MarkenbekanntheitsInfosEnhanced) =>
      item1.Name === item2.Name && item1.Kreiszugehoerigkeit === item2.Kreiszugehoerigkeit && item1.Regionalschluessel.length !== item2.Regionalschluessel.length;

    return verfuegbarkeitsInfos.map((x) => {
      const duplicates = verfuegbarkeitsInfos.filter((y) => hasDuplicatedNameInDifferentKreis(x, y) || hasDuplicatedNameInSameKreis(x, y));
      if (duplicates.length > 0) {
        if (duplicates.some((y) => hasDuplicatedNameInDifferentKreis(x, y))) {
          return { ...x, Name: x.Name + ' (' + x.Kreiszugehoerigkeit + ')', IsDuplicate: true, IsRenamed: true };
        } else if (duplicates.some((y) => hasDuplicatedNameInSameKreis(x, y))) {
          if (x.Regionalschluessel.length === 9 && x.Regionalschluessel[5] === '5') {
            if (x.Regionalschluessel.startsWith('01')) {
              return { ...x, Name: x.Name + ' (Amt)', IsDuplicate: true, IsRenamed: true };
            }
            return { ...x, Name: x.Name + ' (Verwaltungsgemeinschaft)', IsDuplicate: true, IsRenamed: true };
          } else if (x.Regionalschluessel.length === 5) {
            return { ...x, Name: x.Name + ' (Kreis)', IsDuplicate: true, IsRenamed: true };
          }
        }
        return { ...x, IsDuplicate: true };
      } else return x;
    });
  }

  private filterRemainingDuplicates(verfuegbarkeitsInfos: MarkenbekanntheitsInfosEnhanced[]) {
    return verfuegbarkeitsInfos.filter((x) => !x.IsDuplicate || x.IsRenamed || !(x.Regionalschluessel.length === 9 && x.Regionalschluessel[5] === '0'));
  }

  private adjustStatusOfBayernAndBrandenburgAndHannover(verfuegbarkeitsInfos: MarkenbekanntheitsInfosEnhanced[]): MarkenbekanntheitsInfosEnhanced[] {
    return verfuegbarkeitsInfos.map((x) => {
      if ((x.Bundesland === 'Bayern' || x.Bundesland === 'Brandenburg') && x.Status === 'Basisabdeckung') {
        return { ...x, Status: 'Kein 115-Teilnehmer' };
      } else if (x.Teilnehmernummer === 'K102825') {
        return { ...x, Status: 'Basisabdeckung' };
      } else {
        return x;
      }
    });
  }
}
