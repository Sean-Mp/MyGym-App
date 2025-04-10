import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = "http://localhost::3000";

  constructor(private http: HttpClient) { }

  async sendPostRequest(data : any, endpoint : string): Promise<any>{
    const url = `${this.apiUrl}/${endpoint}`;
    return await firstValueFrom(this.http.post(url, data));
  }
  async sendPatchRequest(data: any, endpoint: string): Promise<any>{
    const url = `${this.apiUrl}/${endpoint}`;
    return await firstValueFrom(this.http.patch(url, data));
  }

  async sendGetRequest(data: any, endpoint: string): Promise<any>{
    const url = `${this.apiUrl}/${endpoint}`;
    return await firstValueFrom(this.http.get(url, {params: data}));
  }

  async sendPutRequest(data: any, endpoint: string): Promise<any>{
    const url = `${this.apiUrl}/${endpoint}`;
    return await firstValueFrom(this.http.put(url, {params: data}));
  }

}
