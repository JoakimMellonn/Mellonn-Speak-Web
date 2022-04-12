import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './shared/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'mellonnSpeakWeb';

  constructor(private router: Router, private authService: AuthService) {}

  url = window.location.href;

  async signOut() {
    await this.authService.signOut();
  }
}
