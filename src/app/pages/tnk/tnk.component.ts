import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConverterService, SheetDataMapping, XLSService } from 'src/app/services';

export interface TNKInfos {
  Name: string;
  Bundesland: string;
  BundeslandId: number;
  'TN-Nummer'?: string;
  Mails?: string;
  site_url?: string;
}

interface FDSApiResponse {
  facets: any;
  meta: {
    limit: number;
    next?: any;
    offset: number;
    previous?: number;
    total_count: number;
  };
  objects: {
    email?: string;
    resource_uri: string;
    site_url: string;
  }[];
}

@Component({
    selector: 'app-tnk',
    templateUrl: './tnk.component.html',
    styleUrl: './tnk.component.scss',
    standalone: false
})
export class TnkComponent implements OnInit {
  public tnkInfos: TNKInfos[] = [];

  public excelInfosAreLoading = false;
  public fdsInfosAreLoading = false;

  private sheetMapping: SheetDataMapping<TNKInfos>[] = [
    {
      name: 'Sheet2',
      mappingFunction: (entry) => ({
        Name: entry.Name.indexOf(',') > -1 ? entry.Name.substring(0, entry.Name.indexOf(',')) : entry.Name,
        Bundesland: entry.Bundesland,
        'TN-Nummer': entry['TN-Nummer'],
        BundeslandId: this.mapBundeslandToID(entry.Bundesland),
      }),
    },
  ];

  constructor(public xlsService: XLSService, public converterService: ConverterService, private httpClient: HttpClient) {}

  ngOnInit(): void {}

  async onExcelFileSelected(event: Event) {
    this.excelInfosAreLoading = true;

    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    const workbookData = await this.xlsService.readFile(file);

    this.tnkInfos = (await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.sheetMapping))
      .sort((a, b) => a.Name.localeCompare(b.Name))
      .sort((a, b) => (a.Bundesland ?? '').localeCompare(b.Bundesland ?? ''))
      .filter((x) => x.Bundesland)
      .map((x) => ({ ...x, Name: x.Name.indexOf(',') > -1 ? x.Name.substring(0, x.Name.indexOf(',')) : x.Name }));

    this.excelInfosAreLoading = false;
    input.value = '';
  }

  async onLoadFragDenStaatInfosClicked() {
    for (const tnkInfo of this.tnkInfos) {
      if (tnkInfo.BundeslandId) {
        const result = await firstValueFrom(
          this.httpClient.get<FDSApiResponse>('https://fragdenstaat.de/api/v1/publicbody/', { params: { q: tnkInfo.Name, category: 188, jurisdiction: tnkInfo.BundeslandId } })
        );
        if (result && result.meta.total_count > 0) {
          tnkInfo.Mails = result.objects.map((x) => x.email).join(';');
          tnkInfo.site_url = result.objects.map((x) => x.site_url).join(';');
        } else {
          console.log(tnkInfo.Name);
        }
      }
    }
  }

  onSaveDataToExcelFileClicked() {
    // const verfuegbarkeitsInfosWithoutHelperProps = this.tnkInfos.map((obj) => {
    //   const { IsDuplicate, IsRenamed, Kurzname, ...rest } = obj;
    //   return rest;
    // });

    this.xlsService.exportFile('Ansprechpartner politische Leitung', { sheetData: [{ name: 'politische Leitungen', data: this.tnkInfos }] });
  }

  mapBundeslandToID(name: string) {
    if (name === 'Thüringen') {
      return 10;
    } else if (name === 'Hessen') {
      return 94;
    } else if (name === 'Niedersachsen') {
      return 93;
    } else if (name === 'Rheinland-Pfalz') {
      return 6;
    } else if (name === 'Sachsen-Anhalt') {
      return 13;
    } else if (name === 'Schleswig-Holstein') {
      return 11;
    } else if (name === 'Baden-Württemberg') {
      return 91;
    } else if (name === 'Mecklenburg-Vorpommern') {
      return 7;
    } else if (name === 'Nordrhein-Westfalen') {
      return 2;
    } else if (name === 'Berlin') {
      return 4;
    } else if (name === 'Brandenburg') {
      return 3;
    } else if (name === 'Bremen') {
      return 12;
    } else {
      return 0;
    }
  }
}
