import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatbotComponent } from './pages/chatbot/chatbot.component';
import { FundstellenComponent } from './pages/fundstellen/fundstellen.component';
import { MarkenBekanntheitsUmfrageComponent } from './pages/marken-bekanntheits-umfrage/marken-bekanntheits-umfrage.component';
import { TeilnehmerComponent } from './pages/teilnehmer/teilnehmer.component';
import { TnkComponent } from './pages/tnk/tnk.component';
import { VerfuegbarkeitsCheckComponent } from './pages/verfuegbarkeits-check/verfuegbarkeits-check.component';
import { VerteilerComponent } from './pages/verteiler/verteiler.component';
import { ZukunftstechnologieBotComponent } from './pages/zukunftstechnologie-bot/zukunftstechnologie-bot.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'leistungs-suche',
    pathMatch: 'full',
  },
  {
    path: 'fundstellen',
    component: FundstellenComponent,
    pathMatch: 'full',
  },
  {
    path: 'verteiler',
    component: VerteilerComponent,
  },
  {
    path: 'verfuegbarkeits-check',
    component: VerfuegbarkeitsCheckComponent,
    pathMatch: 'full',
  },
  {
    path: 'marken-bekanntheits-umfrage',
    component: MarkenBekanntheitsUmfrageComponent,
    pathMatch: 'full',
  },
  {
    path: 'chatbot-auswertungen',
    component: ChatbotComponent,
    pathMatch: 'full',
  },
  {
    path: 'ki-chatbot',
    component: ZukunftstechnologieBotComponent,
    pathMatch: 'full',
  },
  {
    path: 'administration/teilnehmer/:id',
    component: TeilnehmerComponent,
    pathMatch: 'full',
  },
  {
    path: 'tnk',
    component: TnkComponent,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
