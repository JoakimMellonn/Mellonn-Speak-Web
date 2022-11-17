import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { HomePageComponent } from './home-page/home-page.component';

import { Amplify } from 'aws-amplify';
import awsconfig from 'src/aws-exports';
import { RecordingsPageComponent } from './home-page/recordings-page/recordings-page.component';
import { TranscriptionPageComponent } from './home-page/recordings-page/transcription-page/transcription-page.component';
import { ChatBubbleComponent } from './home-page/recordings-page/transcription-page/chat-bubble/chat-bubble.component';
import { UserChatBubbleComponent } from './home-page/recordings-page/transcription-page/user-chat-bubble/user-chat-bubble.component';
import { FormsModule } from '@angular/forms';
import { AudioControlComponent } from './home-page/recordings-page/transcription-page/audio-control/audio-control.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ProfilePageComponent } from './home-page/profile-page/profile-page.component';
import { LabelEditComponent } from './home-page/recordings-page/transcription-page/label-edit/label-edit.component';
import { SpeakerComponent } from './home-page/recordings-page/transcription-page/label-edit/speaker/speaker.component';
import { InfoPanelComponent } from './home-page/recordings-page/transcription-page/info-panel/info-panel.component';
import { VersionHistoryComponent } from './home-page/recordings-page/transcription-page/version-history/version-history.component';
import { HttpClientModule } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UploadPageComponent } from './home-page/recordings-page/upload-page/upload-page.component';
import { DndDirective } from './home-page/recordings-page/drag-drop/dnd.directive';
import { AdminPageComponent } from './home-page/recordings-page/admin-page/admin-page.component';
import { SearchPipe } from './home-page/recordings-page/admin-page/search-pipe/search.pipe';
import { SearchPromoPipe } from './home-page/recordings-page/admin-page/searchPromo-pipe/search-promo.pipe';
import { BackgroundComponent } from './background/background.component';
import { GuideComponent } from './home-page/recordings-page/transcription-page/guide/guide.component';

Amplify.configure(awsconfig);

@NgModule({
  declarations: [
    AppComponent,
    HomePageComponent,
    RecordingsPageComponent,
    TranscriptionPageComponent,
    ChatBubbleComponent,
    UserChatBubbleComponent,
    AudioControlComponent,
    ProfilePageComponent,
    LabelEditComponent,
    SpeakerComponent,
    InfoPanelComponent,
    VersionHistoryComponent,
    UploadPageComponent,
    DndDirective,
    AdminPageComponent,
    SearchPipe,
    SearchPromoPipe,
    BackgroundComponent,
    GuideComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }