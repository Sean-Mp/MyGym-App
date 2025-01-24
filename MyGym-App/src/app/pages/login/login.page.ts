import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavController } from '@ionic/angular/standalone';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonInput, IonItem, IonLabel, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonInput, IonItem, IonLabel, IonButton, CommonModule, FormsModule]
})
export class LoginPage {
  usernameOrEmail:string = '';
  password:string = '';
  userError: boolean = false;

  constructor(private authService: AuthService, private navCtrl: NavController) { }

  onLogin(){

    if(!this.usernameOrEmail || !this.password){
      this.userError = true;
      return;
    }

    const isEmail = this.validateEmail(this.usernameOrEmail);

    const credentials = {
      username: isEmail ? undefined : this.usernameOrEmail,
      email: isEmail ? this.usernameOrEmail : undefined,
      password: this.password,
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login succesful:', response);
        this.navCtrl.navigateRoot('/home');
      },
      error: (error) => {
        console.log('Login failed:', error);
        this.userError = true;
      },
    });
  }
  onForgotPassword(){
    this.navCtrl.navigateForward('/forgot-password');
  }

  onRegister(){
    this.navCtrl.navigateForward('/register');
  }
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}