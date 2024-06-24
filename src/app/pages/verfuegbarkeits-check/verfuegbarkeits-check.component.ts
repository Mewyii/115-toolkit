import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, debounceTime } from 'rxjs';
import { ConverterService, SheetDataMapping, VerteilerService, XLSService } from 'src/app/services';

export type TeilnehmerStatus = 'Kein 115-Teilnehmer' | 'Basisabdeckung' | '115-Teilnehmer';
export interface VerfuegbarkeitsInfos {
  Teilnehmernummer?: string;
  Name: string;
  Kurzname: string;
  Bundesland?: string;
  Kreiszugehoerigkeit?: string;
  Status?: TeilnehmerStatus;
  Regionalschluessel: string;
}

export interface VerfuegbarkeitsInfosEnhanced extends VerfuegbarkeitsInfos {
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

  public searchInput = 'Franken';

  public shownVerfuegbarkeitsInfos: VerfuegbarkeitsInfosEnhanced[] = [];
  public shownDuplicates: VerfuegbarkeitsInfosEnhanced[] = [];

  private sheetMapping: SheetDataMapping<VerfuegbarkeitsInfos>[] = [
    {
      name: 'Stammdatenbericht v3.0 (BIRT 4.',
      mappingFunction: (entry) => ({
        Name: '',
        Kurzname: entry.Kurzname,
        Kreiszugehoerigkeit: entry.Kreiszugehörigkeit,
        Bundesland: entry.Bundesland,
        Status: entry.Status,
        Regionalschluessel: entry.Regionalschlüssel,
        Teilnehmernummer: entry.Teilnehmernummer,
      }),
    },
  ];

  private inputChangeSubject = new BehaviorSubject<string>('');
  public inputChange$ = this.inputChangeSubject.asObservable();

  constructor(public xlsService: XLSService, public converterService: ConverterService) {}

  ngOnInit(): void {
    this.inputChange$.pipe(debounceTime(750)).subscribe((x) => {
      this.filterShownInfos(x);
    });
  }

  async onStammdatenExcelFileSelected(event: Event) {
    this.verfugbarkeitsInfosAreLoading = true;

    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    const workbookData = await this.xlsService.readFile(file);

    this.verfuegbarkeitsInfosInitial = (await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.sheetMapping))
      .sort((a, b) => (a.Bundesland ?? '').localeCompare(b.Bundesland ?? ''))
      .sort((a, b) => a.Kurzname.localeCompare(b.Kurzname))
      .map((item) => ({ ...item, Name: this.extractNameOnly(item) }));

    const kommunaleVerfuegbarkeitsInfos = this.verfuegbarkeitsInfosInitial.filter(
      (x) => x.Teilnehmernummer && (x.Teilnehmernummer.startsWith('K') || x.Teilnehmernummer.startsWith('S'))
    );

    const kommunaleVerfuegbarkeitsInfosRenamed = this.renameDuplicatesIfPossible(kommunaleVerfuegbarkeitsInfos);

    this.duplicates = kommunaleVerfuegbarkeitsInfosRenamed.filter((x) => x.IsDuplicate === true);

    const kommunaleVerfuegbarkeitsInfosFiltered = this.filterRemainingDuplicates(kommunaleVerfuegbarkeitsInfosRenamed);

    const kommunaleVerfuegbarkeitsInfosAnnotated = this.annotateInfosWithRegionalAttributes(kommunaleVerfuegbarkeitsInfosFiltered);

    this.verfuegbarkeitsInfos = this.adjustStatusOfBayernAndBrandenburgAndHannover(kommunaleVerfuegbarkeitsInfosAnnotated);

    this.verfugbarkeitsInfosAreLoading = false;

    this.inputChangeSubject.next(this.searchInput);
    input.value = '';
  }

  private extractNameOnly(item: VerfuegbarkeitsInfos): string {
    let name = item.Kurzname;
    if (item.Kurzname.indexOf(',') > -1) {
      name = item.Kurzname.split(',')[0].trim();
    }
    if (item.Kurzname.indexOf('(') > -1) {
      name = item.Kurzname.split('(')[0].trim();
    }
    return name;
  }

  onSaveDataToExcelFileClicked() {
    const verfuegbarkeitsInfosWithoutHelperProps = this.verfuegbarkeitsInfos.map((obj) => {
      const { IsDuplicate, IsRenamed, Kurzname, ...rest } = obj;
      return rest;
    });

    this.xlsService.exportAsCSV('Daten Verfügbarkeitscheck', verfuegbarkeitsInfosWithoutHelperProps);
  }

  onSearchInputChange(inputEvent: any) {
    const input = inputEvent.target.value as string;

    this.inputChangeSubject.next(input);
  }

  private filterShownInfos(input: string) {
    const lowerCaseInput = input.toLocaleLowerCase();
    this.shownVerfuegbarkeitsInfos = this.verfuegbarkeitsInfos.filter((x) => x.Name.toLocaleLowerCase().includes(lowerCaseInput));
    this.shownDuplicates = this.duplicates.filter((x) => x.Name.toLocaleLowerCase().includes(lowerCaseInput));
  }

  private renameDuplicatesIfPossible(verfuegbarkeitsInfos: VerfuegbarkeitsInfosEnhanced[]) {
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

  private annotateInfosWithRegionalAttributes(verfuegbarkeitsInfos: VerfuegbarkeitsInfosEnhanced[]) {
    return verfuegbarkeitsInfos.map((x) => {
      if (!x.IsDuplicate) {
        if (x.Regionalschluessel.length === 5) {
          return { ...x, Name: x.Name + ' (Kreis)' };
        }
        if (x.Regionalschluessel.length === 9 && x.Regionalschluessel[5] === '5') {
          if (x.Regionalschluessel.startsWith('01')) {
            return { ...x, Name: x.Name + ' (Amt)' };
          }
          return { ...x, Name: x.Name + ' (Verwaltungsgemeinschaft)' };
        }
      }
      return x;
    });
  }

  private adjustStatusOfBayernAndBrandenburgAndHannover(verfuegbarkeitsInfos: VerfuegbarkeitsInfosEnhanced[]): VerfuegbarkeitsInfosEnhanced[] {
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
