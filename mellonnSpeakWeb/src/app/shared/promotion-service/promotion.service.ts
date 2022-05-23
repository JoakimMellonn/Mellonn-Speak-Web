import { Injectable } from '@angular/core';
import { API, Auth } from 'aws-amplify';
import { AuthService } from '../auth-service/auth.service';
import { StorageService } from '../storage-service/storage.service';

@Injectable({
  providedIn: 'root'
})
export class PromotionService {

  constructor(private authService: AuthService, private storageService: StorageService) { }

  async getPromotion(code: string, email: string, freePeriods: number) {
    const params = {
      body: {
        "code": code,
        "email": email
      }
    };

    try {
      const response = await API.put('getPromo', '/getPromo', params);

      if (response == 'code no exist') {
        return new Promotion('noExist', 0);
      } else if (response == 'code already used') {
        return new Promotion('used', 0);
      } else {
        const promotion = new Promotion(response.type, +response.freePeriods);
        this.applyPromotion(promotion, email, freePeriods);
        return promotion;
      }
    } catch (err) {
      console.log('Failed: ' + err);
      return new Promotion('error', 0);
    }
  }

  async applyPromotion(promotion: Promotion, email: string, freePeriods: number) {
    if (promotion.type == 'benefit') {
      await this.addEmail(email);
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
    } else {
      await this.authService.updateFreePeriods(freePeriods + promotion.freePeriods);
    }
  }

  async addEmail(email: string): Promise<boolean> {
    const params = {
      body: {
        "action": "add",
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

  async removeEmail(email: string): Promise<boolean> {
    const params = {
      body: {
        "action": "remove",
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

  async addPromotion(type: string, code: string, uses: string, freePeriods: string): Promise<boolean> {
    const params = {
      "action": "add",
      "type": type,
      "code": code,
      "date": "",
      "uses": uses,
      "freePeriods": freePeriods
    };

    const response = await API.put('getPromo', '/addPromo', params);
    console.log('AddPromo' + response);
    if (response.statusCode == 200) {
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
}

export class Promotion {
  type: string;
  freePeriods: number;

  constructor(type: string, freePeriods: number) {
    this.type = type,
    this.freePeriods = freePeriods
  }
}