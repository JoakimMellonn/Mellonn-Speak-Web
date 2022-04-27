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

  private audioControlSetChosen = new Subject<number[]>();
  audioControlSetChosenCalled = this.audioControlSetChosen.asObservable();

  private audioControlResetChosen = new Subject<any>();
  audioControlResetChosenCalled = this.audioControlResetChosen.asObservable();

  private audioProgress = new Subject<number>();
  audioProgressCalled = this.audioProgress.asObservable();

  constructor() { }

  async setAudioUrl(url: string) {
    this.playerUrl = url;
    this.player.src = url;
    this.start = 0;
    this.currentStart = 0;

    this.player.onloadedmetadata = () => {
      this.end = this.player.duration;
      this.currentEnd = this.player.duration;
      this.player.currentTime = 0;
    }
  }

  progressUpdater() {
    this.audioProgress.next(this.player.currentTime);
  }

  resetState() {
    console.log('Reset audio state...');
    this.player.src = this.playerUrl;
    this.player.currentTime = 0;
    this.currentStart = 0;
    this.currentEnd = this.player.duration;
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

  setStartEnd(start: number, end: number) {
    console.log('Setting start-end: ' + start + 's - ' + end + 's');
    const newUrl: string = this.playerUrl + '#t=' + start + ',' + end;
    this.player.src = newUrl;
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
