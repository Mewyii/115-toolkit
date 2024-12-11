import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OverviewComponent } from './pages/overview/overview.component';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatSortModule } from '@angular/material/sort';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { FundstellenAuswertungComponent } from './pages/fundstellen/fundstellen-auswertung/fundstellen-auswertung.component';
import { TeilnehmerComponent } from './pages/teilnehmer/teilnehmer.component';
import { FundstellenLogsComponent } from './pages/fundstellen/fundstellen-logs/fundstellen-logs.component';
import { FundstellenComponent } from './pages/fundstellen/fundstellen.component';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { VerfuegbarkeitsCheckComponent } from './pages/verfuegbarkeits-check/verfuegbarkeits-check.component';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { VerteilerComponent } from './pages/verteiler/verteiler.component';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { FormsModule } from '@angular/forms';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FundstellenDownloadComponent } from './pages/fundstellen/fundstellen-download/fundstellen-download.component';
import { MarkenBekanntheitsUmfrageComponent } from './pages/marken-bekanntheits-umfrage/marken-bekanntheits-umfrage.component';
import { ChatbotComponent } from './pages/chatbot/chatbot.component';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { MatNativeDateModule } from '@angular/material/core';
import { ZukunftstechnologieBotComponent } from './pages/zukunftstechnologie-bot/zukunftstechnologie-bot.component';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TnkComponent } from './pages/tnk/tnk.component';

registerLocaleData(localeDe);

@NgModule({
  declarations: [
    AppComponent,
    OverviewComponent,
    FundstellenAuswertungComponent,
    TeilnehmerComponent,
    FundstellenLogsComponent,
    FundstellenComponent,
    VerfuegbarkeitsCheckComponent,
    VerteilerComponent,
    FundstellenDownloadComponent,
    MarkenBekanntheitsUmfrageComponent,
    ChatbotComponent,
    ZukunftstechnologieBotComponent,
    TnkComponent,
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
    HttpClientModule,
    MatButtonToggleModule,
  ],
  providers: [MatDatepickerModule, [{ provide: LOCALE_ID, useValue: 'de' }]],
  bootstrap: [AppComponent],
})
export class AppModule {}
