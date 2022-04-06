import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import { Auth } from 'aws-amplify';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {

  constructor(private router: Router) { }

  async ngOnInit(): Promise<void> {
    const isLoggedIn = await this.checkCurrentUser();
    if (isLoggedIn) {
      console.log('User is logged in');
      this.router.navigate(['/home']);
    } else {
      console.log('User is not logged in');
      this.router.navigate(['/login']);
    }
  }

  async checkCurrentUser() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      if (user != null) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  }

}
