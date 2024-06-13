import { LOCALE_ID, NgModule } from '@angular/core';
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
import { VerteilerComponent } from './pages/verteiler/verteiler.component';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FundstellenDownloadComponent } from './pages/fundstellen/fundstellen-download/fundstellen-download.component';
import { MarkenBekanntheitsUmfrageComponent } from './pages/marken-bekanntheits-umfrage/marken-bekanntheits-umfrage.component';
import { ChatbotComponent } from './pages/chatbot/chatbot.component';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { MatNativeDateModule } from '@angular/material/core';

registerLocaleData(localeDe);

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
    VerteilerComponent,
    FundstellenDownloadComponent,
    MarkenBekanntheitsUmfrageComponent,
    ChatbotComponent,
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
    MatSelectModule,
    FormsModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [MatDatepickerModule, [{ provide: LOCALE_ID, useValue: 'de' }]],
  bootstrap: [AppComponent],
})
export class AppModule {}
