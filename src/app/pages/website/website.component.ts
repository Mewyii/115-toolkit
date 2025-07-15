import { Component } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-website',
  templateUrl: './website.component.html',
  styleUrl: './website.component.scss',
})
export class WebsiteComponent {
  selectedIndex = 0;
  tabLabels = ['verfügbarkeitscheck'];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      const index = this.tabLabels.indexOf((tab || '').toLowerCase());
      this.selectedIndex = index !== -1 ? index : 0;
    });
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.router.navigate([], {
      queryParams: { tab: event.tab.textLabel },
      queryParamsHandling: 'merge', // wichtig, damit andere Query-Params erhalten bleiben
    });
  }
}
