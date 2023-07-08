import { TestBed } from '@angular/core/testing';

import { PromotionDbService } from './promotion-db.service';

describe('PromotionDbService', () => {
  let service: PromotionDbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PromotionDbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
