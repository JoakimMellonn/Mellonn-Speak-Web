import { Component, OnInit } from '@angular/core';
import { AuthService } from './shared/auth-service/auth.service';
import { LanguageService } from './shared/language-service/language.service';
import { SettingsService } from './shared/settings-service/settings.service';
import { UploadService } from './shared/upload-service/upload.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'mellonnSpeakWeb';
  signedIn: boolean = false;

  constructor(
    public authService: AuthService,
    private language: LanguageService,
    private settingsService: SettingsService,
    private uploadService: UploadService,
  ) {}

  async ngOnInit() {
    this.language.getCountryCode();

    this.authService.signInStateCalled.subscribe((res) => {
      if (res == 1) {
        this.signedIn = true;
      } else {
        this.signedIn = false;
      }
    });
    this.language.getLanguages();
    const isSignedIn = await this.authService.checkCurrentUser();
    if (isSignedIn) {
      await this.authService.registerSignIn();
      await this.settingsService.getSettings();

      if (!this.uploadService.hasProduct) {
        await this.uploadService.getProduct();
      }
    } else {
      this.authService.signOut();
    }
  }

  async signOut() {
    await this.authService.signOut();
  }
}
