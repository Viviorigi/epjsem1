// home.component.ts
import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { CarsService, Car, Category } from '../../services/cars.service';
import { CompanyService, Statistics } from '../../services/company.service';
import { Router } from '@angular/router';
import { Testimonial, TestimonialsService } from '../../services/testimonial.service';
import { ProductModalService } from '../../services/product-modal.service';
import Swal from 'sweetalert2';
import { ProductDetailModalComponent } from 'src/app/shared/product-detail-modal/product-detail-modal.component';

declare var $: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild(ProductDetailModalComponent) productModal!: ProductDetailModalComponent;
  
  featuredCars: Car[] = [];
  categories: Category[] = [];
  statistics: Statistics | null = null;
  testimonials: Testimonial[] = [];
  companyInfo: any = null;
  loading = true;
  error = '';
  contactForm: FormGroup;
  
  selectedCar: Car | null = null;
  selectedCategory: any = null;
  relatedCars: Car[] = [];
  modalLoading: boolean = false;

  constructor(
    private dataService: DataService,
    private carService: CarsService,
    private companyService: CompanyService,
    private testimonialsService: TestimonialsService,
    private productModalService: ProductModalService,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initContactForm();
    this.loadAllData();
  }
  
  ngAfterViewInit(): void {
  }

  initContactForm(): void {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: [''],
      message: ['', Validators.required]
    });
  }

  onSubmitContactForm(): void {
    if (this.contactForm.valid) {
      Swal.fire({
        title: 'Success!',
        text: 'Thank you for your message! We will get back to you soon.',
        icon: 'success',
        confirmButtonText: 'Close'
      });
      this.contactForm.reset();
    } else {
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key).markAsTouched();
      });
    }
  }

  loadAllData(): void {
    this.dataService.getHomePageData().subscribe({
      next: (data) => {
        this.featuredCars = data.featuredCars;
        this.categories = data.categories;
        this.statistics = data.statistics;
        this.companyInfo = data.company;
        this.testimonials = data.testimonials;
        this.loading = false;
        setTimeout(() => {
          this.initializeOwlCarousel();
          this.initializeCounters();
          this.initializeTabs();
        }, 100);
      },
      error: (err) => {
        this.error = 'Failed to load homepage data. Please try again later.';
        this.loading = false;
        console.error('Error loading homepage data:', err);
      }
    });
  }
  
  openCarDetails(Car: Car): void {
    this.modalLoading = true;
    this.selectedCar = Car;
    
    this.productModalService.getProductDetail(Car.id).subscribe({
      next: (data) => {
        this.selectedCar = data.product;
        this.selectedCategory = data.category;
        this.relatedCars = data.relatedProducts;
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
  
  onViewRelatedCar(Car: Car): void {
    this.openCarDetails(Car);
  }

  initializeTabs(): void {
    const firstTab = document.querySelector('.nav-tabs .nav-link.active');
    if (firstTab) {
      (firstTab as HTMLElement).click();
    }
  }

  initializeOwlCarousel(): void {
    $('.owl-banner').owlCarousel({
      items: 1,
      loop: true,
      dots: true,
      nav: true,
      autoplay: true,
      margin: 30,
      responsive: {
        0: { items: 1 },
        600: { items: 1 },
        1000: { items: 1 }
      },
      navText: [
        '<i class="fas fa-chevron-left"></i>',
        '<i class="fas fa-chevron-right"></i>'
      ]
    });
  }

  initializeCounters(): void {
    $('.timer').each(function() {
      $(this).prop('Counter', 0).animate({
        Counter: $(this).attr('data-to')
      }, {
        duration: 2000,
        easing: 'swing',
        step: function(now) {
          $(this).text(Math.ceil(now).toLocaleString());
        }
      });
    });
  }

  navigateToCategory(categoryId: string): void {
    this.router.navigate(['/products'], { queryParams: { category: categoryId } });
  }

  private handleError(error: any): void {
    this.error = 'Error loading data. Please try again later.';
    this.loading = false;
    console.error('API Error:', error);
  }
}