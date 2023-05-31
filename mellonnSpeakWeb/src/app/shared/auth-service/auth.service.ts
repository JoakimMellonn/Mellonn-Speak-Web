import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { createAvatar } from '@dicebear/core';
import { initials } from '@dicebear/collection';
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
  referrer: string;
  referGroup: string;
  groupAdmin: boolean = false;
  isOnboarded: boolean = false;
  userAvatar: string;

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

  async checkCurrentUser(): Promise<boolean> {
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
      this.signInState.next(0);
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('error signing out', err);
    }
  }

  async getUserInfo() {
    const { attributes } = await Auth.currentAuthenticatedUser();

    this.email = attributes.email;
    this.firstName = attributes.name;
    this.lastName = attributes.family_name;
    this.group = attributes['custom:group'];
    this.referrer = attributes['custom:referrer'];
    this.referGroup = attributes['custom:referGroup'];
    if (this.group != 'dev') {
      const isBenefit = await this.checkBenefit(this.email);
      if (this.group == 'benefit' && !isBenefit || this.group == 'user' && isBenefit) {
        await this.changeBenefit(isBenefit);
      }
    }
    if (attributes['custom:groupAdmin'] == 'true') this.groupAdmin = true;
    if (attributes['custom:superdev'] == 'true') this.superDev = true;
    if (attributes['custom:onboardedWeb'] == 'true') this.isOnboarded = true;
    if (attributes['custom:avatarURI'] == undefined) {
      await this.createAvatar();
    } else {
      this.userAvatar = attributes['custom:avatarURI'];
    }

    this.freePeriods = await this.getFreePeriods();
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
      console.error('Error while checking benefit: ' + err);
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
      console.error('Error while changing benefit: ' + err);
    }
  }

  setCreate(val: boolean) {
    this.createState.next(val);
  }

  setForgotState(val: boolean) {
    this.forgotState.next(val);
  }

  async getFreePeriods(): Promise<number> {
    try {
      const { attributes } = await Auth.currentAuthenticatedUser();

      const result = attributes['custom:freeCredits'];
      if (result == undefined) throw 'freeCredits does not exist';
      return result;
    } catch (err) {
      console.error('Error while getting free credits: ' + err);
      const oldRes = await this.getOldUserData();

      if (oldRes == 'created new') {
        return 0;
      } else if (oldRes == 'error') {
        return 0;
      } else {
        this.updateFreePeriods(oldRes);
        return oldRes;
      }
    }
  }

  async updateFreePeriods(newFreePeriods: number) {
    try {
      const user = await Auth.currentAuthenticatedUser();
      this.freePeriods = newFreePeriods;
      await Auth.updateUserAttributes(user, {
        'custom:freeCredits': newFreePeriods.toString(),
      });
    } catch (err) {
      console.error('Failed updating free periods: ' + err);
    }
  }

  async getOldUserData() {
    const fileKey: string = 'userData/userData.json';
    let userDataNotFetched: boolean = true;

    try {
      const url = await Storage.get(fileKey, {level: 'private'});

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const result = await response.json();
      userDataNotFetched = false;
      return +result['freePeriods'];
    } catch (err) {
      console.error('Error downloading file with key: ' + fileKey + ', error: ' + err);
      if (err == 'Error: Error! status: 404') {
        await this.updateFreePeriods(0);
        return 'created new';
      } else {
        return 'error';
      }
    }
  }

  async setOnboarded() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.updateUserAttributes(user, {
        'custom:onboardedWeb': 'true',
      });
    } catch (err) {
      console.error(`Error getting onboarding status: ${err}`);
    }
  }

  async createAvatar() {
    const avatar = createAvatar(initials, {
      seed: `${this.firstName} ${this.lastName}`,
      radius: 50,
      backgroundColor: ['FF966C', 'B4E599', '6cd5ff', 'df6cff', 'ff6c7d', 'ff796c', 'ff966c', 'ffb36c', 'ffd16c', 'd2e599', 'c3e599', 'b4e599', 'a5e599', '99e59c'],
      textColor: ['262626'],
      fontWeight: 500,
    });
    this.userAvatar = await avatar.toDataUri();

    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.updateUserAttributes(user, {
        'custom:avatarURI': this.userAvatar,
      });
    } catch (err) {
      console.error(`Error creating the user avatar: ${err}`);
    }
  }
}
