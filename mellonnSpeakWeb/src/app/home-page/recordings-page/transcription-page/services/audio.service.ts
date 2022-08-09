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
  labelActive: boolean = false;

  private audioControlSetChosen = new Subject<number[]>();
  audioControlSetChosenCalled = this.audioControlSetChosen.asObservable();

  private audioControlResetChosen = new Subject<any>();
  audioControlResetChosenCalled = this.audioControlResetChosen.asObservable();

  private audioOnTimeUpdate = new Subject<any>();
  audioOnTimeUpdateCalled = this.audioOnTimeUpdate.asObservable();

  private audioOnEnd = new Subject<any>();
  audioOnEndCalled = this.audioOnEnd.asObservable();

  private switchSpeaker = new Subject<number[]>();
  switchSpeakerCalled = this.switchSpeaker.asObservable();

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

    this.player.ontimeupdate = () => {
      this.audioOnTimeUpdate.next(1);
    }

    this.player.onended = () => {
      if (!this.labelActive) this.switchSpeakers(this.player.currentTime, this.currentStart);
      this.audioOnEnd.next(1);
    }

    this.player.onerror = (err) => {
      console.error('Audio error: ' + err);
    }
  }

  destroy() {
    this.loadedFirst = false;
    this.end = 0;
  }

  resetState() {
    this.player.pause();
    this.player.src = this.playerUrl;
    this.loadedFirst = false;
    this.audioControlResetChosen.next(1);
  }

  async getAudioUrl(key: string): Promise<string> {
    try {
      const url = await Storage.get(key, {level: 'private', expires: 360});
      return url;
    } catch (err) {
      console.error('Error while getting audio url: ' + err);
      return '' + err;
    }
  }

  setStartEnd(start: number, end: number) {
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

  switchSpeakers(position: number, newPos: number) {
    this.switchSpeaker.next([position, newPos]);
  }
}
