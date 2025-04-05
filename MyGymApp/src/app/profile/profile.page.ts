import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonButton } from '@ionic/angular/standalone';
import { RouterOutlet } from '@angular/router';
import { GlobalTabComponent } from '../global-tab/global-tab.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonButton, IonLabel, IonItem, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, RouterOutlet, GlobalTabComponent]
})
export class ProfilePage implements OnInit {

  constructor() { }

  ngOnInit() {
    //TO-DO
    const statsButton = document.getElementById('statsButton') as HTMLButtonElement;
    statsButton.addEventListener('click', () => {

    });

    const themeButton = document.getElementById('themeButton') as HTMLButtonElement;
    themeButton.addEventListener('click', () => {
      
    });

    const passwordButton = document.getElementById('passwordButton') as HTMLButtonElement;
    passwordButton.addEventListener('click', () => {

    });

    const deleteButton = document.getElementById('deleteButton') as HTMLButtonElement;
    deleteButton.addEventListener('click', () => {

    });

    const logoutButton = document.getElementById('logoutButton') as HTMLButtonElement;
    logoutButton.addEventListener('click', () => {

    });
  }

}
