import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon} from '@ionic/angular/standalone';
import { restaurantSharp, barbellSharp, personSharp } from 'ionicons/icons';
import { addIcons } from 'ionicons';

addIcons({
  'restaurant-sharp': restaurantSharp,
  'barbell-sharp': barbellSharp,
  'person-sharp': personSharp
});
@Component({
  selector: 'app-global-tab',
  templateUrl: './global-tab.component.html',
  styleUrls: ['./global-tab.component.scss'],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, RouterLink]
})
export class GlobalTabComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
