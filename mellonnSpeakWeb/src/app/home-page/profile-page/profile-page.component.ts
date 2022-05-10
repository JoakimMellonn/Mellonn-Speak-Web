import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/auth-service/auth.service';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit {

  constructor(public authService: AuthService) { }

  async ngOnInit() {
    await this.authService.getUserInfo();
  }

}
