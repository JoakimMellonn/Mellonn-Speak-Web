import { Component, OnInit, Renderer2 } from '@angular/core';
import { AudioService } from '../audio.service';

@Component({
  selector: 'app-audio-control',
  templateUrl: './audio-control.component.html',
  styleUrls: ['./audio-control.component.scss']
})
export class AudioControlComponent implements OnInit {

  constructor(private renderer: Renderer2, private audio: AudioService) { }

  ngOnInit(): void {
    this.audio.audioControlSetChosenCalled.subscribe((res) => {
      console.log('res: ' + res);
      this.setChosenBar(res[0], res[1]);
    });

    this.audio.audioControlResetChosenCalled.subscribe((res) => {
      this.resetChosenBar();
    });

    this.audio.audioProgressCalled.subscribe((res) => {
      this.updateProgressState(res);
    });

    this.audio.player.ontimeupdate = () => {
      console.log('Current time: ' + this.audio.player.currentTime);
      this.updateProgressState(this.audio.player.currentTime);
    };
  }

  resetChosenBar() {
    const chosenBar = document.getElementById('chosenBar');
    this.renderer.setStyle(chosenBar, 'left', '0');
    this.renderer.setStyle(chosenBar, 'width', '100%');
  }

  setChosenBar(start: number, end: number) {
    const chosenBar = document.getElementById('chosenBar');
    this.renderer.setStyle(chosenBar, 'left', this.getPercent(start, this.audio.end) + '%');
    this.renderer.setStyle(chosenBar, 'width', this.getPercent(end - start, this.audio.end) + '%');
  }

  updateProgressState(currentTime: number) {
    const percent: number = this.getPercent(currentTime, this.audio.currentEnd);
    const progressBar = document.getElementById('progressBar');
    const knob = document.getElementById('seekKnob');

    this.renderer.setStyle(progressBar, 'width', percent + '%');
    this.renderer.setStyle(knob, 'left', percent + '%');
  }

  getPercent(place: number, end: number): number {
    return (place / end) * 100;
  }

}
