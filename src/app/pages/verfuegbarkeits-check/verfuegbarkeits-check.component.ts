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

@Component({
  selector: 'app-verfuegbarkeits-check',
  templateUrl: './verfuegbarkeits-check.component.html',
  styleUrls: ['./verfuegbarkeits-check.component.scss'],
})
export class VerfuegbarkeitsCheckComponent implements OnInit {
  public verfuegbarkeitsInfos: VerfuegbarkeitsInfos[] = [];
  public cityDuplicates: VerfuegbarkeitsInfos[] = [];
  public kreisDuplicates: VerfuegbarkeitsInfos[] = [];

  private sheetMapping: SheetDataMapping<VerfuegbarkeitsInfos>[] = [
    {
      name: 'Stammdatenbericht v3.0 (BIRT 4.',
      mappingFunction: (entry) => ({
        Teilnehmernummer: entry.Teilnehmernummer,
        Kurzname: entry.Kurzname,
        Bundesland: entry.Bundesland,
        Kreiszugehoerigkeit: entry.Kreiszugehörigkeit,
        Status: entry.Status,
        Regionalschluessel: entry.Regionalschlüssel,
      }),
    },
  ];

  constructor(public xlsService: XLSService, public converterService: ConverterService, public verteilerService: VerteilerService) {}

  ngOnInit(): void {}

  async onStammdatenExcelFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    const workbookData = await this.xlsService.readFile(file);

    const getId = (item: VerfuegbarkeitsInfos) => item.Kurzname + item.Regionalschluessel;

    const verfuegbarkeitsInfos = (await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.sheetMapping, getId))
      .sort((a, b) => a.Kurzname.localeCompare(b.Kurzname))
      .sort((a, b) => (a.Bundesland ?? '').localeCompare(b.Bundesland ?? ''));

    const kommunaleVerfuegbarkeitsInfos = verfuegbarkeitsInfos.filter((x) => x.Teilnehmernummer && (x.Teilnehmernummer.startsWith('K') || x.Teilnehmernummer.startsWith('S')));

    const kommunaleVerfuegbarkeitsInfosWithoutDuplicates = this.renameDuplicates(kommunaleVerfuegbarkeitsInfos, getId);

    this.verfuegbarkeitsInfos = this.adjustStatusOfBayernAndBrandenburg(kommunaleVerfuegbarkeitsInfosWithoutDuplicates);
  }

  onSaveDataToExcelFileClicked() {
    this.xlsService.exportFile('Daten Verfügbarkeitscheck.xlsx', this.converterService.convertDataArraysToWorkbookData(this.verfuegbarkeitsInfos));
  }

  private renameDuplicates(verfuegbarkeitsInfos: VerfuegbarkeitsInfos[], getId: (object: VerfuegbarkeitsInfos) => string) {
    console.log('Entries before filtering: ' + verfuegbarkeitsInfos.length);

    const citiesHavingDuplicatedNames = verfuegbarkeitsInfos.filter((obj, index, array) =>
      array.some(
        (item) => item.Kurzname === obj.Kurzname && item.Kreiszugehoerigkeit !== obj.Kreiszugehoerigkeit && item.Regionalschluessel.length === obj.Regionalschluessel.length
      )
    );

    const kreisAndCityHavingDuplicatedNames = verfuegbarkeitsInfos.filter((obj, index, array) =>
      array.some(
        (item) => item.Kurzname === obj.Kurzname && item.Kreiszugehoerigkeit === obj.Kreiszugehoerigkeit && item.Regionalschluessel.length !== obj.Regionalschluessel.length
      )
    );

    const kommunaleVerfuegbarkeitsInfosWithoutDuplicates = verfuegbarkeitsInfos.filter(
      (x) => !citiesHavingDuplicatedNames.some((y) => getId(x) === getId(y)) && !kreisAndCityHavingDuplicatedNames.some((y) => getId(x) === getId(y))
    );

    console.log('Entries after filtering: ' + kommunaleVerfuegbarkeitsInfosWithoutDuplicates.length);

    const citiesWithNewNames = citiesHavingDuplicatedNames.map((x) => ({ ...x, Kurzname: x.Kurzname + ' (' + x.Kreiszugehoerigkeit + ')' }));

    const cityOrKreisWithNewNames = kreisAndCityHavingDuplicatedNames
      .filter((x) => !citiesHavingDuplicatedNames.some((y) => getId(x) === getId(y)))
      .map((x) => {
        if (x.Kurzname === x.Kreiszugehoerigkeit && x.Regionalschluessel.length === 12) {
          return x;
        }
        if (x.Regionalschluessel.length === 9 && x.Regionalschluessel[5] === '5') {
          return { ...x, Kurzname: x.Kurzname + ' (Gemeindeverband)' };
        } else if (x.Regionalschluessel.length === 5) {
          return { ...x, Kurzname: x.Kurzname + ' (Kreis)' };
        }
        return x;
      });

    this.cityDuplicates = citiesWithNewNames.sort((a, b) => a.Kurzname.localeCompare(b.Kurzname));

    this.kreisDuplicates = this.removeDuplicatedKreisfreieStaedte(cityOrKreisWithNewNames);

    kommunaleVerfuegbarkeitsInfosWithoutDuplicates.push(...citiesWithNewNames, ...this.kreisDuplicates);

    console.log('Entries after renaming: ' + kommunaleVerfuegbarkeitsInfosWithoutDuplicates.length);

    return kommunaleVerfuegbarkeitsInfosWithoutDuplicates;
  }

  private removeDuplicatedKreisfreieStaedte(verfuegbarkeitsInfos: VerfuegbarkeitsInfos[]) {
    return verfuegbarkeitsInfos.filter((x) => x.Regionalschluessel[5] !== '0');
  }

  private adjustStatusOfBayernAndBrandenburg(verfuegbarkeitsInfos: VerfuegbarkeitsInfos[]) {
    return verfuegbarkeitsInfos.map((x) => {
      if ((x.Bundesland === 'Bayern' || x.Bundesland === 'Brandenburg') && x.Status === 'Basisabdeckung') {
        return { ...x, Status: 'Kein 115-Teilnehmer' };
      } else {
        return x;
      }
    });
  }
}
