import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { Subject } from 'rxjs';
import { SpeakerWithWords } from 'src/app/home-page/recordings-page/transcription-page/services/transcription-service.service';
import { Item, Item2, Segment, Transcription } from '../../home-page/recordings-page/transcription-page/transcription';

@Injectable({
  providedIn: 'root'
})
export class SpeakerEditService {

  private speakerEditReload = new Subject<Transcription>();
  speakerEditReloadCalled = this.speakerEditReload.asObservable();

  constructor() { }

  getNewSpeakerLabels(oldTranscription: Transcription, startTime: number, endTime: number, speaker: number): Transcription {
    //Creating the variables...
    let newTranscription: Transcription = oldTranscription;
    let speakerLabels: Segment[] = newTranscription.results.speaker_labels.segments;

    newTranscription.results.speaker_labels.segments = this.getNewSLList(
      speakerLabels,
      startTime,
      endTime,
      speaker,
    );
    const sws = this.getSpeakerSwitches(newTranscription);
    return newTranscription;
  }

  getNewSLList(oldList: Segment[], startTime: number, endTime: number, speaker: number): Segment[] {
    //Creating the variables
    let speakerLabel = 'spk_' + speaker;
    let newList: Segment[] = [];
    let index: number = 0;
    let newSegmentItems: Item2[] = [];
    let newSegment: Segment = {start_time: '', speaker_label: '', end_time: '', items: []};
    let firstSegment: Segment = {start_time: '', speaker_label: '', end_time: '', items: []};
    let lastSegment: Segment = {start_time: '', speaker_label: '', end_time: '', items: []};
    let newDone: boolean = false;
    let multipleBeforeFirst: boolean = false;

    let lastInList: Segment = oldList[oldList.length - 1];
    let firstInList: Segment = oldList[0];

    if (+lastInList.end_time < endTime) {
      endTime = +lastInList.end_time;
    }

    if (+firstInList.start_time > startTime) {
      startTime = +firstInList.start_time;
      if (+firstInList.start_time > endTime) {
        startTime -= 0.01;
        endTime = +firstInList.start_time;
      }
    }

    ///
    ///Going through all segments to check where the new speaker assigning takes place.
    ///
    for (let segment of oldList) {
      let segmentStart: number = +segment.start_time;
      let segmentEnd: number = +segment.end_time;
      let hasBeenThrough: boolean = false;
      let beforeFirst: boolean = false;
      let firstChanged: boolean = false;
      let newChanged: boolean = false;
      let lastChanged: boolean = false;

      if (index == 0 && startTime < segmentStart || multipleBeforeFirst && startTime <= segmentStart) beforeFirst = true;

      if (segmentStart <= startTime && startTime <= segmentEnd && endTime >= segmentEnd || beforeFirst && endTime > segmentStart) {
        ///
        ///Case 1:
        ///When the speaker assigning startTime is inside the current segment.
        ///Or if it's before the first one.
        ///
        let firstItems: Item2[] = this.goThroughSegmentItems(segment.speaker_label, segmentStart, startTime, segment.items);
        if (firstItems.length > 0) {
          firstSegment = {
            start_time: segment.start_time,
            speaker_label: segment.speaker_label,
            end_time: (startTime - 0.01).toString(),
            items: firstItems,
          };
          firstChanged = true;
        }

        if (multipleBeforeFirst) {
          multipleBeforeFirst = false;
        }

        ///Going through every item in the list and adds them to the new list.
        let newItemsList: Item2[] = this.goThroughSegmentItems(speakerLabel, startTime, endTime, segment.items);
        for(let element of newItemsList) {
          newSegmentItems.push(element);
        }

        if (endTime <= segmentEnd) {
          newDone = true;
        }

        newChanged = true;
        newSegment.start_time = startTime.toString();
        newSegment.speaker_label = speakerLabel;
        newSegment.end_time = endTime.toString();
        hasBeenThrough = true;
      } else if (segmentStart <= endTime && endTime <= segmentEnd && !hasBeenThrough) {
        ///
        ///Case 2:
        ///When the speaker assigning endTime is inside the current segment
        ///
        let lastItems: Item2[] = this.goThroughSegmentItems(segment.speaker_label, endTime, segmentEnd, segment.items);
        if (lastItems.length > 0) {
          lastSegment = {
            start_time: (endTime + 0.01).toString(),
            speaker_label: segment.speaker_label,
            end_time: segment.end_time,
            items: lastItems,
          };
          lastChanged = true;
        }

        ///Going through every item in the list and adds them to the new list
        let newItemsList: Item2[] = this.goThroughSegmentItems(speakerLabel, startTime, endTime, segment.items);

        newItemsList.forEach((element) => {
          newSegmentItems.push(element);
        });
        newChanged = true;
        newDone = true;

        newSegment.start_time = startTime.toString();
        newSegment.speaker_label = speakerLabel;
        newSegment.end_time = endTime.toString();
        hasBeenThrough = true;
      } else if (segmentStart >= startTime && endTime >= segmentEnd && !hasBeenThrough) {
        ///
        ///Case 3:
        ///When the speaker assigning startTime is going through the current segment
        ///So when the startTime is before and endTime is after
        ///

        ///Changing all the speakerLabels and adding them to the list
        segment.items.forEach((item) => {
          item.speaker_label = speakerLabel;
          newSegmentItems.push(item);
        });

        hasBeenThrough = true;
        newChanged = true;
      } else if (startTime >= segmentStart && endTime <= segmentEnd || beforeFirst && endTime <= segmentStart) {
        ///
        ///Case 4:
        ///When it's all in the segment
        ///
        let firstItems: Item2[] = this.goThroughSegmentItems(segment.speaker_label, segmentStart, startTime, segment.items);
        if (firstItems.length > 0) {
          firstSegment = {
            start_time: segment.start_time,
            speaker_label: segment.speaker_label,
            end_time: (startTime - 0.01).toString(),
            items: firstItems,
          };
          firstChanged = true;
        }

        let lastItems: Item2[] = this.goThroughSegmentItems(segment.speaker_label, endTime, segmentEnd, segment.items);
        if (lastItems.length > 0) {
          lastSegment = {
            start_time: endTime.toString(),
            speaker_label: segment.speaker_label,
            end_time: segment.end_time,
            items: lastItems,
          };
          lastChanged = true;
        }

        ///Going through every item in the list and adds them to the new list.
        let newItemsList: Item2[] = this.goThroughSegmentItems(speakerLabel, startTime, endTime, segment.items);
        newItemsList.forEach((element) => {
          newSegmentItems.push(element);
        });

        if (beforeFirst) {
          multipleBeforeFirst = true;
        }

        newChanged = true;
        newDone = true;
        newSegment.start_time = startTime.toString();
        newSegment.speaker_label = speakerLabel;
        newSegment.end_time = endTime.toString();
        hasBeenThrough = true;
      } else {
        ///
        ///Case 5:
        ///When it's not in the segment
        ///
      }

      if (firstChanged) {
        newList.push(firstSegment);
      }
      if (newChanged && newDone) {
        newSegment.items = newSegmentItems;
        newList.push(newSegment);
      }
      if (lastChanged) {
        newList.push(lastSegment);
      }
      if (newChanged && !newDone) {}
      if (!firstChanged && !newChanged && !lastChanged) {
        newList.push(segment);
      }
      index++;
    }
    return newList;
  }

  goThroughSegmentItems(speakerLabel: string, startTime: number, endTime: number, items: Item2[]): Item2[] {
    let newList: Item2[] = [];

    for (let item of items) {
      let itemStart: number = +item.start_time;
      let itemEnd: number = +item.end_time;

      if (itemStart >= startTime && itemEnd <= endTime) {
        let newItem: Item2 = {
          start_time: item.start_time,
          speaker_label: speakerLabel,
          end_time: item.end_time,
        };
        newList.push(newItem);
      }
    }
    return newList;
  }

  getSpeakerSwitches(transcription: Transcription): SpeakerSwitch[] {
    let speakerLabels: Segment[] = transcription.results.speaker_labels.segments;
    let speakerSwitchList: SpeakerSwitch[] = [];
    let lastSpeaker: number = 0;
    let lastEnd: number;
    let speakerSwitch: SpeakerSwitch = new SpeakerSwitch(0, 0, 0);

    for (let segment of speakerLabels) {
      let currentSpeaker: number = +segment.speaker_label.split('_')[1];
      let startTime: number = +segment.start_time;
      let endTime: number = +segment.end_time;

      if (currentSpeaker == lastSpeaker) {
        lastSpeaker = currentSpeaker;
        lastEnd = endTime
      } else {
        speakerSwitchList.push(speakerSwitch);
        speakerSwitch = new SpeakerSwitch(
          startTime,
          endTime,
          currentSpeaker,
        );
        lastSpeaker = currentSpeaker;
      }
    }
    return speakerSwitchList;
  }

  getStartEndFromSelection(sww: SpeakerWithWords, transcription: Transcription, selectStart: number, selectEnd: number): number[] {
    const allItems = transcription.results.items;
    let wordCharList: WordCharacters[] = [];
    let startEntered: boolean = false;
    let lastEnd: number = 0;

    for (let item of allItems) {
      if (+item.start_time >= sww.startTime && +item.end_time <= sww.endTime) {
        startEntered = true;
        wordCharList.push(new WordCharacters(
          +item.start_time,
          +item.end_time,
          item.alternatives[0].content.split(''),
          item.type
        ));
        lastEnd = +item.end_time;
      } else if (startEntered) {
        wordCharList.push(new WordCharacters(
          lastEnd + 0.01,
          lastEnd + 0.02,
          item.alternatives[0].content.split(''),
          item.type
        ));
      }
      if (+item.start_time > sww.endTime) break;
    }

    let currentPlace: number = 0;
    let startChosen: boolean = false;
    let startIndex: number;
    let endIndex: number;
    let i: number = 0;

    for (let word of wordCharList) {
      if (word.type == 'pronunciation') {
        currentPlace += word.characters.length + 1;
      } else {
        currentPlace += word.characters.length;
      }
      if (!startChosen && selectStart + 1 <= currentPlace) {
        startIndex = i;
        startChosen = true;
      }
      if (startChosen && selectEnd <= currentPlace) {
        endIndex = i;
        break;
      }
      i++;
    }
    return [wordCharList[startIndex!].startTime, wordCharList[endIndex!].endTime];
  }

  reloadTranscription(transcription: Transcription) {
    this.speakerEditReload.next(transcription);
  }
}

export class SpeakerSwitch {
  start: number;
  end: number;
  speaker: number;

  constructor(start: number, end: number, speaker: number) {
    this.start = start,
    this.end = end,
    this.speaker = speaker
  }
}

export class WordCharacters {
  startTime: number;
  endTime: number;
  characters: string[];
  type: string;

  constructor(startTime: number, endTime: number, characters: string[], type: string) {
    this.startTime = startTime,
    this.endTime = endTime,
    this.characters = characters,
    this.type = type
  }
}