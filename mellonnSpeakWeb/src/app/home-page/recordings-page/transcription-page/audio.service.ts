import { Injectable } from '@angular/core';
import { Storage } from 'aws-amplify';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  player = new Audio();
  playerUrl: string;

  constructor() { }

  setAudioUrl(url: string) {
    this.playerUrl = url;
    this.player.src = url;
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
    const newUrl: string = this.playerUrl + '#t=' + start + ',' + end;
    this.player.src = newUrl;
  }

  play() {
    this.player.play();
  }
}
