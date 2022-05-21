import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, DataStore, Storage } from 'aws-amplify';
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

  private createState = new Subject<boolean>();
  createStateCalled = this.createState.asObservable();

  private forgotState = new Subject<boolean>();
  forgotStateCalled = this.forgotState.asObservable();

  constructor(private router: Router, private storage: StorageService) { }

  async registerSignIn() {
    await this.getUserInfo();
    this.signInState.next(1);
  }

  forgetPasswordError: string;

  async forgotPassword(email: string) {
    try {
      await Auth.forgotPassword(email);
      return true;
    } catch (err) {
      this.forgetPasswordError = String(err);
      return false;
    }
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
    if (this.group != 'dev') {
      const isBenefit = await this.checkBenefit(this.email);
      console.log('Is benefit: ' + isBenefit);
      if (this.group == 'benefit' && !isBenefit || this.group == 'user' && isBenefit) {
        await this.changeBenefit(isBenefit);
      }
    }
    if (attributes['custom:superdev'] == 'true') {
      this.superDev = true;
    } else {
      this.superDev = false;
    }

    const userData = await this.storage.getUserData(this.email);
    this.freePeriods = +userData['freePeriods'];
  }

  async checkBenefit(email: string): Promise<boolean> {
    const key = 'data/benefitUsers.json';
    let returnElement: boolean = false;
  
    try {
      const url = await Storage.get(key);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      const result = await response.json();
  
      for (let benefitEmail of result.emails) {
        if (benefitEmail == email) {
          returnElement = true;
          break;
        }
      }
    } catch (err) {
      console.log('Error while checking benefit: ' + err);
      return false;
    }
    return returnElement;
  }

  async changeBenefit(isBenefit: boolean) {
    try {
      let group = 'benefit';
      if (!isBenefit) group = 'user';
      const user = await Auth.currentAuthenticatedUser();
      await Auth.updateUserAttributes(user, {
        'custom:group': group
      });
    } catch (err) {
      console.log('Error while changing benefit: ' + err);
    }
  }

  setCreate(val: boolean) {
    this.createState.next(val);
  }

  setForgotState(val: boolean) {
    this.forgotState.next(val);
  }
}
