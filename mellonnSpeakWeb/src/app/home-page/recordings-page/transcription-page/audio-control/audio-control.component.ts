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

    this.audio.player.ontimeupdate = () => {
      //console.log('Current time: ' + this.audio.player.currentTime + ', current end: ' + this.audio.currentEnd);
      this.updateProgressState(this.audio.player.currentTime);
    };
  }

  knobSeek() {
    const chosenBar = document.getElementById('chosenBar');
    const progressBar = document.getElementById('progressBar');
    const knob = document.getElementById('seekKnob');

    //chosenBar?.addEventListener('click', this.seek);
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
    const percent: number = this.getPercent(currentTime - this.audio.currentStart, this.audio.currentEnd - this.audio.currentStart);
    const progressBar = document.getElementById('progressBar');
    const knob = document.getElementById('seekKnob');

    this.renderer.setStyle(progressBar, 'width', percent + '%');
    this.renderer.setStyle(knob, 'left', percent + '%');
  }

  seek(event: MouseEvent) {
    const clickPercent = this.getClickPercent(event);
    console.log('Click percent: ' + clickPercent);
    this.audio.player.currentTime = this.audio.end * clickPercent;
  }

  dragKnob(event: MouseEvent) {
    const knob = document.getElementById('seekKnob');
    const clickPercent = this.getClickPercent(event);

    window.addEventListener('mouseup', this.stopDrag);
    window.addEventListener('mousemove', this.drag);
  }

  drag(event: MouseEvent) {
    const bar = document.getElementById('chosenBar');
    console.log('Percent: ' + (event.clientX - bar!.getBoundingClientRect().left) / bar!.offsetWidth);
  }
  
  stopDrag() {
    window.removeEventListener('mousemove', this.drag);
    window.removeEventListener('mouseup', this.stopDrag);
    window.removeAllListeners;
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

}
