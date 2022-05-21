import { Component, OnInit } from '@angular/core';
import { AuthService } from './shared/auth-service/auth.service';
import { LanguageService } from './shared/language-service/language.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'mellonnSpeakWeb';
  signedIn: boolean = false;

  constructor(private authService: AuthService, private language: LanguageService) {}

  async ngOnInit() {
    this.authService.signInStateCalled.subscribe((res) => {
      if (res == 1) {
        this.signedIn = true;
      } else {
        this.signedIn = false;
      }
    });
    this.language.getLanguages();
    const isSignedIn = await this.authService.checkCurrentUser();
    if (isSignedIn) await this.authService.registerSignIn();
  }

  async signOut() {
    await this.authService.signOut();
  }
}
