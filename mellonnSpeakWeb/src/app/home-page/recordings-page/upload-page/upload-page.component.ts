import { Component, Input, OnInit } from '@angular/core';
import { loadStripe, PaymentIntentResult } from '@stripe/stripe-js';
import { AuthService } from 'src/app/shared/auth-service/auth.service';
import { LanguageService } from 'src/app/shared/language-service/language.service';
import { SettingsService } from 'src/app/shared/settings-service/settings.service';
import { UploadService } from 'src/app/shared/upload-service/upload.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-upload-page',
  templateUrl: './upload-page.component.html',
  styleUrls: ['./upload-page.component.scss']
})
export class UploadPageComponent implements OnInit {
  @Input() file: File;

  player = new Audio();
  audioLoaded: boolean = false;
  duration: number;

  title: string;
  description: string;

  speakerSelect: number = 2;
  languageSelect: string;

  paymentLoading: boolean = false;
  paymentIntent: any;

  constructor(
    public languageService: LanguageService,
    public settingsService: SettingsService,
    private uploadService: UploadService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.languageSelect = this.settingsService.currentSettings.languageCode;
    const fileUrl = URL.createObjectURL(this.file);
    this.player.src = fileUrl;
    this.uploadService.uploadFile = this.file;

    this.player.onloadedmetadata = () => {
      if (!this.audioLoaded) {
        this.duration = this.player.duration;
        this.audioLoaded = true;
      }
    }

    this.setupPaymentElement();
  }

  async setupPaymentElement() {
    const customer = await this.uploadService.getCustomerId();
    const clientSecret = await this.uploadService.createIntent(customer, 2000, 'dkk');

    const stripe = await loadStripe(environment.stripeKey);
    const elements = stripe!.elements({clientSecret: clientSecret});

    let cardElement = elements.create('card');

    const card = document.getElementById('cardElement');
    const form = document.getElementById('paymentForm');

    cardElement.mount(card!);

    form!.addEventListener('submit', async (event) => {
      const result = await stripe!.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (result.error) {
        console.log('Error while paying: ' + result.error.message);
        this.paymentIntent = result.paymentIntent;
      } else {
        console.log('Payment success!' + result.paymentIntent);
        this.paymentIntent = result.paymentIntent;
      }
    });
  }
}
