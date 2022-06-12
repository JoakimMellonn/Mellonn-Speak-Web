import { getLocaleCurrencyCode } from '@angular/common';
import { Component, Inject, Input, LOCALE_ID, OnInit } from '@angular/core';
import { loadStripe, PaymentIntentResult } from '@stripe/stripe-js';
import { AuthService } from 'src/app/shared/auth-service/auth.service';
import { LanguageService } from 'src/app/shared/language-service/language.service';
import { SettingsService } from 'src/app/shared/settings-service/settings.service';
import { Periods, UploadService } from 'src/app/shared/upload-service/upload.service';
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
  periods: Periods;
  buttonText: string = 'Continue to payment';

  title: string;
  description: string;

  speakerSelect: number = 2;
  languageSelect: string;

  paymentActive: boolean = false;
  customerId: string;
  paymentMethods: any[];
  defaultMethod: any;
  paymentLoading: boolean = false;
  paymentIntent: any;

  constructor(
    public languageService: LanguageService,
    public settingsService: SettingsService,
    private uploadService: UploadService,
    private authService: AuthService,
    @Inject(LOCALE_ID) private locale: string
  ) { }

  ngOnInit(): void {
    this.languageSelect = this.settingsService.currentSettings.languageCode;
    const fileUrl = URL.createObjectURL(this.file);
    this.player.src = fileUrl;
    this.uploadService.uploadFile = this.file;

    this.player.onloadedmetadata = () => {
      if (!this.audioLoaded) {
        this.duration = this.player.duration;
        this.periods = this.uploadService.getPeriods(this.duration);
        console.log('Total: ' + this.periods.total + ', periods: ' + this.periods.periods + ', freeLeft: ' + this.periods.freeLeft);
        if (this.periods.periods == 0) this.buttonText = 'Upload recording';
        this.audioLoaded = true;
      }
    }
    this.getCards();
  }

  async getCards() {
    this.customerId = await this.uploadService.getCustomerId();
    this.paymentMethods = await this.uploadService.getCards(this.customerId);

    if (this.paymentMethods.length > 0) {
      if (this.settingsService.currentSettings.primaryCard) {
        if (this.containsCard(this.paymentMethods, this.settingsService.currentSettings.primaryCard)) {
          this.defaultMethod = this.getCardFromId(this.paymentMethods, this.settingsService.currentSettings.primaryCard);
        } else {
          this.defaultMethod = this.paymentMethods[0];
        }
      } else {
        this.defaultMethod = this.paymentMethods[0];
      }
    }
  }

  containsCard(methods: any[], primary: string): boolean {
    for (let method of methods) {
      if (method.id == primary) {
        return true;
      }
    }
    return false;
  }

  getCardFromId(methods: any[], id: string) {
    for (let method of methods) {
      if (method.id == id) {
        return method;
      }
    }
  }

  async setupPaymentElement() {
    const clientSecret = await this.uploadService.createIntent(this.customerId, 2000, 'dkk');

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

  async continueClick() {
    if (this.periods.periods == 0) {
      await this.uploadService.uploadRecording(this.file, this.title, this.description, this.speakerSelect, this.languageSelect);
      alert('Recording uploaded.');
      
    }
  }
}
