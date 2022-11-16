import { Component, OnInit } from '@angular/core';
import { TranscriptionService } from '../services/transcription-service.service';

@Component({
  selector: 'app-guide',
  templateUrl: './guide.component.html',
  styleUrls: ['./guide.component.scss']
})
export class GuideComponent implements OnInit {
  currentPage: number = 0;

  constructor(
    private service: TranscriptionService
  ) { }

  ngOnInit(): void {
  }

  setPage(page: number) {
    this.currentPage = page;
  }

  done() {
    localStorage.setItem('guided', 'true');
    this.service.setCurrentMode('default');
  }
}
