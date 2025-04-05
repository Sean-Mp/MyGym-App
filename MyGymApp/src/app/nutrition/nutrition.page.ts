import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonCard, IonLabel, IonIcon} from '@ionic/angular/standalone';
import { RouterOutlet } from '@angular/router';
import { GlobalTabComponent } from '../global-tab/global-tab.component';
import { pencilSharp, addSharp} from 'ionicons/icons';
import { addIcons } from 'ionicons';

addIcons({
  'pen-sharp': pencilSharp,
  'add-sharp': addSharp
});
@Component({
  selector: 'app-nutrition',
  templateUrl: './nutrition.page.html',
  styleUrls: ['./nutrition.page.scss'],
  standalone: true,
  imports: [IonButton, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonLabel, IonIcon, CommonModule, FormsModule, RouterOutlet, GlobalTabComponent]
})
export class NutritionPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
