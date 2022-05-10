import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, DataStore } from 'aws-amplify';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  firstName: string;
  lastName: string;

  private signInState = new Subject<number>();
  signInStateCalled = this.signInState.asObservable();

  constructor(private router: Router) { }

  async signIn() {
    await this.getUserInfo();
    this.signInState.next(1);
  }

  async signOut() {
    try {
      await DataStore.clear();
      await Auth.signOut();
      console.log('User is signed out');
      this.signInState.next(0);
      this.router.navigate(['/login']);
    } catch (err) {
      console.log('error signing out', err);
    }
  }

  async getUserInfo() {
    const { attributes } = await Auth.currentAuthenticatedUser();

    this.firstName = attributes.name;
    this.lastName = attributes.family_name;
  }
}
