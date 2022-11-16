import { Injectable } from '@angular/core';
import { Recording } from 'src/models';

@Injectable({
  providedIn: 'root'
})
export class ConversionService {

  constructor() { }

  getSpkNum(speakerLabel: string): number {
    const split = speakerLabel.split('_');
    return +split[split.length - 1];
  }

  getSpkLabel(speakerLabel: string, recording: Recording): string {
    const num: number = this.getSpkNum(speakerLabel);
    if (recording.labels != null) {
      return recording.labels[num] ?? '';
    } else {
      return 'null';
    }
  }

  getTimeFrame(start_time: number, end_time: number): string {
    return this.getMinSec(start_time) + ' to ' + this.getMinSec(end_time);
  }

  getMinSec(secs: number): string {
    let minDouble: number = secs / 60;
    let minInt: number = Math.floor(minDouble);
    let secDouble: number = secs - (minInt * 60);
    let secInt: number = Math.floor(secDouble);

    let minSec: string = minInt + 'm' +  secInt + 's';
    let sec: string = secInt + 's';

    if (minInt == 0) {
      return sec;
    } else {
      return minSec;
    }
  }
}
