import { Component, OnInit } from '@angular/core';
import { ConverterService, VerteilerService, XLSService } from 'src/app/services';

@Component({
  selector: 'app-verteiler',
  templateUrl: './verteiler.component.html',
  styleUrls: ['./verteiler.component.scss'],
})
export class VerteilerComponent implements OnInit {
  constructor(public xlsService: XLSService, public converterService: ConverterService, public verteilerService: VerteilerService) {}

  ngOnInit(): void {}

  async onVerteilerExcelFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    const verteilerInfos = await this.verteilerService.getAndAggregateVerteilerExcelSheetData(file);

    console.log(verteilerInfos);
  }

  onSaveDataToExcelFileClicked() {
    this.xlsService.exportFile('Verteiler_Aufbereitet.xlsx', this.converterService.convertDataArraysToWorkbookData(this.verteilerService.kontaktInfos));
  }
}
