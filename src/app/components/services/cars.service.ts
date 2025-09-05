import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, shareReplay } from 'rxjs/operators';

export interface Car {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  price: number;
  discount: number | null;
  description: string;
  features: string[];
  specifications: {
    movement: string;
    caseSize: string;
    waterResistance: string;
    material: string;
    features: string[];
  };
  images: string[];
  inStock: boolean;
  warranty: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  features: string[];
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  image: string;
  features: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CarsService {
  private dataUrl = 'assets/data/carrio-motors-data.json';
  private carsData: Observable<any> | null = null;

  constructor(private http: HttpClient) { }

  private getData(): Observable<any> {
    if (!this.carsData) {
      this.carsData = this.http.get<any>(this.dataUrl).pipe(
        catchError(error => {
          console.error('Error fetching Car data', error);
          return throwError('Failed to load Car data. Please try again later.');
        }),
        shareReplay(1)
      );
    }
    return this.carsData;
  }

  getAllcars(): Observable<Car[]> {
    return this.getData().pipe(
      map(data => data.products)
    );
  }

  getcarsByCategory(categoryId: string): Observable<Car[]> {
    return this.getData().pipe(
      map(data => data.products.filter((product: Car) => product.categoryId === categoryId))
    );
  }

  getCarById(CarId: string): Observable<Car> {
    return this.getData().pipe(
      map(data => {
        const Car = data.products.find((product: Car) => product.id === CarId);
        if (!Car) {
          throw new Error(`Car with ID ${CarId} not found`);
        }
        return Car;
      }),
      catchError(error => {
        console.error('Error getting Car by ID', error);
        return throwError(error);
      })
    );
  }

  getAllCategories(): Observable<Category[]> {
    return this.getData().pipe(
      map(data => data.categories)
    );
  }

  getCategoryById(categoryId: string): Observable<Category> {
    return this.getData().pipe(
      map(data => {
        const category = data.categories.find((cat: Category) => cat.id === categoryId);
        if (!category) {
          throw new Error(`Category with ID ${categoryId} not found`);
        }
        return category;
      }),
      catchError(error => {
        console.error('Error getting category by ID', error);
        return throwError(error);
      })
    );
  }

  getFeaturedCars(limit: number = 6): Observable<Car[]> {
    return this.getData().pipe(
      map(data => {
        const discountedcars = data.products.filter((Car: Car) => Car.discount !== null);

        if (discountedcars.length >= limit) {
          return discountedcars.slice(0, limit);
        }

        const othercars = data.products
          .filter((Car: Car) => Car.discount === null)
          .slice(0, limit - discountedcars.length);
          
        return [...discountedcars, ...othercars];
      })
    );
  }

  getcarsByPriceRange(minPrice: number, maxPrice: number): Observable<Car[]> {
    return this.getData().pipe(
      map(data => {
        return data.products.filter((Car: Car) => {
          const actualPrice = Car.discount 
            ? Car.price * (1 - Car.discount / 100) 
            : Car.price;
            
          return actualPrice >= minPrice && actualPrice <= maxPrice;
        });
      })
    );
  }

  searchcars(query: string): Observable<Car[]> {
    if (!query.trim()) {
      return of([]);
    }
    
    const searchTerm = query.toLowerCase().trim();
    return this.getData().pipe(
      map(data => {
        return data.products.filter((Car: Car) => 
          Car.name.toLowerCase().includes(searchTerm) || 
          Car.brand.toLowerCase().includes(searchTerm) ||
          Car.description.toLowerCase().includes(searchTerm)
        );
      })
    );
  }

  getRelatedcars(CarId: string, limit: number = 4): Observable<Car[]> {
    return this.getData().pipe(
      map(data => {
        const currentCar = data.products.find((w: Car) => w.id === CarId);
        if (!currentCar) {
          return [];
        }
        
        const sameCategory = data.products.filter((w: Car) => 
          w.categoryId === currentCar.categoryId && w.id !== CarId
        );
        
        if (sameCategory.length >= limit) {
          return sameCategory.slice(0, limit);
        }
        
        const sameBrand = data.products.filter((w: Car) => 
          w.brand === currentCar.brand && 
          w.id !== CarId && 
          !sameCategory.some(c => c.id === w.id)
        );
        
        const related = [...sameCategory, ...sameBrand];
        
        if (related.length < limit) {
          const remaining = data.products.filter((w: Car) => 
            w.id !== CarId && 
            !related.some(r => r.id === w.id)
          ).slice(0, limit - related.length);
          
          return [...related, ...remaining];
        }
        
        return related.slice(0, limit);
      })
    );
  }
}