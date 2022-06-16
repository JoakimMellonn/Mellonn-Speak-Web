import { Injectable } from '@angular/core';
import { API } from 'aws-amplify';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor() { }

  async sendFeedback(email: string, name: string, where: string, message: string, accepted: boolean) {
    const params = {
      body: {
        "email": email,
        "name": name,
        "where": where,
        "message": message,
        "accepted": accepted
      }
    }
    await API.post('feedback', '/sendFeedback', params);
    return;
  }
}
