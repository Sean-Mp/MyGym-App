import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule} from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { IonContent, IonTabs, IonTabBar, IonTabButton, IonIcon, IonTab, IonHeader, IonToolbar, IonTitle, IonCard } from '@ionic/angular/standalone';
import { GlobalTabComponent } from '../global-tab/global-tab.component';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonCard, IonTitle, IonToolbar, IonHeader, IonTab, IonIcon, IonTabButton, IonTabBar, IonTabs, IonContent, CommonModule, FormsModule, GlobalTabComponent, RouterOutlet]
})

export class HomePage implements OnInit {

  constructor() { }

  ngOnInit() {
  }


}
