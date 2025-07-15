import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import localeDe from '@angular/common/locales/de';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { ChatbotAuswertungenComponent } from './pages/chatbot/chatbot-auswertungen/chatbot-auswertungen.component';
import { ChatbotComponent } from './pages/chatbot/chatbot.component';
import { ZukunftstechnologieBotComponent } from './pages/chatbot/ki-bot/ki-bot.component';
import { FundstellenAuswertungComponent } from './pages/fundstellen/fundstellen-auswertung/fundstellen-auswertung.component';
import { FundstellenDownloadComponent } from './pages/fundstellen/fundstellen-download/fundstellen-download.component';
import { FundstellenLogsComponent } from './pages/fundstellen/fundstellen-logs/fundstellen-logs.component';
import { FundstellenComponent } from './pages/fundstellen/fundstellen.component';
import { MarkenBekanntheitsUmfrageComponent } from './pages/other/marken-bekanntheits-umfrage/marken-bekanntheits-umfrage.component';
import { OtherComponent } from './pages/other/other.component';
import { PmAssistantComponent } from './pages/other/pm-assistant/pm-assistant.component';
import { VerteilerComponent } from './pages/other/verteiler/verteiler.component';
import { TnkComponent } from './pages/tnk/tnk.component';
import { VerfuegbarkeitsCheckComponent } from './pages/website/verfuegbarkeits-check/verfuegbarkeits-check.component';
import { WebsiteComponent } from './pages/website/website.component';

registerLocaleData(localeDe);

@NgModule({
  declarations: [
    AppComponent,
    FundstellenAuswertungComponent,
    FundstellenLogsComponent,
    FundstellenComponent,
    VerfuegbarkeitsCheckComponent,
    VerteilerComponent,
    FundstellenDownloadComponent,
    MarkenBekanntheitsUmfrageComponent,
    ChatbotAuswertungenComponent,
    ZukunftstechnologieBotComponent,
    TnkComponent,
    ChatbotComponent,
    WebsiteComponent,
    OtherComponent,
    PmAssistantComponent,
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
