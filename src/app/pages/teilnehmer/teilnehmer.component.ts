import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-teilnehmer',
  templateUrl: './teilnehmer.component.html',
  styleUrls: ['./teilnehmer.component.scss'],
})
export class TeilnehmerComponent implements OnInit {
  public teilnehmerId: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.teilnehmerId = this.route.snapshot.params['id'];
  }
}
