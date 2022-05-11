import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, DataStore } from 'aws-amplify';
import { Subject } from 'rxjs';
import { StorageService } from '../storage-service/storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  email: string;
  firstName: string;
  lastName: string;
  group: string;
  superDev: boolean = false;

  freePeriods: number = 0;

  private signInState = new Subject<number>();
  signInStateCalled = this.signInState.asObservable();

  constructor(private router: Router, private storage: StorageService) { }

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

    this.email = attributes.email;
    this.firstName = attributes.name;
    this.lastName = attributes.family_name;
    this.group = attributes['custom:group'];
    if (attributes['custom:superdev'] == 'true') this.superDev = true;

    const userData = await this.storage.getUserData();
    this.freePeriods = +userData['freePeriods'];
  }
}
