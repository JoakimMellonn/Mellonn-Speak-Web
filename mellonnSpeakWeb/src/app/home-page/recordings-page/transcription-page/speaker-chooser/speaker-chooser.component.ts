import { AfterViewInit, Component, Input, OnInit, Renderer2 } from '@angular/core';
import { SpeakerEditService, SpeakerSwitch } from 'src/app/shared/speaker-edit-service/speaker-edit.service';
import { Recording } from 'src/models';
import { AudioService } from '../services/audio.service';
import { SpeakerWithWords } from '../services/transcription-service.service';
import { Transcription } from '../transcription';

@Component({
  selector: 'app-speaker-chooser',
  templateUrl: './speaker-chooser.component.html',
  styleUrls: ['./speaker-chooser.component.scss']
})
export class SpeakerChooserComponent implements OnInit, AfterViewInit {
  @Input() recording: Recording;
  @Input() speakerWithWords: SpeakerWithWords[];
  @Input() transcription: Transcription;

  currentTime: number;
  speakerList: Speaker[] = [];
  autoSwitch: boolean = true;
  speakerSwitches: SpeakerSwitch[] = [];
  lastPosition: number = 0;
  lastSpeaker: number;
  unsavedTranscription: Transcription;
  saved: boolean = true;

  constructor(private renderer: Renderer2, private audio: AudioService, private speakerEdit: SpeakerEditService) { }

  ngOnInit(): void {
    this.getSpeakers();
    this.speakerSwitches = this.speakerEdit.getSpeakerSwitches(this.transcription);
  }

  ngAfterViewInit(): void {
    let firstSpeaker: number = +this.transcription.results.speaker_labels.segments[0].speaker_label.split('_')[1];
    this.selectSpeaker(firstSpeaker, 0, true);
    this.lastSpeaker = firstSpeaker;

    var timeInterval = setInterval(() => {
      if (this.autoSwitch) {
        for (let sw of this.speakerSwitches) {
          const minTime = Math.round(this.audio.player.currentTime * 100) / 100 - 0.01;
          const maxTime = Math.round(this.audio.player.currentTime * 100) / 100 + 0.01;
          if (sw.start >= minTime && sw.start <= maxTime) {
            if (sw.speaker != this.lastSpeaker) {
              this.selectSpeaker(sw.speaker, sw.start, true);
            }
          }
        }
      }
    }, 10);

    this.audio.audioOnTimeUpdateCalled.subscribe(() => {
      this.currentTime = this.audio.player.currentTime;
    });
  }

  save() {

  }

  cancel() {
    this.unsavedTranscription = this.transcription;
    this.saved = true;
  }

  getSpeakers() {
    for (let i = 0; i < this.recording.labels!.length; i++) {
      this.speakerList.push(
        new Speaker(
          this.recording.labels![i]!,
          i
        )
      );
    }
  }

  selectSpeaker(currentSpeaker: number, position: number, automatic: boolean) {
    for (let speaker of this.speakerList) {
      const item = document.getElementById('speaker' + speaker.number);
      this.renderer.removeClass(item, 'chosenSpeaker');
      this.renderer.removeClass(item, 'speaker');
      if (speaker.number == currentSpeaker) {
        this.renderer.addClass(item, 'chosenSpeaker');
      } else {
        this.renderer.addClass(item, 'speaker');
      }
    }
    if (!automatic) this.saved = false;
    this.switchSpeaker(position, currentSpeaker);
  }

  getSpeaker(time: number): number {
    for (let sww of this.speakerWithWords) {
      if (sww.startTime <= time && time <= sww.endTime) {
        return +sww.speakerLabel.split('_')[1];
      }
    }
    return 0;
  }

  switchSpeaker(position: number, speaker: number) {
    console.log('Switched speaker: ' + position + ', speaker: ' + speaker);
    let startTime: number = this.lastPosition;
    let endTime: number = position;
    let oldTranscription: Transcription = this.transcription;

    if (endTime != 0) {
      if (startTime == 0) {
        endTime = Math.round(+(endTime - 0.01) * 100) / 100;
        startTime = Math.round((startTime + 0.01) * 100) / 100;
      } else {
        endTime = Math.round((endTime - 0.01) * 100) / 100;
        startTime = Math.round(startTime * 100) / 100;
      }
    }

    if (startTime < endTime) {
      let newTranscription: Transcription = this.speakerEdit.getNewSpeakerLabels(oldTranscription, startTime, endTime, this.lastSpeaker);

      this.unsavedTranscription = newTranscription;
      this.speakerSwitches = this.speakerEdit.getSpeakerSwitches(newTranscription);

      this.lastPosition = position;
      this.lastSpeaker = speaker;
      console.log('Saved switch, lastPosition: ' + this.lastPosition + ', lastSpeaker: ' + this.lastSpeaker);
    }
  }

}

export class Speaker {
  label: string;
  number: number;

  constructor(label: string, number: number) {
    this.label = label;
    this.number = number;
  }
}
