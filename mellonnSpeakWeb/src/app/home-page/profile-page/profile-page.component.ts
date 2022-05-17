import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/auth-service/auth.service';
import { PromotionService } from 'src/app/shared/promotion-service/promotion.service';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  profileType: string;
  loading: boolean = true;

  constructor(public authService: AuthService, private promotionService: PromotionService) { }

  async ngOnInit() {
    await this.authService.signIn();

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

  async redeemPromotion() {
    await this.promotionService.getPromotion('henlo', this.authService.email, this.authService.freePeriods);
  }
}
