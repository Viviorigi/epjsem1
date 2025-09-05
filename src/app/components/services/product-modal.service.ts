
import { Injectable } from '@angular/core';
import { DataService } from '../services/data.service';
import { Car } from './cars.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductModalService {
  private selectedCar: Car | null = null;
  
  constructor(private dataService: DataService) { }
  
  getProductDetail(productId: string): Observable<any> {
    return this.dataService.getProductDetailPageData(productId);
  }
}