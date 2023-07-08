import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { loadStripe } from '@stripe/stripe-js';
import { Auth } from 'aws-amplify';
import { AnalyticsService } from 'src/app/shared/analytics-service/analytics.service';
import { AuthService } from 'src/app/shared/auth-service/auth.service';
import { LanguageService } from 'src/app/shared/language-service/language.service';
import { PromotionDbService } from 'src/app/shared/promotion-db-service/promotion-db.service';
import { PromotionService, Promotion } from 'src/app/shared/promotion-service/promotion.service';
import { SettingsService } from 'src/app/shared/settings-service/settings.service';
import { StorageService } from 'src/app/shared/storage-service/storage.service';
import { UploadService } from 'src/app/shared/upload-service/upload.service';
import { environment } from 'src/environments/environment';
import { PromotionType, Settings } from 'src/models';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  loading: boolean = true;
  redeemPromoActive: boolean = false;
  promoCode: string = '';
  promoRedeemed: boolean = false;
  promoError: string = '';
  discountMessage: string = '';
  settings: Settings;

  feedbackActive: boolean = false;
  feedbackMessage: string;
  accepted: boolean = true;
  sendingFeedback: boolean = false;
  feedbackSent: boolean = false;
  feedbackError: string = '';

  languageSelect: string;
  jumpSelect: number;
  jumpValues: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  paymentMethods: any[];
  paymentLoading: boolean = true;
  addCardActive: boolean = false;
  addCardLoading: boolean = true;
  setupIntent: any;
  primaryCard: string;
  cardSelect: string;
  monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  constructor(
    public authService: AuthService,
    public languageService: LanguageService,
    private promotionService: PromotionDbService,
    private renderer: Renderer2,
    private settingsService: SettingsService,
    private storageService: StorageService,
    private uploadService: UploadService,
    private analyticsService: AnalyticsService,
  ) { }

  async ngOnInit() {
    this.settings = await this.settingsService.getSettings();
    await this.languageService.getLanguages();
    this.getPaymentMethods();
    this.languageSelect = this.settings.languageCode;
    this.jumpSelect = this.settings.jumpSeconds;
    this.loading = false;
  }

  get userGroup() {
    if (this.authService.group == 'dev') {
      return 'Developer account';
    } else if (this.authService.group == 'benefit') {
      return 'Benefit account';
    } else {
      return 'Standard account';
    }
  }

  ngOnDestroy(): void {
    this.loading = true;
  }

  goToLink(url: string){
    window.open(url, "_blank");
  }

  toggleRedeemPromo() {
    if (this.redeemPromoActive) {
      this.deactivateRedeemPromo();
    } else {
      this.activateRedeemPromo();
    }
  }

  activateRedeemPromo() {
    this.redeemPromoActive = true;
    const segment = document.getElementById('redeemSegment');
    this.renderer.removeClass(segment, 'clickable');
  }

  deactivateRedeemPromo() {
    this.redeemPromoActive = false;
    const segment = document.getElementById('redeemSegment');
    this.renderer.addClass(segment, 'clickable');
    this.promoError = '';
    this.promoCode = '';
    this.discountMessage = '';
    this.promoRedeemed = false;
  }

  toggleFeedback() {
    if (this.feedbackActive) {
      this.deactivateFeedback();
    } else {
      this.activateFeedback();
    }
  }

  activateFeedback() {
    this.feedbackActive = true;
    const segment = document.getElementById('feedbackSegment');
    this.renderer.removeClass(segment, 'clickable');
  }

  deactivateFeedback() {
    this.feedbackActive = false;
    const segment = document.getElementById('feedbackSegment');
    this.renderer.addClass(segment, 'clickable');
    this.feedbackMessage = '';
    this.accepted = true;
    this.sendingFeedback = false;
    this.feedbackSent = false;
    this.feedbackError = '';
  }

  async redeemPromotion() {
    if (this.promoCode.split('').length != 0) {
      const promotion = await this.promotionService.getPromotion(this.promoCode, this.authService.freePeriods);
      console.log(promotion)
      if (promotion == "no exist") {
        this.promoError = "This code doesn't exist, make sure you've written it correctly.";
      } else if (promotion == 'used') {
        this.promoError = "You have already used this code.";
      } else if (typeof promotion == "string") {
        this.promoError = "Something went wrong while redeeming the code, please try again later."
      } else {
        this.discountMessage = this.promotionService.discountString(promotion);
        this.promoRedeemed = true;
      }
    } else {
      this.promoError = 'You need to enter a promo code.';
    }
  }

  async onLanguageSelect() {
    const saveSettings = Settings.copyOf(this.settings, copy => {
      copy.languageCode = this.languageSelect
    });
    await this.settingsService.saveSettings(saveSettings);
  }

  async onJumpSelect() {
    const saveSettings = Settings.copyOf(this.settings, copy => {
      copy.jumpSeconds = +this.jumpSelect
    });
    await this.settingsService.saveSettings(saveSettings);
  }

  async resetSettings() {
    const defaultS = await this.settingsService.getDefaultSettings();
    this.settings = defaultS;
    this.languageSelect = this.settings.languageCode;
    this.jumpSelect = this.settings.jumpSeconds;
    await this.settingsService.saveSettings(defaultS);
  }

  async deleteAccount() {
    if (confirm('Are you ABSOLUTELY sure you want to delete your account? This will remove ALL data associated with your account, and this CANNOT be undone!')) {
      await this.storageService.removeUserFiles();
      await Auth.deleteUser();
      this.authService.signOut();
    }
  }

  async getPaymentMethods() {
    const customerId = await this.uploadService.getCustomerId();
    this.paymentMethods = await this.uploadService.getCards(customerId);
    this.paymentLoading = false;

    if (this.paymentMethods.length > 0) {
      if (this.settings.primaryCard) {
        if (this.containsCard(this.paymentMethods, this.settings.primaryCard)) {
          this.cardSelect = this.settings.primaryCard;
        } else {
          this.cardSelect = this.paymentMethods[0].id;
        }
      } else {
        this.cardSelect = this.paymentMethods[0].id;
        this.onCardSelect();
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

  getCardIcon(brand: string) {
    if (brand == 'visa') {
      return 'fa-brands fa-cc-visa fa-lg';
    } else if (brand == 'mastercard') {
      return 'fa-brands fa-cc-mastercard fa-lg';
    } else {
      return 'fa-solid fa-credit-card fa-lg';
    }
  }

  async activateAddCard() {
    this.addCardActive = true;
    this.addCardLoading = true;
    const customer = await this.uploadService.getCustomerId();
    const clientSecret = await this.uploadService.createSetupIntent(customer);

    const stripe = await loadStripe(environment.stripeKey);
    const elements = stripe!.elements({clientSecret: clientSecret});
    this.addCardLoading = false;

    let cardElement = elements.create('card');

    const card = document.getElementById('cardElement');
    const form = document.getElementById('addCardForm');

    cardElement.mount(card!);

    form!.addEventListener('submit', async () => {
      this.addCardLoading = true;
      const result = await stripe!.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (result.error) {
        this.setupIntent = result.setupIntent;
      } else {
        this.setupIntent = result.setupIntent;

        await this.getPaymentMethods();
        const saveSettings = Settings.copyOf(this.settings, copy => {
          copy.primaryCard = this.paymentMethods[0].id
        });
        await this.settingsService.saveSettings(saveSettings);
        this.cardSelect = this.paymentMethods[0].id;
        this.addCardActive = false;
      }
    });
  }

  async onCardSelect(id?: string) {
    if (id != undefined) {
      this.cardSelect = id;
    }
    const saveSettings = Settings.copyOf(this.settings, copy => {
      copy.primaryCard = id ?? this.cardSelect
    });
    await this.settingsService.saveSettings(saveSettings);
  }

  async removeCard(cardId: string) {
    if (confirm('Are you sure you want to remove this card?')) {
      const result = await this.uploadService.removeCard(cardId);
      await this.getPaymentMethods();
      if (this.paymentMethods.length == 0) {
        const saveSettings = Settings.copyOf(this.settings, copy => {
          copy.primaryCard = null
        });
        await this.settingsService.saveSettings(saveSettings);
      }
    }
  }

  async sendFeedback() {
    if (this.feedbackMessage == null || this.feedbackMessage!.length == 0) {
      this.feedbackError = 'You need to write a message'
    } else {
      this.feedbackError = '';
      this.sendingFeedback = true;
      await this.analyticsService.sendFeedback(
        this.authService.email,
        `${this.authService.firstName} ${this.authService.lastName}`,
        'Feedback/report - web',
        this.feedbackMessage,
        this.accepted
      );
      this.feedbackSent = true;
    }
  }
}
