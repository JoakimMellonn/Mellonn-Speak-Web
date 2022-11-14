import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DocxService } from 'src/app/shared/docx-service/docx.service';
import { AudioService } from './services/audio.service';
import { TranscriptionService, SpeakerWithWords } from './services/transcription-service.service';
import { SpeakerEditService } from 'src/app/shared/speaker-edit-service/speaker-edit.service';
import { LabelService } from './label-edit/label.service';
import { VersionHistoryService } from './version-history/version-history.service';
import { ConversionService } from 'src/app/shared/conversion-service/conversion.service';



@Component({
  selector: 'app-transcription-page',
  templateUrl: './transcription-page.component.html',
  styleUrls: ['./transcription-page.component.scss']
})

export class TranscriptionPageComponent implements OnInit, OnDestroy {
  id: string;
  loading: boolean = true;
  error: boolean = false;
  url: string;
  dropdownShown: boolean = false;
  labelEditOpen: boolean = false;
  versionHistoryOpen: boolean = false;
  infoOpen: boolean = false;

  constructor(
    public service: TranscriptionService,
    public conversion: ConversionService,
    private route: ActivatedRoute,
    private audio: AudioService,
    private docx: DocxService,
    private speakerEdit: SpeakerEditService,
    private labelService: LabelService,
    private versionHistory: VersionHistoryService,
    private router: Router,
  ) { }

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    await this.service.getTranscription(this.id).then((value) => {
      if (value != 'null') {
        this.service.setTranscription(value);
      } else {
        this.error = true;
      }
    });
    await this.service.getRecording(this.id).then((value) => {
      if (value != 'null') {
        this.service.recording = value;
      } else {
        this.error;
      }
    });
    if (this.service.recording.labels == null || this.service.recording.labels == undefined || this.service.recording.labels.length != this.service.recording.speakerCount) {
      this.labelEditOpen = true;
    }
    this.url = await this.audio.getAudioUrl(this.service.recording.fileKey ?? '');
    this.audio.setAudioUrl(this.url);

    /**
     * Called when the user saves an edit.
     */
    this.speakerEdit.speakerEditReloadCalled.subscribe((res) => {
      //this.reloadTranscription(res);
    });

    /**
     * Called when the user saves the assign speaker labels.
     */
    this.labelService.closeModalCalled.subscribe(async (res) => {
      await this.service.getRecording(this.id).then((value) => {
        if (value != 'null') {
          this.service.recording = value;
          this.loading = false;
        } else {
          this.error;
        }
      });
      this.labelEditOpen = false;
    });

    /**
     * Called when the user recovers an older version of the transcription.
     */
    this.versionHistory.recoverTransCalled.subscribe(async (res) => {
      this.versionHistoryOpen = false;
    });

    /**
     * Adds eventListener for clicks everywhere.
     * These clicks are used to close/open dropdown menu and close modals.
     */
    window.addEventListener("click", (e) => {
      const checkbox = document.querySelector(".checkbox") as HTMLInputElement | null;
      const ele = <Element>e.target;
      let changed: boolean = false;

      //console.log(ele.id);

      if (ele.classList.contains("modalBackground")) {
        this.infoOpen = false;
        this.versionHistoryOpen = false;
      }

      if (checkbox?.checked) {
        checkbox.checked = false;
        changed = true;
      }

      if (ele.classList.contains("icon") && !checkbox?.checked && !changed) {
        checkbox!.checked = true;
      }
    });

    this.loading = false;
  }

  ngOnDestroy(): void {
    this.resetAudio();
    this.audio.destroy();
    window.removeAllListeners!();
  }

  downloadDOCX() {
    this.docx.generateDOCX(this.service.sww, this.service.recording);
  }

  startAudio() {
    this.audio.play();
  }

  pauseAudio() {
    this.audio.pause();
  }

  resetAudio() {
    this.audio.resetState();
  }

  async deleteRecording() {
    if (confirm('Are you ABSOLUTELY sure you want to delete this recording? This can NOT be undone')) {
      await this.service.deleteTranscription(this.service.recording);
      this.router.navigate(['/']);
    }
  }

  openHelp() {
    
  }
}