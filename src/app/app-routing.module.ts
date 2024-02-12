import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeistungsSucheComponent } from './pages/leistungs-suche/leistungs-suche.component';
import { AdministrationComponent } from './pages/administration/administration.component';
import { TeilnehmerComponent } from './pages/teilnehmer/teilnehmer.component';
import { FundstellenComponent } from './pages/fundstellen/fundstellen.component';
import { VerteilerComponent } from './pages/verteiler/verteiler.component';
import { VerfuegbarkeitsCheckComponent } from './pages/verfuegbarkeits-check/verfuegbarkeits-check.component';

const routes: Routes = [
  {
    path: 'leistungs-suche',
    component: LeistungsSucheComponent,
  },
  {
    path: 'fundstellen',
    component: FundstellenComponent,
  },
  {
    path: 'verteiler',
    component: VerteilerComponent,
  },
  {
    path: 'administration',
    component: AdministrationComponent,
    pathMatch: 'full',
  },
  {
    path: 'verfuegbarkeits-check',
    component: VerfuegbarkeitsCheckComponent,
    pathMatch: 'full',
  },
  {
    path: 'administration/teilnehmer/:id',
    component: TeilnehmerComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
