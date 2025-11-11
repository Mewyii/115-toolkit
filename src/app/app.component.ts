import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent {
  title = '115 Toolkit';
  url: string = '';

  constructor(private router: Router) {
    this.router.events.subscribe((params) => {
      this.url = router.url;
    });
  }
}
