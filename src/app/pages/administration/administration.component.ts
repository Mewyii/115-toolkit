import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-administration',
  templateUrl: './administration.component.html',
  styleUrls: ['./administration.component.scss'],
})
export class AdministrationComponent implements OnInit {
  public cityOptions = ['Hamburg', 'Leipzig', 'Stuttgart', 'München', 'Frankfurt am Main', 'Frankfurt an der Oder'];

  public cityInput = '';
  public filteredCityOptions: string[] = [];

  public searchResults: {
    name: string;
    number: string;
    orgaId: string;
  }[] = [
    { name: 'FITKO', number: 'B100115', orgaId: '100' },
    { name: 'Leipzig', number: 'K100185', orgaId: '105' },
    { name: 'Frankfurt', number: 'K300155', orgaId: '110' },
  ];

  public dataSource = this.searchResults;
  displayedColumns: string[] = ['name', 'number', 'orgaId'];

  constructor() {}

  ngOnInit(): void {}

  setCity(city: string) {
    this.cityInput = city;
  }

  onCityInputChange(inputEvent: any) {
    const input = inputEvent.target.value;

    const regex = new RegExp(`${input.split('').join('+?.*')}`, 'i');

    this.filteredCityOptions = this.cityOptions.filter((x) => regex.test(x));
  }
}
