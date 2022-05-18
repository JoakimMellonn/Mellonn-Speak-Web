import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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
      },
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true"
      }
    };

    try {
      const response = await API.put('getPromotion', '', params);

      console.log('Response: ' + response);
    } catch (err) {
      console.log('Failed: ' + err);
    }

    /*if (response.statusCode == 200) {
      gotPromotion = true;
      stateSetter();
      if (response.body == 'code no exist') {
        return Promotion(type: 'noExist', freePeriods: 0);
      } else if (response.body == 'code already used') {
        return Promotion(type: 'used', freePeriods: 0);
      } else {
        var jsonResponse = json.decode(response.body);
        Promotion promotion = Promotion(
            type: jsonResponse['type'],
            freePeriods: int.parse(jsonResponse['freePeriods']));
        await applyPromotion(stateSetter, promotion, email, freePeriods);
        return promotion;
      }
    } else {
      return Promotion(type: 'error', freePeriods: 0);
    }*/
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