import { Injectable } from '@angular/core';
import { Storage } from 'aws-amplify';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  player = new Audio();
  playerUrl: string;
  start: number;
  end: number;
  currentStart: number;
  currentEnd: number;
  loadedFirst: boolean = false;

  private audioControlSetChosen = new Subject<number[]>();
  audioControlSetChosenCalled = this.audioControlSetChosen.asObservable();

  private audioControlResetChosen = new Subject<any>();
  audioControlResetChosenCalled = this.audioControlResetChosen.asObservable();

  constructor() { }

  async setAudioUrl(url: string) {
    this.playerUrl = url;
    this.player.src = url;
    this.start = 0;

    this.player.onloadedmetadata = () => {
      if (!this.loadedFirst) {
        this.end = this.player.duration;
        this.currentStart = 0;
        this.currentEnd = this.player.duration;
        this.player.currentTime = 0;
        this.loadedFirst = true;
      }
    }
  }

  resetState() {
    console.log('Reset audio state...');
    this.player.src = this.playerUrl;
    this.loadedFirst = false;
    this.audioControlResetChosen.next(1);
  }

  async getAudioUrl(key: string): Promise<string> {
    try {
      const url = await Storage.get(key, {level: 'private'});
      return url;
    } catch (err) {
      console.log('Error while get audio url: ' + err);
      return '' + err;
    }
  }

  playPause() {
    if (this.player.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  setStartEnd(start: number, end: number) {
    console.log('Setting start-end: ' + start + 's - ' + end + 's');
    const newUrl: string = this.playerUrl + '#t=' + start + ',' + end;
    this.player.src = newUrl;
    this.player.currentTime = 0;
    this.currentStart = start;
    this.currentEnd = end;
    this.audioControlSetChosen.next([start, end]);
  }

  play() {
    this.player.play();
  }

  pause() {
    this.player.pause();
  }
}
