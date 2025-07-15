import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatbotComponent } from './pages/chatbot/chatbot.component';
import { FundstellenComponent } from './pages/fundstellen/fundstellen.component';
import { OtherComponent } from './pages/other/other.component';
import { TnkComponent } from './pages/tnk/tnk.component';
import { WebsiteComponent } from './pages/website/website.component';

const routes: Routes = [
  {
    path: 'fundstellen',
    component: FundstellenComponent,
    pathMatch: 'full',
  },
  {
    path: 'website',
    component: WebsiteComponent,
    pathMatch: 'full',
  },
  {
    path: 'chatbot',
    component: ChatbotComponent,
    pathMatch: 'full',
  },
  {
    path: 'tnk',
    component: TnkComponent,
    pathMatch: 'full',
  },
  {
    path: 'other',
    component: OtherComponent,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
