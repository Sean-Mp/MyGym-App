import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateWorkoutPage } from './create-workout.page';

describe('CreateWorkoutPage', () => {
  let component: CreateWorkoutPage;
  let fixture: ComponentFixture<CreateWorkoutPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateWorkoutPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
