import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmbassadorPageComponent } from './ambassador-page.component';

describe('AmbassadorPageComponent', () => {
  let component: AmbassadorPageComponent;
  let fixture: ComponentFixture<AmbassadorPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AmbassadorPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AmbassadorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
