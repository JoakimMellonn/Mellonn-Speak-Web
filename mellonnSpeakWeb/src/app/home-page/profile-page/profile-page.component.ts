import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { AuthService } from 'src/app/shared/auth-service/auth.service';
import { PromotionService, Promotion } from 'src/app/shared/promotion-service/promotion.service';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  profileType: string;
  loading: boolean = true;
  redeemPromoActive: boolean = false;
  promoRedeemed: boolean = false;
  errorMessage: string = '';
  discountMessage: string = '';

  promoCode: string = '';

  constructor(
    public authService: AuthService,
    private promotionService: PromotionService,
    private renderer: Renderer2
  ) { }

  async ngOnInit() {
    if (this.authService.group == 'dev') {
      this.profileType = 'Developer account';
    } else if (this.authService.group == 'benefit') {
      this.profileType = 'Benefit account';
    } else {
      this.profileType = 'Standard account';
    }
    this.loading = false;
  }

  ngOnDestroy(): void {
    this.loading = true;
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
    this.errorMessage = '';
    this.promoCode = '';
    this.discountMessage = '';
    this.promoRedeemed = false;
  }

  async redeemPromotion() {
    if (this.promoCode.split('').length != 0) {
      const promotion = await this.promotionService.getPromotion(this.promoCode, this.authService.email, this.authService.freePeriods);
      if (promotion.type == 'noExist') {
        this.errorMessage = "This code doesn't exist, make sure you've written it correctly.";
      } else if (promotion.type == 'used') {
        this.errorMessage = "You have already used this code.";
      } else if (promotion.type == 'error' || promotion.type == undefined) {
        this.errorMessage = "Something went wrong while redeeming the code, please try again later."
      } else {
        this.discountMessage = this.discountString(promotion);
        this.promoRedeemed = true;
      }
    } else {
      this.errorMessage = 'You need to enter a promo code.';
    }
  }

  discountString(promotion: Promotion): string {
    if (promotion.type == 'benefit' && promotion.freePeriods > 0) {
      return 'Benefit user (-40% on all purchases) and ' + promotion.freePeriods + ' free credit(s)';
    } else if (promotion.type == 'benefit' && promotion.freePeriods == 0) {
      return 'Benefit user (-40% on all purchases)';
    } else if (promotion.type == 'dev') {
      return 'Developer user (everything is free)';
    } else {
      return promotion.freePeriods + ' free credits';
    }
  }
}
