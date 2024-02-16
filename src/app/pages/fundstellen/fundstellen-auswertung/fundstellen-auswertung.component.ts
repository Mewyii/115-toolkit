import { Component, OnInit } from '@angular/core';
import { ConverterService, FundstellenService, XLSService } from 'src/app/services';

@Component({
  selector: 'app-fundstellen-auswertung',
  templateUrl: './fundstellen-auswertung.component.html',
  styleUrls: ['./fundstellen-auswertung.component.scss'],
})
export class FundstellenAuswertungComponent implements OnInit {
  constructor(public xlsService: XLSService, public fundstellenService: FundstellenService, public converterService: ConverterService) {}

  ngOnInit(): void {}

  async onFundstellenExcelFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    const fundstellenInfos = await this.converterService.getAndAggregateFundstellenExcelSheetData(file);

    this.fundstellenService.setFundstellenInfos(fundstellenInfos);

    console.log(this.fundstellenService.fundstellenInfos);
  }

  onSaveDataToExcelFileClicked() {
    this.xlsService.exportFile('Fundstellen_Aufbereitet', this.converterService.convertDataArraysToWorkbookData(this.fundstellenService.fundstellenInfos));
  }
}
