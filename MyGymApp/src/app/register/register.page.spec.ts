import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterPage } from './register.page';
import { LoginPage } from '../login/login.page';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockApiService = jasmine.createSpyObj('ApiService', ['sendPostRequest']);

    await TestBed.configureTestingModule({
        imports: [FormsModule, HttpClientTestingModule, RouterTestingModule, RegisterPage],
        providers:[
            {provide: Router, useValue: mockRouter},
            {provide: ApiService, useValue: mockApiService},
        ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty credentials', () => {
    expect(component.username).toBe('');
    expect(component.email).toBe('');
    expect(component.password).toBe('');
  });

  it('should navigate to login page', () => {
    component.onLogin();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should call API when email, username and password is provided', async() => {
    component.username = 'testuser';
    component.email = 'test@example.com';
    component.password = 'password123';

    await component.onRegister();

    expect(mockApiService.sendPostRequest).toHaveBeenCalledWith(
        {username: 'testuser', email: 'test@example.com', password: 'password123'},
        'signup'
    );
  });

  it('should navigate to home page on succesful login', async() =>{
    mockApiService.sendPostRequest.and.returnValue(Promise.resolve({status: 200}));
    await component.onRegister();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should set userError on 400 response', async() => {
    mockApiService.sendPostRequest.and.returnValue(Promise.resolve({status: 400}));
    await component.onRegister();
    expect(component.userError).toBeTrue();
  });

  it('should set userExistsError on 403 respons', async() => {
    mockApiService.sendPostRequest.and.returnValue(Promise.resolve({status: 403}));
    await component.onRegister();
    expect(component.userExistsError).toBeTrue();
  })

  it('should set serverError on 500 response', async () => {
    mockApiService.sendPostRequest.and.returnValue(Promise.resolve({status: 500}));
    await component.onRegister();
    expect(component.serverError).toBeTrue();
  })
});
