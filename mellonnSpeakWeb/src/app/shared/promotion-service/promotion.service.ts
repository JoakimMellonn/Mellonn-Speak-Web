import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { API } from 'aws-amplify';

@Injectable({
  providedIn: 'root'
})
export class PromotionService {

  constructor(private http: HttpClient) { }

  async getPromotion(code: string, email: string, freePeriods: number) {
    const params = {
      body: {
        "code": code,
        "email": email
      }
    };

    try {
      const response = await API.put('getPromo', '/getPromo', params);

      console.log('Response: ' + response);

      if (response == 'code no exist') {
        return new Promotion('noExist', 0);
      } else if (response.body == 'code already used') {
        return new Promotion('used', 0);
      } else {
        const promotion = new Promotion(response['type'], +response['freePeriods']);
        return promotion;
      }
    } catch (err) {
      console.log('Failed: ' + err);
      return new Promotion('error', 0);
    }
  }
}

class Promotion {
  type: string;
  freePeriods: number;

  constructor(type: string, freePeriods: number) {
    type = this.type,
    freePeriods = this.freePeriods
  }
}