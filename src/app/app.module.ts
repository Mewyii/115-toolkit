import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OverviewComponent } from './pages/overview/overview.component';
import { LeistungsSucheComponent } from './pages/leistungs-suche/leistungs-suche.component';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { FundstellenAuswertungComponent } from './pages/fundstellen/fundstellen-auswertung/fundstellen-auswertung.component';
import { AdministrationComponent } from './pages/administration/administration.component';
import { TeilnehmerComponent } from './pages/teilnehmer/teilnehmer.component';
import { FundstellenLogsComponent } from './pages/fundstellen/fundstellen-logs/fundstellen-logs.component';
import { FundstellenComponent } from './pages/fundstellen/fundstellen.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VerfuegbarkeitsCheckComponent } from './pages/verfuegbarkeits-check/verfuegbarkeits-check.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    AppComponent,
    OverviewComponent,
    LeistungsSucheComponent,
    FundstellenAuswertungComponent,
    AdministrationComponent,
    TeilnehmerComponent,
    FundstellenLogsComponent,
    FundstellenComponent,
    VerfuegbarkeitsCheckComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatInputModule,
    MatAutocompleteModule,
    MatTableModule,
    MatSortModule,
    MatExpansionModule,
    MatTabsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
