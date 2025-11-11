import { Component, OnInit } from '@angular/core';
import { FundstellenService, XLSService } from 'src/app/services';

interface LogUrlWithTeilnehmerInfo {
  teilnehmername: string;
  fundstellenUrl: string;
  ansprechpartnerEmail: string;
  ansprechpartnerRolle: string;
}

@Component({
    selector: 'app-fundstellen-logs',
    templateUrl: './fundstellen-logs.component.html',
    styleUrls: ['./fundstellen-logs.component.scss'],
    standalone: false
})
export class FundstellenLogsComponent implements OnInit {
  public logUrlsWithTeilnehmerInfos: LogUrlWithTeilnehmerInfo[] = [];
  public logUrlsWithoutTeilnehmerInfos: string[] = [];

  constructor(public fundstellenService: FundstellenService, public xlsService: XLSService) {}

  ngOnInit(): void {}

  async onFundstellenLogFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    const logText = await file.text();

    const logLines = logText.split(/\r?\n|\r|\n/g);
    const urls: string[] = [];
    for (const logLine of logLines) {
      if (logLine.includes('Status: 404') || logLine.includes('Status: 503')) {
        const urlMatch = logLine.match(/'([^"]*)'/);
        if (urlMatch) {
          const url = urlMatch[1].replace("'", '');
          if (!urls.some((x) => x === url)) {
            urls.push(urlMatch[1]);
          }
        }
      }
    }
    this.fundstellenService.setLogUrls(urls);

    const logUrlsWithTeilnehmerInfos: LogUrlWithTeilnehmerInfo[] = [];
    const logUrlsWithoutTeilnehmerInfos: string[] = [];

    // const fundstellenInfos = this.fundstellenService.fundstellenInfos;
    // for (const url of urls) {
    //   const fundstellenInfoIndex = fundstellenInfos.findIndex(
    //     (x) => url.includes(x.Teilnehmername.split(',')[0]) || url.includes(x.teilnehmernummer) || url.includes(x.url) || x.url.includes(url)
    //   );
    //   if (fundstellenInfoIndex > -1) {
    //     const info = fundstellenInfos[fundstellenInfoIndex];
    //     logUrlsWithTeilnehmerInfos.push({
    //       teilnehmername: info.Teilnehmername,
    //       fundstellenUrl: url,
    //       ansprechpartnerEmail: info.hauptAnsprechpartnerEmail,
    //       ansprechpartnerRolle: info.hauptAnsprechpartnerRolle,
    //     });
    //   } else {
    //     logUrlsWithoutTeilnehmerInfos.push(url);
    //   }
    // }
    this.logUrlsWithTeilnehmerInfos = logUrlsWithTeilnehmerInfos;
    this.logUrlsWithoutTeilnehmerInfos = logUrlsWithoutTeilnehmerInfos.sort((a, b) => (a > b ? -1 : 1));
    input.value = '';
  }

  onSaveDataToExcelFileClicked() {
    this.xlsService.exportFile('Fundstellen_Log_Ansprechpartner', { sheetData: [{ name: 'Fundstellen-Fehler', data: this.logUrlsWithTeilnehmerInfos }] });
  }
}
