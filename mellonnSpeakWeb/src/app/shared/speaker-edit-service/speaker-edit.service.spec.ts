import { TestBed } from '@angular/core/testing';

import { SpeakerEditService } from './speaker-edit.service';

describe('SpeakerEditService', () => {
  let service: SpeakerEditService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpeakerEditService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
