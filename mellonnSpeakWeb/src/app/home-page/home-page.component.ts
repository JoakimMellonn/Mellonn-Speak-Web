import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import { Auth } from 'aws-amplify';
import { AuthService } from '../shared/auth-service/auth.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {

  constructor(private router: Router, private authService: AuthService) { }

  async ngOnInit(): Promise<void> {
    const isLoggedIn = await this.authService.checkCurrentUser();
    if (isLoggedIn) {
      //this.authService.registerSignIn();
      this.router.navigate(['/home']);
    } else {
      this.authService.signOut();
      this.router.navigate(['/login']);
    }
  }

}
