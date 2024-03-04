import { Component, OnInit } from '@angular/core';
import { ConverterService, SheetDataMapping, VerteilerService, XLSService } from 'src/app/services';

export interface VerfuegbarkeitsInfos {
  Teilnehmernummer?: string;
  Kurzname: string;
  Bundesland?: string;
  Kreiszugehoerigkeit?: string;
  Status?: string;
  Regionalschluessel: string;
}

export interface VerfuegbarkeitsInfosEnhanced extends VerfuegbarkeitsInfos {
  Name: string;
  IsDuplicate?: boolean;
  IsRenamed?: boolean;
}

@Component({
  selector: 'app-verfuegbarkeits-check',
  templateUrl: './verfuegbarkeits-check.component.html',
  styleUrls: ['./verfuegbarkeits-check.component.scss'],
})
export class VerfuegbarkeitsCheckComponent implements OnInit {
  public verfuegbarkeitsInfosInitial: VerfuegbarkeitsInfosEnhanced[] = [];
  public verfuegbarkeitsInfos: VerfuegbarkeitsInfosEnhanced[] = [];
  public duplicates: VerfuegbarkeitsInfosEnhanced[] = [];

  public verfugbarkeitsInfosAreLoading = false;

  private sheetMapping: SheetDataMapping<VerfuegbarkeitsInfos>[] = [
    {
      name: 'Stammdatenbericht v3.0 (BIRT 4.',
      mappingFunction: (entry) => ({
        Kurzname: entry.Kurzname,
        Kreiszugehoerigkeit: entry.Kreiszugehörigkeit,
        Bundesland: entry.Bundesland,
        Status: entry.Status,
        Regionalschluessel: entry.Regionalschlüssel,
        Teilnehmernummer: entry.Teilnehmernummer,
      }),
    },
  ];

  constructor(public xlsService: XLSService, public converterService: ConverterService, public verteilerService: VerteilerService) {}

  ngOnInit(): void {}

  async onStammdatenExcelFileSelected(event: Event) {
    this.verfugbarkeitsInfosAreLoading = true;

    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    const workbookData = await this.xlsService.readFile(file);

    const getId = (item: VerfuegbarkeitsInfos) => item.Kurzname + item.Regionalschluessel;

    this.verfuegbarkeitsInfosInitial = (await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.sheetMapping, getId))
      .sort((a, b) => (a.Bundesland ?? '').localeCompare(b.Bundesland ?? ''))
      .sort((a, b) => a.Kurzname.localeCompare(b.Kurzname))
      .map((item) => ({ Name: item.Kurzname.indexOf(',') > -1 ? item.Kurzname.split(',')[0] : item.Kurzname, ...item }));

    const kommunaleVerfuegbarkeitsInfos = this.verfuegbarkeitsInfosInitial.filter(
      (x) => x.Teilnehmernummer && (x.Teilnehmernummer.startsWith('K') || x.Teilnehmernummer.startsWith('S'))
    );

    const kommunaleVerfuegbarkeitsInfosRenamed = this.renameDuplicatesIfPossible(kommunaleVerfuegbarkeitsInfos, getId);

    this.duplicates = kommunaleVerfuegbarkeitsInfosRenamed.filter((x) => x.IsDuplicate === true);

    const kommunaleVerfuegbarkeitsInfosFiltered = this.filterRemainingDuplicates(kommunaleVerfuegbarkeitsInfosRenamed);

    this.verfuegbarkeitsInfos = this.adjustStatusOfBayernAndBrandenburg(kommunaleVerfuegbarkeitsInfosFiltered);

    this.verfugbarkeitsInfosAreLoading = false;
  }

  onSaveDataToExcelFileClicked() {
    const verfuegbarkeitsInfosWithoutHelperProps = this.verfuegbarkeitsInfos.map((obj) => {
      const { IsDuplicate, IsRenamed, Kurzname, ...rest } = obj;
      return rest;
    });

    this.xlsService.exportAsCSV('Daten Verfügbarkeitscheck', verfuegbarkeitsInfosWithoutHelperProps);
  }

  private renameDuplicatesIfPossible(verfuegbarkeitsInfos: VerfuegbarkeitsInfosEnhanced[], getId: (object: VerfuegbarkeitsInfosEnhanced) => string) {
    const hasDuplicatedNameInDifferentKreis = (item1: VerfuegbarkeitsInfosEnhanced, item2: VerfuegbarkeitsInfosEnhanced) =>
      item1.Name === item2.Name && item1.Kreiszugehoerigkeit !== item2.Kreiszugehoerigkeit && item1.Regionalschluessel.length === item2.Regionalschluessel.length;
    const hasDuplicatedNameInSameKreis = (item1: VerfuegbarkeitsInfosEnhanced, item2: VerfuegbarkeitsInfosEnhanced) =>
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

  private filterRemainingDuplicates(verfuegbarkeitsInfos: VerfuegbarkeitsInfosEnhanced[]) {
    return verfuegbarkeitsInfos.filter((x) => !x.IsDuplicate || x.IsRenamed || !(x.Regionalschluessel.length === 9 && x.Regionalschluessel[5] === '0'));
  }

  private adjustStatusOfBayernAndBrandenburg(verfuegbarkeitsInfos: VerfuegbarkeitsInfosEnhanced[]) {
    return verfuegbarkeitsInfos.map((x) => {
      if ((x.Bundesland === 'Bayern' || x.Bundesland === 'Brandenburg') && x.Status === 'Basisabdeckung') {
        return { ...x, Status: 'Kein 115-Teilnehmer' };
      } else {
        return x;
      }
    });
  }
}
