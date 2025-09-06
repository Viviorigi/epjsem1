import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';

export interface CarService {
  id: string;
  name: string;
  description: string;
  image: string;
  features: string[];
  pricing: {
    basic: {
      name: string;
      price: string;
      description: string;
    };
    standard: {
      name: string;
      price: string;
      description: string;
    };
    premium: {
      name: string;
      price: string;
      description: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  private dataUrl = 'assets/data/carrio-motors-data.json';
  private servicesData: Observable<any> | null = null;

  constructor(private http: HttpClient) { }

  private getData(): Observable<any> {
    if (!this.servicesData) {
      this.servicesData = this.http.get<any>(this.dataUrl).pipe(
        catchError(error => {
          console.error('Error fetching services data', error);
          return throwError('Failed to load services data. Please try again later.');
        }),
        shareReplay(1)
      );
    }
    return this.servicesData;
  }

  // Get all Car services
  getAllServices(): Observable<CarService[]> {
    return this.getData().pipe(
      map(data => data.services)
    );
  }

  // Get service by ID
  getServiceById(serviceId: string): Observable<CarService> {
    return this.getData().pipe(
      map(data => {
        const service = data.services.find((s: CarService) => s.id === serviceId);
        if (!service) {
          throw new Error(`Service with ID ${serviceId} not found`);
        }
        return service;
      }),
      catchError(error => {
        console.error('Error getting service by ID', error);
        return throwError(error);
      })
    );
  }

  // Get service pricing
  getServicePricing(serviceId: string): Observable<any> {
    return this.getServiceById(serviceId).pipe(
      map(service => service.pricing)
    );
  }

  // Get service features
  getServiceFeatures(serviceId: string): Observable<string[]> {
    return this.getServiceById(serviceId).pipe(
      map(service => service.features)
    );
  }

  // Get repair services
  getRepairServices(): Observable<CarService | null> {
    return this.getData().pipe(
      map(data => {
        return data.services.find((s: CarService) => s.id === 'repair') || null;
      })
    );
  }

  // Get appraisal services
  getAppraisalServices(): Observable<CarService | null> {
    return this.getData().pipe(
      map(data => {
        return data.services.find((s: CarService) => s.id === 'appraisal') || null;
      })
    );
  }

  // Get maintenance services
  getMaintenanceServices(): Observable<CarService | null> {
    return this.getData().pipe(
      map(data => {
        return data.services.find((s: CarService) => s.id === 'maintenance') || null;
      })
    );
  }
}