import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavController } from '@ionic/angular/standalone';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonInput, IonItem, IonLabel, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonInput, IonItem, IonLabel, IonButton, CommonModule, FormsModule]
})
export class RegisterPage{
  username:string = '';
  email:string = '';
  password:string = '';
  userError:boolean = false;

  constructor(private authService : AuthService, private navCtrl : NavController){}

  onRegister()
  {
    const credentials: any = {
      username: this.username,
      email: this.email,
      password: this.password
    };

    this.authService.register(credentials).subscribe({
      next: (response) => {
        console.log('Register succesful:', response);
        this.navCtrl.navigateRoot('/home');
      },
      error: (error) => {
        this.userError = true;
      },
    });
  }
  onLogin()
  {
    this.navCtrl.navigateForward('/login');
  }
}
