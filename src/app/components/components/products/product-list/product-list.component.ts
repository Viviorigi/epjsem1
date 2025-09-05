import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../../services/data.service';
import { Car } from '../../../services/cars.service';
import { ProductDetailModalComponent } from 'src/app/shared/product-detail-modal/product-detail-modal.component';
import { ProductModalService } from 'src/app/components/services/product-modal.service';

declare var $: any;

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, AfterViewInit {
  @ViewChild(ProductDetailModalComponent) productModal!: ProductDetailModalComponent;

  cars: Car[] = [];
  filteredcars: Car[] = [];
  categories: any[] = [];
  brands: any[] = [];

  selectedCategory = '';
  selectedBrand = '';

  currentPage = 1;
  itemsPerPage = 9;

  loading = true;
  error = '';

  Math = Math;

  selectedCar: Car | null = null;
  selectedCarCategory: any = null;
  relatedCars: Car[] = [];
  modalLoading = false;
  activeFilter: 'category' | 'brand' = 'category';  // <--- NEW

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    private router: Router,
    private productModalService: ProductModalService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const hasBrand = !!params['brand'];
      const hasCategory = !!params['category'];

      this.selectedCategory = params['category'] || '';
      this.selectedBrand = params['brand'] || '';

      if (hasBrand) {
        this.activeFilter = 'brand';
      } else if (hasCategory) {
        this.activeFilter = 'category';
      } 
      
      this.loadProducts();
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeIsotope(), 100);
  }

  loadProducts(): void {
    this.loading = true;
    this.dataService.getProductListPageData().subscribe({
      next: (data) => {
        this.cars = data.products ?? [];
        this.categories = data.categories ?? [];
        this.brands = data.brands ?? [];
        this.filterProducts();
        this.loading = false;
        setTimeout(() => this.initializeIsotope(), 100);
      },
      error: (err) => {
        this.error = 'Failed to load products. Please try again later.';
        this.loading = false;
        console.error('Error loading products:', err);
      }
    });
  }

filterByCategory(categoryId: string) {
  this.selectedCategory = categoryId;
  this.currentPage = 1;
  this.filterProducts();
  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: { category: categoryId || null },
    queryParamsHandling: 'merge'
  });
}

filterByBrand(brandId: string) {
  this.selectedBrand = brandId;
  this.currentPage = 1;
  this.filterProducts();
  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: { brand: brandId || null }, // null => remove param
    queryParamsHandling: 'merge'
  });
}

  filterProducts(): void {
    let filteredList = this.cars;

    if (this.selectedCategory) {
      filteredList = filteredList.filter(car => car.categoryId === this.selectedCategory);
    }

    if (this.selectedBrand) {
      filteredList = filteredList.filter(car => (car as any).brandId === this.selectedBrand);
    }

    const totalItems = filteredList.length;
    const totalPages = Math.ceil(totalItems / this.itemsPerPage);

    if (this.currentPage > totalPages && totalPages > 0) {
      this.currentPage = 1;
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, totalItems);
    this.filteredcars = filteredList.slice(startIndex, endIndex);

    setTimeout(() => this.initializeIsotope(), 100);
  }
  
 onCategoryClick(e: Event, categoryId: string) {
    e.preventDefault();
    this.activeFilter = 'category';      
    this.filterByCategory(categoryId);
  }

  onBrandClick(e: Event, brandId: string) {
    e.preventDefault();
    this.activeFilter = 'brand';         
    this.filterByBrand(brandId);
  }

  initializeIsotope(): void {
    if ($ && $.fn.isotope) {
      const productsGrid = $('.properties-box');
      if (!productsGrid.length) return;

      if (productsGrid.data('isotope')) productsGrid.isotope('destroy');

      productsGrid.isotope({ itemSelector: '.properties-items', layoutMode: 'fitRows' });

      // Nếu đang ở brand mode -> Isotope không filter theo category
      if (this.activeFilter === 'brand') {
        $('.properties-filter.categories li a').removeClass('is_active');
        productsGrid.isotope({ filter: '*' });
        return;
      }

      // Category mode: highlight & filter theo category
      const $catLinks = $('.properties-filter.categories li a');
      $catLinks.removeClass('is_active');

      if (this.selectedCategory) {
        $catLinks.filter(`[data-filter=".${this.selectedCategory}"]`).addClass('is_active');
        productsGrid.isotope({ filter: `.${this.selectedCategory}` });
      } else {
        $catLinks.filter('[data-filter="*"]').addClass('is_active');
        productsGrid.isotope({ filter: '*' });
      }
    }
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.filterProducts();
    window.scrollTo(0, 0);
  }

  // ✅ Pagination should reflect filtered list, not all cars
  get totalPages(): number {
    return Math.ceil((this.cars
      .filter(c => !this.selectedCategory || c.categoryId === this.selectedCategory)
      .filter(c => !this.selectedBrand || (c as any).brandId === this.selectedBrand)
    ).length / this.itemsPerPage) || 1;
  }

  getPageNumbers(): number[] {
    const pages = this.totalPages;
    return Array.from({ length: pages }, (_, i) => i + 1);
  }

  navigateToProductDetail(productId: string): void {
    this.router.navigate(['/products', productId]);
  }

  ngOnDestroy(): void {
    const productsGrid = $('.properties-box');
    if (productsGrid.length && productsGrid.data('isotope')) {
      productsGrid.isotope('destroy');
    }
  }

  openCarDetails(car: Car): void {
    this.modalLoading = true;
    this.selectedCar = car;

    this.productModalService.getProductDetail(car.id).subscribe({
      next: (data) => {
        this.selectedCar = data.product;
        this.selectedCarCategory = data.category;
        this.relatedCars = data.relatedProducts ?? [];
        this.modalLoading = false;

        this.productModal.show();
      },
      error: (err) => {
        this.error = 'Cannot load product details. Please try again later.';
        this.modalLoading = false;
        console.error('Error loading product details:', err);
      }
    });
  }

  onCloseModal(): void {
    this.selectedCar = null;
  }

  onViewRelatedCar(car: Car): void {
    this.openCarDetails(car);
  }

  // Helper to display brand name
  getBrandName(brandId: string): string {
    const b = this.brands?.find(x => x.id === brandId);
    return b?.name ?? brandId;
  }
}
