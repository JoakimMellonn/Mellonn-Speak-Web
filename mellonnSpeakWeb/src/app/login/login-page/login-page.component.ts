import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/auth-service/auth.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent implements OnInit {
  createUser: boolean = false;
  forgotPassword: boolean = false;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.createStateCalled.subscribe((res) => {
      this.createUser = res;
    });

    this.authService.forgotStateCalled.subscribe((res) => {
      this.forgotPassword = res;
    })
  }

}
