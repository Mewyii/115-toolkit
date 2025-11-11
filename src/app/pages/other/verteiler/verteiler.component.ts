import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConverterService, SheetDataMapping, XLSService } from 'src/app/services';

export interface KontaktInfo {
  Teilnehmer: string;
  Nachname?: string;
  Vorname?: string;
  Straße?: string;
  PLZ?: string;
  Ort?: string;
  Bundesland?: string;
  Telefon?: string;
  Mobil?: string;
  Email: string;
  'Vertretung / Orga PF (CC)'?: string;
  ZAG?: boolean;
  'AG Betrieb'?: boolean;
  'AG Qualität'?: boolean;
  'AG ÖA'?: boolean;
  'TAG Strategie'?: boolean;
  CAB?: boolean;
  'AG Wissensmanagement'?: boolean;
  Servicecenterleiter?: boolean;
  Landesansprechpartner?: boolean;
  'Operativer Ausfall'?: boolean;
  'Lenkungsausschuss (AN)'?: boolean;
  Alumni?: boolean;
}

@Component({
    selector: 'app-verteiler',
    templateUrl: './verteiler.component.html',
    styleUrls: ['./verteiler.component.scss'],
    standalone: false
})
export class VerteilerComponent implements OnInit {
  public gremienKontaktInfos: KontaktInfo[] = [];
  public currentGremienKontaktInfos: KontaktInfo[] = [];

  public gremienFilters: string[] = [
    'ZAG',
    'AG Betrieb',
    'AG Qualität',
    'AG ÖA',
    'TAG Strategie',
    'CAB',
    'AG Wissensmanagement',
    'Servicecenterleiter',
    'Landesansprechpartner',
    'Operativer Ausfall',
    'Lenkungsausschuss (AN)',
    'Alumni',
  ];

  public currentGremienFilters: string[] = [];

  public vertretungInCC = false;

  public mailList = '';

  public vertretungsList = '';

  public mailListDisabled = false;

  private sheetMapping: SheetDataMapping<KontaktInfo>[] = [
    {
      name: 'Gremien',
      mappingFunction: (entry) => ({
        Teilnehmer: entry.Teilnehmer,
        Nachname: entry.Nachname,
        Vorname: entry.Vorname,
        Straße: entry.Straße,
        PLZ: entry.PLZ,
        Ort: entry.Ort,
        Bundesland: entry.Bundesland,
        Telefon: entry.Telefon,
        Mobil: entry.Mobil,
        Email: entry.Email,
        'Vertretung / Orga PF (CC)': entry['Vertretung / Orga PF (CC)'],
        ZAG: entry.ZAG === 'Ja',
        'AG Betrieb': entry['AG Betrieb'] === 'Ja',
        'AG Qualität': entry['AG Qualität'] === 'Ja',
        'AG ÖA': entry['AG ÖA'] === 'Ja',
        'TAG Strategie': entry['TAG Strategie'] === 'Ja',
        CAB: entry.CAB === 'Ja',
        'AG Wissensmanagement': entry['AG Wissensmanagement'] === 'Ja',
        Servicecenterleiter: entry.Servicecenterleiter === 'Ja',
        Landesansprechpartner: entry.Landesansprechpartner === 'Ja',
        'Operativer Ausfall': entry['Operativer Ausfall'] === 'Ja',
        'Lenkungsausschuss (AN)': entry['Lenkungsausschuss (AN)'] === 'Ja',
        Alumni: entry.Alumni === 'Ja',
      }),
    },
  ];

  constructor(public xlsService: XLSService, public converterService: ConverterService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {}

  async onStammdatenExcelFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    const workbookData = await this.xlsService.readFile(file);

    const getId = (item: KontaktInfo) => item.Email + item.Nachname;

    this.gremienKontaktInfos = await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.sheetMapping, getId);
    this.filterGremienKontaktInfos();
    input.value = '';
  }

  onCopyToClipboardClicked() {
    navigator.clipboard.writeText(this.mailList);

    this.snackBar.open('Mail-Liste in Zwischenablage kopiert!', 'Schließen', {
      duration: 3000,
    });
  }

  onSendMailClicked() {
    const mailtoLink = `mailto:${this.mailList}` + (this.vertretungInCC && this.vertretungsList.length > 0 ? '?cc=' + this.vertretungsList : '');
    window.location.href = mailtoLink;
  }

  public filterGremienKontaktInfos() {
    this.currentGremienKontaktInfos = this.gremienKontaktInfos.filter((obj: any) => this.currentGremienFilters.some((option) => obj[option]));

    this.mailList = this.currentGremienKontaktInfos
      .filter((x) => x.Email)
      .map((x) => x.Email)
      .join(';');

    this.vertretungsList = this.currentGremienKontaktInfos
      .filter((x) => x['Vertretung / Orga PF (CC)'])
      .map((x) => x['Vertretung / Orga PF (CC)'])
      .join(';');

    this.mailListDisabled = this.mailList.length > 2000;
  }
}
