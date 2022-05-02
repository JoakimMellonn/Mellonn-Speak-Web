import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeakerChooserComponent } from './speaker-chooser.component';

describe('SpeakerChooserComponent', () => {
  let component: SpeakerChooserComponent;
  let fixture: ComponentFixture<SpeakerChooserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SpeakerChooserComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpeakerChooserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
