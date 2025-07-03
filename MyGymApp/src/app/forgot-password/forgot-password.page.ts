import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonCard } from '@ionic/angular/standalone';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [IonCard, IonButton, IonInput, IonLabel, IonItem, IonCardContent, IonCardTitle, IonCardHeader, IonContent, CommonModule, FormsModule]
})
export class ForgotPasswordPage implements OnInit {

  email: string = "";
  userSuccess: boolean = false;
  userError: boolean = false;
  serverError: boolean = false;

  constructor(private router: Router, private apiService: ApiService) { }

  ngOnInit() {
  }

  async onForgotPassword()
  {
    const req = {
      email: this.email
    };

    try{
      const response = await this.apiService.sendPatchRequest(req, "forgot-password");

      if(response.status === 200)
      {
        this.userSuccess = true;
      }
      else if(response.status === 400 || response.status === 403)
      {
        this.userError = true;
      }
      else if(response.status === 500)
      {
        this.serverError = true;
      }
    }
    catch(error)
    {
      console.error(error);
    }
  }
  onLogin()
  {
    this.router.navigate(['/login']);
  }

}
