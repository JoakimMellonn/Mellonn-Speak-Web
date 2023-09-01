import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home-page.component';
import { ProfilePageComponent } from './home-page/profile-page/profile-page.component';
import { RecordingsPageComponent } from './home-page/recordings-page/recordings-page.component';
import { TranscriptionPageComponent } from './home-page/recordings-page/transcription-page/transcription-page.component';
import { UploadPageComponent } from './home-page/recordings-page/upload-page/upload-page.component';
import { LoginPageComponent } from './login/login-page/login-page.component';
import { AmbassadorPageComponent } from './home-page/ambassador-page/ambassador-page.component';

const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'home', component: RecordingsPageComponent },
  { path: 'home/transcription/:id', component: TranscriptionPageComponent },
  { path: 'profile', component: ProfilePageComponent },
  { path: 'home/upload', component: UploadPageComponent },
  { path: 'home/ambassador', component: AmbassadorPageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
