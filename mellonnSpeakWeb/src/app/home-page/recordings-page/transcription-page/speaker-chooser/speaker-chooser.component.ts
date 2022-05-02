import { AfterViewInit, Component, Input, OnInit, Renderer2 } from '@angular/core';
import { Recording } from 'src/models';
import { AudioService } from '../audio.service';
import { SpeakerWithWords } from '../transcription-service.service';

@Component({
  selector: 'app-speaker-chooser',
  templateUrl: './speaker-chooser.component.html',
  styleUrls: ['./speaker-chooser.component.scss']
})
export class SpeakerChooserComponent implements OnInit, AfterViewInit {
  @Input() recording: Recording;
  @Input() speakerWithWords: SpeakerWithWords[];

  speakerList: Speaker[] = [];
  autoSwitch: boolean = true;

  constructor(private renderer: Renderer2, private audio: AudioService) { }

  ngOnInit(): void {
    this.getSpeakers();
  }

  ngAfterViewInit(): void {
    this.selectSpeaker(0);

    this.audio.player.ontimeupdate = () => {
      if (this.autoSwitch) {
        this.getSpeaker(this.audio.player.currentTime);
      }
    }
  }

  getSpeakers(): void {
    for (let i = 0; i < this.recording.labels!.length; i++) {
      this.speakerList.push(
        new Speaker(
          this.recording.labels![i]!,
          i
        )
      );
    }
  }

  selectSpeaker(currentSpeaker: number): void {
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
  }

  getSpeaker(time: number): number {
    for (let sww of this.speakerWithWords) {
      if (sww.startTime <= time && time <= sww.endTime) {
        return +sww.speakerLabel.split('_')[1];
      }
    }
    return 0;
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
