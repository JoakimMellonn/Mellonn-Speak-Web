import { Component, OnInit, Renderer2 } from '@angular/core';
import { SettingsService } from 'src/app/shared/settings-service/settings.service';
import { AudioService } from '../audio.service';

@Component({
  selector: 'app-audio-control',
  templateUrl: './audio-control.component.html',
  styleUrls: ['./audio-control.component.scss']
})
export class AudioControlComponent implements OnInit {
  currentTime: string;
  endTime: string;
  chosenStart: string;
  chosenEnd: string;
  chosen: boolean;
  jumpSecs: number;

  constructor(private renderer: Renderer2, private audio: AudioService, private settings: SettingsService) { }

  ngOnInit(): void {
    this.jumpSecs = this.settings.jumpSecs;

    this.audio.audioControlSetChosenCalled.subscribe((res) => {
      console.log('res: ' + res);
      this.setChosenBar(res[0], res[1]);
    });

    this.audio.audioControlResetChosenCalled.subscribe(() => {
      this.resetChosenBar();
    });

    this.audio.audioOnTimeUpdateCalled.subscribe(() => {
      this.endTime = this.formatSeconds(this.audio.end);
      this.updateProgressState(this.audio.player.currentTime);
    });
  }

  playPause() {
    const icon = document.getElementById('playPause');
    if (this.audio.player.paused) {
      this.renderer.removeClass(icon, 'fa-play');
      this.renderer.addClass(icon, 'fa-pause');
      this.audio.play();
    } else {
      this.renderer.removeClass(icon, 'fa-pause');
      this.renderer.addClass(icon, 'fa-play');
      this.audio.pause();
    }
  }

  jumpTime(time: number) {
    const current = this.audio.player.currentTime;
    if (current + time < 0 || current + time > this.audio.end) {
      this.audio.player.currentTime = this.audio.currentStart;
    } else {
      this.audio.player.currentTime = current + time;
    }
  }

  knobSeek() {
    const chosenBar = document.getElementById('chosenBar');
    const progressBar = document.getElementById('progressBar');
    const knob = document.getElementById('seekKnob');
  }

  resetChosenBar() {
    const chosenBar = document.getElementById('chosenBar');
    this.renderer.setStyle(chosenBar, 'left', '0');
    this.renderer.setStyle(chosenBar, 'width', '100%');
    this.chosen = false;
  }

  setChosenBar(start: number, end: number) {
    const chosenBar = document.getElementById('chosenBar');
    const chosen = document.getElementById('chosen');
    this.chosenStart = this.formatSeconds(start);
    this.chosenEnd = this.formatSeconds(end);
    this.chosen = true;
    this.renderer.setStyle(chosen, 'min-width', this.getChosenWidth(start, end));
    this.renderer.setStyle(chosenBar, 'left', this.getPercent(start, this.audio.end) + '%');
    this.renderer.setStyle(chosen, 'left', this.getPercent(start, this.audio.end) + (this.getPercent(end - start, this.audio.end) / 2) + '%');
    this.renderer.setStyle(chosenBar, 'width', this.getPercent(end - start, this.audio.end) + '%');
    this.renderer.setStyle(chosen, 'width', this.getPercent(end - start, this.audio.end) + '%');
  }

  updateProgressState(currentTime: number) {
    const percent: number = this.getPercent(currentTime - this.audio.currentStart, this.audio.currentEnd - this.audio.currentStart);
    const progressBar = document.getElementById('progressBar');
    const knob = document.getElementById('seekKnob');
    this.currentTime = this.formatSeconds(currentTime);

    this.renderer.setStyle(progressBar, 'width', percent + '%');
    this.renderer.setStyle(knob, 'left', percent + '%');
  }

  seek(event: MouseEvent) {
    const clickPercent = this.getClickPercent(event);
    console.log('Click percent: ' + clickPercent);
    this.audio.player.currentTime = this.audio.end * clickPercent;
  }

  dragKnob(event: MouseEvent) {
    window.addEventListener('mousemove', this.drag);
    window.addEventListener('mouseup', this.stopDrag);
  }

  drag(event: MouseEvent) {
    const bar = document.getElementById('chosenBar');
    console.log('Percent: ' + (event.clientX - bar!.getBoundingClientRect().left) / bar!.offsetWidth);
  }
  
  stopDrag() {
    console.log('Stopped drag');
    window.removeEventListener('mousemove', this.drag);
    window.removeEventListener('mouseup', this.stopDrag);
  }

  getClickPercent(event: MouseEvent): number {
    const chosenBar = document.getElementById('chosenBar');
    return (event.clientX - this.getPosition(chosenBar!)) / chosenBar!.offsetWidth;
  }

  getPosition(el: HTMLElement): number {
    return el.getBoundingClientRect().left;
  }

  getPercent(place: number, end: number): number {
    return (place / end) * 100;
  }

  formatSeconds(totalSeconds: number): string {
    let hours = Math.floor(Math.round(totalSeconds) / 3600);
    let minutes = Math.floor(Math.round(totalSeconds) / 60);
    let seconds = Math.round(totalSeconds) % 60;


    if (totalSeconds >= 3600) {
      let minutesString = String(minutes).padStart(2, "0");
      let secondsString = String(seconds).padStart(2, "0");
      return hours + ":" + minutesString + ":" + secondsString;
    } else {
      let secondsString = String(seconds).padStart(2, "0");
      return minutes + ":" + secondsString;
    }
  }

  getChosenWidth(start: number, end: number): string {
    return (65 + this.addNumber(start) + this.addNumber(end)) + 'px';
  }

  addNumber(secs: number): number {
    if (Math.round(secs) == 0) {
      return 1;
    } else if (secs < 600) {
      return 0;
    } else if (secs < 3600) {
      return 15;
    } else {
      return 30;
    }
  }
}
