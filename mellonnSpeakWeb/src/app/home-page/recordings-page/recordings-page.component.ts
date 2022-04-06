import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import { Auth } from 'aws-amplify';

@Component({
  selector: 'app-recordings-page',
  templateUrl: './recordings-page.component.html',
  styleUrls: ['./recordings-page.component.scss']
})
export class RecordingsPageComponent implements OnInit {
  firstName: string = '';
  lastName: string = '';

  constructor(private router: Router) { }

  async ngOnInit() {
    await this.getUser();
  }

  async getUser() {
    try {
      const user = await Auth.currentUserInfo();
      this.firstName = user.attributes.name;
      this.lastName = user.attributes.family_name;
    } catch (err) {
      console.log('error getting user', err);
    }
  }

  async signOut() {
    try {
      await Auth.signOut();
      console.log('User is signed out');
      this.router.navigate(['/login']);

    } catch (err) {
      console.log('error signing out', err);
    }
  }
}
