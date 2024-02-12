import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-leistungs-suche',
  templateUrl: './leistungs-suche.component.html',
  styleUrls: ['./leistungs-suche.component.scss'],
})
export class LeistungsSucheComponent implements OnInit {
  public cityOptions = ['Hamburg', 'Leipzig', 'Stuttgart', 'München', 'Frankfurt am Main', 'Frankfurt an der Oder'];
  public searchOptions = [
    'Personalausweis erstmalig beantragen',
    'Personalausweis erstmalig beantragen - Kosten',
    'Personalausweis erstmalig beantragen - Zuständige Stelle',
    'Personalausweis verloren',
    'Personalausweis neu beantragen',
    'Reisepass beantragen',
    'Reisepass verloren',
  ];

  public cityInput = '';
  public cityFound = false;
  public searchInput = '';
  public searchSent = false;

  public filteredCityOptions: string[] = [];
  public filteredSearchOptions: string[] = [];

  public searchResults: {
    regionality: string;
    name: string;
    date: string;
    source: string;
  }[] = [
    {
      regionality: 'S',
      name: '<b>Perso</b>nalausweis <b>erstmalig</b> beantragen',
      date: '01.02.2023',
      source: 'Landehauptstadt Stuttgart',
    },
    {
      regionality: 'S',
      name: '<br>Perso</b>nalausweis verloren',
      date: '01.02.2023',
      source: 'Landehauptstadt Stuttgart',
    },
    {
      regionality: 'S',
      name: '<br>Perso</b>nalausweis neu beantragen',
      date: '01.02.2023',
      source: 'Landehauptstadt Stuttgart',
    },
    {
      regionality: 'B',
      name: '<br>Perso</b>nalausweis beantragen',
      date: '01.02.2013',
      source: 'Innenministerium',
    },
  ];

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

  onSearchInputChange(inputEvent: any) {
    const input = inputEvent.target.value;

    const regex = new RegExp(`${input.split('').join('+?.*')}`, 'i');

    this.filteredSearchOptions = this.searchOptions.filter((x) => regex.test(x));
  }

  onOptionSelected() {
    this.cityFound = true;
  }

  onInputSend() {
    this.searchSent = true;
  }
}
