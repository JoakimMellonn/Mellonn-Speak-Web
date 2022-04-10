import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranscriptionPageComponent } from './transcription-page.component';

describe('TranscriptionPageComponent', () => {
  let component: TranscriptionPageComponent;
  let fixture: ComponentFixture<TranscriptionPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TranscriptionPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TranscriptionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
