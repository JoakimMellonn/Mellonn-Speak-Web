import { Component, Input, OnInit } from '@angular/core';
import { loadStripe } from '@stripe/stripe-js';
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

  constructor(
    public languageService: LanguageService,
    public settingsService: SettingsService,
    private uploadService: UploadService
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

    console.log(`Customer: ${customer}, clientSecret: ${clientSecret}`);

    const stripe = await loadStripe(environment.stripeKey);
    const elements = stripe!.elements({clientSecret: clientSecret});
    let paymentElement = elements.create('payment', {
      fields: {
        billingDetails: {
          name: 'never',
          email: 'never'
        }
      }
    });

    const form = document.getElementById('paymentForm');

    paymentElement.mount(form!);
  }
}
