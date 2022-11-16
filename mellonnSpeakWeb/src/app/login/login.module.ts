import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginPageComponent } from './login-page/login-page.component';
import { ReactiveFormsModule } from '@angular/forms';
import { EmailLoginComponent } from './email-login/email-login.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { WelcomeScreenComponent } from './welcome-screen/welcome-screen.component';



@NgModule({
  declarations: [
    LoginPageComponent,
    EmailLoginComponent,
    CreateUserComponent,
    WelcomeScreenComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class LoginModule { }
