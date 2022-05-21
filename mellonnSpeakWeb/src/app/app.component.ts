import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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

  constructor(private router: Router, private authService: AuthService, private language: LanguageService) {}

  ngOnInit(): void {
    this.authService.signInStateCalled.subscribe((res) => {
      if (res == 1) {
        this.signedIn = true;
      } else {
        this.signedIn = false;
      }
    });
    this.language.getLanguages();
  }

  async signOut() {
    await this.authService.signOut();
  }
}
