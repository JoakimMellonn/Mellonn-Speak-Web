import { Injectable } from '@angular/core';
import { API, Auth, Storage } from 'aws-amplify';
import { Subject } from 'rxjs';
import { AuthService } from '../auth-service/auth.service';
import { StorageService } from '../storage-service/storage.service';

@Injectable({
  providedIn: 'root'
})
export class PromotionService {

  private switchCurrentMode = new Subject<'default' | 'upload' | 'admin'>();
  switchCurrentModeCalled = this.switchCurrentMode.asObservable();

  constructor(
    private authService: AuthService,
    private storageService: StorageService
  ) { }

  changeCurrentMode(mode: 'default' | 'upload' | 'admin') {
    this.switchCurrentMode.next(mode);
  }

  async getPromotion(code: string, email: string, freePeriods: number, redeem?: boolean): Promise<Promotion> {
    if (redeem == undefined) redeem = true;
    const params = {
      body: {
        "code": code,
        "email": email
      }
    };

    try {
      const response = await API.put('getPromo', '/getPromotion', params);

      if (response == 'code no exist') {
        return new Promotion(code, 'noExist', 0, '', '');
      } else if (response == 'code already used') {
        return new Promotion(code, 'used', 0, '', '');
      } else {
        const promotion = new Promotion(code, response.type, +response.freePeriods, response.referrer ?? '', response.referGroup ?? '');
        if (redeem) this.applyPromotion(code, promotion, email, freePeriods);
        return promotion;
      }
    } catch (err) {
      console.log('Failed: ' + err);
      return new Promotion(code, 'error', 0, '', '');
    }
  }

  async applyPromotion(code: string, promotion: Promotion, email: string, freePeriods: number) {
    const params = {
      body: {
        "code": code,
        "email": email
      }
    };
    await API.put('getPromo', '/applyPromotion', params);

    console.log('Applying promo: ' + promotion.type + ', to user: ' + email);
    if (promotion.type == 'benefit') {
      await this.addRemBenefit(email, 'add');
      if (promotion.freePeriods > 0) {
        await this.authService.updateFreePeriods(freePeriods + promotion.freePeriods);
      }
    } else if (promotion.type == 'dev') {
      try {
        const user = await Auth.currentAuthenticatedUser();
        await Auth.updateUserAttributes(user, {
          'custom:group': 'dev'
        });
        await this.authService.registerSignIn();
      } catch (err) {
        console.log('Failed while applying promo: ' + err);
      }
    } else if (promotion.type == 'referrer') {
      await this.addUserToReferrer(promotion.referrer, email);
      if (promotion.freePeriods > 0) {
        await this.authService.updateFreePeriods(freePeriods + promotion.freePeriods);
      }
    } else if (promotion.type == 'referGroup') {
      await this.addUserToReferrer(promotion.referrer, email, promotion.referGroup);
      if (promotion.freePeriods > 0) {
        await this.authService.updateFreePeriods(freePeriods + promotion.freePeriods);
      }
    } else {
      await this.authService.updateFreePeriods(freePeriods + promotion.freePeriods);
    }
  }

  async addRemBenefit(email: string, addRem: "add" | "remove"): Promise<boolean> {
    const params = {
      body: {
        "action": addRem,
        "email": email
      }
    };
  
    const response = await API.put('getPromo', '/addRemBenefit', params);
    console.log('AddRemBenefit response: ' + response);
    if (response.statusCode == 200) {
      return true;
    } else {
      return false;
    }
  }

  async addPromotion(type: string, code: string, uses: string, freePeriods: string, referrer: string, referGroup: string): Promise<boolean> {
    const params = {
      body: {
        "action": "add",
        "type": type,
        "code": code,
        "date": "",
        "uses": uses,
        "freePeriods": freePeriods,
        "referrer": referrer,
        "referGroup": referGroup
      }
    };

    if (type == 'referrer' || type == 'referGroup') {
      await this.storageService.createReferrer(referrer);
    }

    const response = await API.put('getPromo', '/addPromo', params);
    console.log('AddPromo: ' + response);
    if (response == 'Successfully added code: ' + code) {
      return true;
    } else {
      return false;
    }
  }

  async removePromotion(code: string): Promise<boolean> {
    const params = {
      "action": "remove",
      "code": code
    };
  
    const response = await API.put('getPromo', '/addPromo', params);
    console.log('AddPromo' + response);
    if (response.statusCode == 200) {
      return true;
    } else {
      return false;
    }
  }

  async addUserToReferrer(referrer: string, email: string, referGroup?: string): Promise<boolean> {
    const key: string = `data/referrers/${referrer}.json`;

    try {
      let emails: string[] = [];
      const url = await Storage.get(key);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      if (response.status == 404) {
        console.log('Group doesnt exist');
        return false;
      }
      const result = await response.json();

      for (let referEmail of result.emails) {
        emails.push(referEmail);
        if (referEmail == email) {
          return true;
        }
      }

      emails.push(email);
      let newReferrer = result;
      newReferrer.emails = emails;
      await Storage.put(key, newReferrer);
      
      if (referGroup != undefined) return await this.addRemReferGroupAPI('add', email, referGroup, referrer);

      return true;
    } catch (err) {
      console.log('Error when adding user to group: ' + err);
      return false;
    }
  }

  async removeUserFromReferrer(referrer: string, email: string, referGroup?: string): Promise<boolean> {
    const key: string = `data/referrers/${referrer}.json`;

    try {
      let emails: string[] = [];
      const url = await Storage.get(key);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      if (response.status == 404) {
        await this.addRemReferGroupAPI('remove', email, '', referrer);
        return true;
      }
      const result = await response.json();

      for (let referEmail of result.emails) {
        if (referEmail != email) {
          emails.push(referEmail);
        }
      }
      let newReferrer = result;
      newReferrer.emails = emails;
      await Storage.put(key, newReferrer);

      if (referGroup != undefined) return await this.addRemReferGroupAPI('remove', email, referGroup, referrer);

      return true;
    } catch (err) {
      console.log('Error when adding user to group: ' + err);
      return false;
    }
  }

  async addRemReferGroupAPI(action: 'add' | 'remove', email: string, referGroup: string, referrer: string) {
    const params = {
      body: {
        "action": action,
        "email": email,
        "referGroup": referGroup,
        "referrer": referrer
      }
    };

    try {
      await API.put('getPromo', '/addRemReferGroup', params);
      await this.addRemBenefit(email, action);
      return true;
    } catch (err) {
      console.log('Error while adding user to referGroup: ' + err);
      return false;
    }
  }
}

export class Promotion {
  code: string;
  type: string;
  freePeriods: number;
  referrer: string;
  referGroup: string;

  constructor(code: string, type: string, freePeriods: number, referrer: string, referGroup: string) {
    this.code = code,
    this.type = type,
    this.freePeriods = freePeriods,
    this.referrer = referrer,
    this.referGroup = referGroup
  }
}