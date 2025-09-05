// product-detail-modal.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Car } from 'src/app/components/services/cars.service';

declare var $: any;

@Component({
  selector: 'app-product-detail-modal',
  templateUrl: './product-detail-modal.component.html',
  styleUrls: ['./product-detail-modal.component.scss']
})
export class ProductDetailModalComponent implements OnInit {
  @Input() car: Car | null = null;
  @Input() category: any = null;
  @Input() relatedCars: Car[] = [];
  @Input() loading: boolean = false;
  
  @Output() closeModal = new EventEmitter<void>();
  @Output() viewRelatedCar = new EventEmitter<Car>();
  
  activeImageIndex: number = 0;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
  }

  show(): void {
    $('#productDetailModal').modal('show');
    setTimeout(() => {
      this.initializeModalComponents();
    }, 200);
  }
  
  hide(): void {
    $('#productDetailModal').modal('hide');
    this.closeModal.emit();
  }
  
  changeImage(index: number): void {
    this.activeImageIndex = index;
  }
  
  viewRelated(Car: Car): void {
    this.viewRelatedCar.emit(Car);
  }
  
  private initializeModalComponents(): void {
    $('.modal-product-gallery .gallery-item').on('click', function() {
      $('.modal-product-gallery .gallery-item').removeClass('active');
      $(this).addClass('active');
    });
  }
  
  getDiscountedPrice(price: number, discount: number | null): number {
    if (discount) {
      return price * (1 - discount/100);
    }
    return price;
  }
  
  getSanitizedDescription() {
    if (this.car && this.car.description) {
      return this.sanitizer.bypassSecurityTrustHtml(this.car.description);
    }
    return '';
  }
}