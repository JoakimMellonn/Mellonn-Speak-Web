import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home-page.component';
import { RecordingsPageComponent } from './home-page/recordings-page/recordings-page.component';
import { TranscriptionPageComponent } from './home-page/recordings-page/transcription-page/transcription-page.component';
import { LoginPageComponent } from './login/login-page/login-page.component';

const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'home', component: RecordingsPageComponent },
  { path: 'home/:id', component: TranscriptionPageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
