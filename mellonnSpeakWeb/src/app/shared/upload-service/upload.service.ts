import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { loadStripe } from '@stripe/stripe-js';
import { AuthService } from '../auth-service/auth.service';
import { API } from 'aws-amplify';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  uploadFile: File;

  constructor(private authService: AuthService) { }

  async setUpStripe() {
    const stripe = await loadStripe(environment.stripeKey);

    console.log();
  }

  async getCustomerId(): Promise<string> {
    const params = {
      body: {
        "email": this.authService.email,
      }
    };
    const response = await API.put('stripe', '/customer', params);
    return response;
  }

  async createIntent(customerId: string, amount: number, currency: string): Promise<string> {
    const params = {
      body: {
        "customerId": customerId,
        "amount": amount,
        "currency": currency
      }
    }

    const response = await API.put('stripe', '/intent', params);
    return response.secret;
  }
}
