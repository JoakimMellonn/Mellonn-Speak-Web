import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, DataStore } from 'aws-amplify';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private router: Router) { }

  async signOut() {
    try {
      await DataStore.clear();
      await Auth.signOut();
      console.log('User is signed out');
      this.router.navigate(['/login']);

    } catch (err) {
      console.log('error signing out', err);
    }
  }
}
