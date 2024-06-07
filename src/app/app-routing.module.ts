import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeistungsSucheComponent } from './pages/leistungs-suche/leistungs-suche.component';
import { AdministrationComponent } from './pages/administration/administration.component';
import { TeilnehmerComponent } from './pages/teilnehmer/teilnehmer.component';
import { FundstellenComponent } from './pages/fundstellen/fundstellen.component';
import { VerfuegbarkeitsCheckComponent } from './pages/verfuegbarkeits-check/verfuegbarkeits-check.component';
import { VerteilerComponent } from './pages/verteiler/verteiler.component';
import { MarkenBekanntheitsUmfrageComponent } from './pages/marken-bekanntheits-umfrage/marken-bekanntheits-umfrage.component';
import { ChatbotComponent } from './pages/chatbot/chatbot.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'leistungs-suche',
    pathMatch: 'full',
  },
  {
    path: 'leistungs-suche',
    component: LeistungsSucheComponent,
    pathMatch: 'full',
  },
  {
    path: 'fundstellen',
    component: FundstellenComponent,
    pathMatch: 'full',
  },
  {
    path: 'administration',
    component: AdministrationComponent,
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
    path: 'chatbot',
    component: ChatbotComponent,
    pathMatch: 'full',
  },
  {
    path: 'administration/teilnehmer/:id',
    component: TeilnehmerComponent,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
