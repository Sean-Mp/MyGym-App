import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent } from '@ionic/angular/standalone';
import { EditWorkoutComponent } from '../edit-workout/edit-workout.component';

@Component({
  selector: 'app-view-workout',
  templateUrl: './view-workout.component.html',
  styleUrls: ['./view-workout.component.scss'],
  imports: [IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent],
})
export class ViewWorkoutComponent  implements OnInit {

  constructor(private modalController: ModalController) { }

  ngOnInit() {
    //make API call to get exercises
  }

  closeModal()
  {
    this.modalController.dismiss();
  }
  startWorkout()
  {

  }
  editWorkout()
  {
    this.modalController.dismiss();
    this.modalController.create({
      component: EditWorkoutComponent,
      cssClass: 'my-custom-class'
    }).then((modal) => {
      modal.present();
    });
  }

}
