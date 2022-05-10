import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { HomePageComponent } from './home-page/home-page.component';

import Amplify from 'aws-amplify';
import awsconfig from 'src/aws-exports';
import { RecordingsPageComponent } from './home-page/recordings-page/recordings-page.component';
import { TranscriptionPageComponent } from './home-page/recordings-page/transcription-page/transcription-page.component';
import { ChatBubbleComponent } from './home-page/recordings-page/transcription-page/chat-bubble/chat-bubble.component';
import { UserChatBubbleComponent } from './home-page/recordings-page/transcription-page/user-chat-bubble/user-chat-bubble.component';
import { FormsModule } from '@angular/forms';
import { AudioControlComponent } from './home-page/recordings-page/transcription-page/audio-control/audio-control.component';
import { SpeakerChooserComponent } from './home-page/recordings-page/transcription-page/speaker-chooser/speaker-chooser.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ProfilePageComponent } from './home-page/profile-page/profile-page.component';

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
    SpeakerChooserComponent,
    ProfilePageComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    FormsModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }