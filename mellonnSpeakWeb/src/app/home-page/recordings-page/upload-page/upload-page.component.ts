import { getLocaleCurrencyCode } from '@angular/common';
import { Component, Inject, Input, LOCALE_ID, OnInit, Renderer2 } from '@angular/core';
import { loadStripe, PaymentIntentResult, Stripe, StripeCardElement } from '@stripe/stripe-js';
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

  unitPrice: number = 49;
  currency: string = 'dkk';

  stripe: Stripe | null;
  cardElement: StripeCardElement;
  cardsLoading: boolean = true;
  paymentActive: boolean = false;
  customerId: string;
  paymentMethods: any[];
  defaultMethod: any;
  paymentLoading: boolean = false;
  paymentIntent: any;
  clientSecret: string;
  cardSelect: string;
  otherMethod: boolean = false;
  otherCard: boolean = false;
  errorMessage: string = '';
  monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  uploadLoaded: number;
  uploadTotal: number;
  isUploading: boolean = false;

  constructor(
    public languageService: LanguageService,
    public settingsService: SettingsService,
    private uploadService: UploadService,
    private authService: AuthService,
    private renderer: Renderer2,
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
    //TODO: set currency and price automatically (not hardcoded...)
    //this.currency = getLocaleCurrencyCode(this.locale)!.toUpperCase();

    this.uploadService.uploadProgressCalled.subscribe((progress) => {
      //progress index 0 = loaded, index 1 = total
      this.uploadLoaded = progress[0];
      this.uploadTotal = progress[1];
    });
    this.getCards();
  }

  async getCards() {
    this.cardsLoading = true;
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
    const defaultCardIcon = document.getElementById('defaultCardIcon');
    if (defaultCardIcon) {
      this.renderer.addClass(defaultCardIcon, this.getCardIcon(this.defaultMethod.card.brand));
    }
    this.cardSelect = this.defaultMethod.id;
    this.cardsLoading = false;
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

  getCardIcon(brand: string) {
    if (brand == 'visa') {
      return 'fa-brands fa-cc-visa fa-lg';
    } else if (brand == 'mastercard') {
      return 'fa-brands fa-cc-mastercard fa-lg';
    } else {
      return 'fa-solid fa-credit-card fa-lg';
    }
  }

  capFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async setupPayment() {
    this.clientSecret = await this.uploadService.createIntent(this.customerId, 2000, 'dkk');

    this.stripe = await loadStripe(environment.stripeKey);
    const elements = this.stripe!.elements({clientSecret: this.clientSecret});
    this.cardElement = elements.create('card');
    const card = document.getElementById('cardElement');
    
    if (this.paymentMethods.length == 0) {
      this.cardElement.mount(card!);
    }

    const form = document.getElementById('paymentForm');
    form!.addEventListener('submit', async (event) => {
      let paymentMethod = this.defaultMethod.id;

      if (this.otherCard) {
        paymentMethod = {card: this.cardElement};
      } else if (this.otherMethod) {
        paymentMethod = this.cardSelect;
      }

      const result = await this.stripe!.confirmCardPayment(this.clientSecret, {
        payment_method: paymentMethod,
      });

      if (result.error) {
        console.log('Error while paying: ' + result.error.message);
        this.errorMessage = result.error.message!;
        this.paymentIntent = result.paymentIntent;
      } else {
        console.log('Payment success!' + result.paymentIntent);
        this.paymentIntent = result.paymentIntent;
      }
    });
  }

  setupCardElement() {
    this.otherCard = true;
    const card = document.getElementById('cardElement');
    this.cardElement.mount(card!);
  }

  async continueClick() {
    if (this.periods.periods == 0) {
      await this.startUpload();
    } else {
      this.paymentActive = true;
      await this.setupPayment();
    }
  }

  async startUpload() {
    this.isUploading = true;
    await this.uploadService.uploadRecording(this.file, this.title, this.description, this.speakerSelect, this.languageSelect, this.periods);
    alert('Recording uploaded.'); //TODO: make a better message.
    this.isUploading = false;
    this.uploadService.returnToRecordings();
  }
}
