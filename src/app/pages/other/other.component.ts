import { Component } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-other',
    templateUrl: './other.component.html',
    styleUrl: './other.component.scss',
    standalone: false
})
export class OtherComponent {
  selectedIndex = 0;
  tabLabels = ['pm-assistant', 'verteiler', 'markenbekanntheitsumfrage'];

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
      queryParamsHandling: 'merge',
    });
  }
}
