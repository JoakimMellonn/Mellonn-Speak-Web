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
Amplify.configure(awsconfig);

@NgModule({
  declarations: [
    AppComponent,
    HomePageComponent,
    RecordingsPageComponent,
    TranscriptionPageComponent,
    ChatBubbleComponent,
    UserChatBubbleComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }