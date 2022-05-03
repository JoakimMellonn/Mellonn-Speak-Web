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

  //Jumps the given amount of seconds in the audio
  jumpTime(time: number) {
    const current = this.audio.player.currentTime;
    if (current + time < 0 || current + time > this.audio.end) {
      this.audio.player.currentTime = this.audio.currentStart;
    } else {
      this.audio.player.currentTime = current + time;
    }
  }

  //Resets the position and chosen part of the media controls
  resetChosenBar() {
    const chosenBar = document.getElementById('chosenBar');
    this.renderer.setStyle(chosenBar, 'left', '0');
    this.renderer.setStyle(chosenBar, 'width', '100%');
    this.chosen = false;
  }

  //Sets the chosen part of the audio
  setChosenBar(start: number, end: number) {
    const chosenBar = document.getElementById('chosenBar');
    const chosen = document.getElementById('chosen');
    this.chosenStart = this.formatSeconds(start);
    this.chosenEnd = this.formatSeconds(end);
    let chosenLeft = this.getPercent(start, this.audio.end) + (this.getPercent(end - start, this.audio.end) / 2);
    if (chosenLeft < 2) chosenLeft = 2;
    if (chosenLeft > 97) chosenLeft = 97;
    this.chosen = true;
    this.renderer.setStyle(chosen, 'min-width', this.getChosenWidth(start, end));
    this.renderer.setStyle(chosenBar, 'left', this.getPercent(start, this.audio.end) + '%');
    this.renderer.setStyle(chosen, 'left', chosenLeft + '%');
    this.renderer.setStyle(chosenBar, 'width', this.getPercent(end - start, this.audio.end) + '%');
    this.renderer.setStyle(chosen, 'width', this.getPercent(end - start, this.audio.end) + '%');
  }

  //Updates the progress bar's state so the knob is the right place
  updateProgressState(currentTime: number) {
    if (currentTime < this.audio.currentStart) currentTime = this.audio.currentStart;
    if (currentTime > this.audio.currentEnd) currentTime = this.audio.currentEnd;
    const percent: number = this.getPercent(currentTime - this.audio.currentStart, this.audio.currentEnd - this.audio.currentStart);
    const progressBar = document.getElementById('progressBar');
    const knob = document.getElementById('seekKnob');
    this.currentTime = this.formatSeconds(currentTime);

    this.renderer.setStyle(progressBar, 'width', percent + '%');
    this.renderer.setStyle(knob, 'left', percent + '%');
  }

  //Called on mousedown event on the knob
  dragKnob(event: MouseEvent) {
    window.addEventListener('mousemove', this.drag.bind(this));
    window.addEventListener('mouseup', this.stopDrag.bind(this));
  }

  //Called on the mousemove event
  drag(event: MouseEvent) {
    const bar = document.getElementById('chosenBar');
    const percent = (event.clientX - bar!.getBoundingClientRect().left) / bar!.offsetWidth;
    this.updateProgressState(this.audio.currentEnd * percent + (this.audio.currentStart * (1 - percent)));
  }
  
  //Called on the mouseup event
  stopDrag(event: MouseEvent) {
    window.removeAllListeners!('mousemove');
    window.removeAllListeners!('mouseup');
    const bar = document.getElementById('chosenBar');
    const percent = (event.clientX - bar!.getBoundingClientRect().left) / bar!.offsetWidth;
    this.audio.player.currentTime = this.audio.currentEnd * percent + (this.audio.currentStart * (1 - percent));
  }

  //Gets the percent between the given place and the end
  getPercent(place: number, end: number): number {
    return (place / end) * 100;
  }

  //Formats the given amount of seconds to a readable string of HH:MM:SS
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

  //Gets the width for the chosen bar
  getChosenWidth(start: number, end: number): string {
    return (65 + this.addNumber(start) + this.addNumber(end)) + 'px';
  }

  //Gets the size for the chosen interval display
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
