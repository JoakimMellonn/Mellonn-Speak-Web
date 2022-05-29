import { Component, Input, OnInit } from '@angular/core';
import { LanguageService } from 'src/app/shared/language-service/language.service';
import { SettingsService } from 'src/app/shared/settings-service/settings.service';
import { UploadService } from 'src/app/shared/upload-service/upload.service';

@Component({
  selector: 'app-upload-page',
  templateUrl: './upload-page.component.html',
  styleUrls: ['./upload-page.component.scss']
})
export class UploadPageComponent implements OnInit {
  @Input() file: File;

  player = new Audio();
  audioLoaded: boolean = false;
  duration: number;

  title: string;
  description: string;

  speakerSelect: number = 2;
  languageSelect: string;

  constructor(
    public languageService: LanguageService,
    public settingsService: SettingsService,
    private uploadService: UploadService
  ) { }

  ngOnInit(): void {
    this.languageSelect = this.settingsService.currentSettings.languageCode;
    const fileUrl = URL.createObjectURL(this.file);
    this.player.src = fileUrl;
    this.uploadService.uploadFile = this.file;

    this.player.onloadedmetadata = () => {
      if (!this.audioLoaded) {
        this.duration = this.player.duration;
        this.audioLoaded = true;
      }
    }
  }

  
}
