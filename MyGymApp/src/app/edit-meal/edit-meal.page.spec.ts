import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditMealPage } from './edit-meal.page';

describe('EditMealPage', () => {
  let component: EditMealPage;
  let fixture: ComponentFixture<EditMealPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditMealPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
