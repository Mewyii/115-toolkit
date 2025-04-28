import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OverviewComponent } from './pages/overview/overview.component';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { MatExpansionModule } from '@angular/material/expansion';
import { FundstellenAuswertungComponent } from './pages/fundstellen/fundstellen-auswertung/fundstellen-auswertung.component';
import { TeilnehmerComponent } from './pages/teilnehmer/teilnehmer.component';
import { FundstellenLogsComponent } from './pages/fundstellen/fundstellen-logs/fundstellen-logs.component';
import { FundstellenComponent } from './pages/fundstellen/fundstellen.component';
import { VerfuegbarkeitsCheckComponent } from './pages/verfuegbarkeits-check/verfuegbarkeits-check.component';
import { VerteilerComponent } from './pages/verteiler/verteiler.component';
import { FormsModule } from '@angular/forms';
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
import { MatButtonModule } from '@angular/material/button';

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
    MatInputModule,
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
