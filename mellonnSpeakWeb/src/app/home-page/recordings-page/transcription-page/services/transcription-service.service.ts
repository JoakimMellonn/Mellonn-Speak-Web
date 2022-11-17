import { Injectable } from '@angular/core';
import Amplify, { DataStore, Storage } from 'aws-amplify';
import { Recording, Version } from 'src/models';
import { Transcription, Segment, Item } from '../transcription';

@Injectable({
  providedIn: 'root'
})
export class TranscriptionService {
  currentMode: 'default' | 'guide' = 'default';
  recording: Recording;
  transcription: Transcription;
  sww: SpeakerWithWords[];

  constructor() { }

  setTranscription(t: Transcription) {
    this.transcription = t;
    this.sww = this.processTranscription(t);
  }

  setCurrentMode(value: 'default' | 'guide') {
    this.currentMode = value;
  }

  async getRecording(id: string): Promise<Recording | 'null'> {
    try {
      const recording = await DataStore.query(Recording, id);
      if (typeof recording === "undefined") {
        return 'null';
      } else {
        return recording;
      }
    } catch (err) {
      console.error('Error getting recording: ' + err);
      return 'null';
    }
  }

  async getTranscription(id: string) {
    const fileKey: string = 'finishedJobs/' + id + '.json';

    try {
      const url = await Storage.get(fileKey);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error! status: ${response.status}`);
      }

      const result = await response.json();
      const returnTranscription: Transcription = result;

      return returnTranscription;
    } catch (err) {
      console.error('Error downloading file with key: ' + fileKey + ', error: ' + err);
      return 'null';
    }
  }

  async saveTranscription(transcription: Transcription, id: string) {
    const fileKey: string = 'finishedJobs/' + id + '.json';

    try {
      const result = await Storage.put(fileKey, transcription);
      return result;
    } catch (err) {
      console.error('Error uploading file with key: ' + fileKey + ', error: ' + err);
      return 'null';
    }
  }

  processTranscription(transcription: Transcription): SpeakerWithWords[] {
    const spkSegments: SpeakerSegment[] = this.getSpeakerLabels(transcription.results.speaker_labels.segments);
    const wList: PronouncedWord[] = this.getWords(transcription.results.items);
    const swCombined: SpeakerWithWords[] = this.combineWordsWithSpeaker(spkSegments, wList);
    return swCombined;
  }

  getSpeakerLabels(slSegments: Segment[]): SpeakerSegment[] {
    let sInterval: SpeakerSegment[] = [];
    let currentSpeaker: string = '';
    let currentStartTime: number = 0.0;
    let currentIndex: number = 0;

    for (const segment of slSegments) {
      if (segment.speaker_label == currentSpeaker) {
        sInterval[currentIndex] = new SpeakerSegment(
          currentStartTime,
          currentSpeaker,
          +segment.end_time,
        );
        currentSpeaker = segment.speaker_label;
      } else if (segment.speaker_label != currentSpeaker) {
        currentStartTime = +segment.start_time
        currentIndex = sInterval.length;
        currentSpeaker = segment.speaker_label;
        sInterval.push(
          new SpeakerSegment(
            +segment.start_time,
            segment.speaker_label,
            +segment.end_time,
          ),
        );
      }
    }
    return sInterval;
  }

  getWords(items: Item[]) {
    let wList: PronouncedWord[] = [];

    for (const item of items) {

      if (item.type == 'pronunciation') {
        let word: string = '';
        let confidence: number = 0.0;
        //Running through every "alternative"
        for (const alternative of item.alternatives) {
          word = alternative.content;
          confidence = +alternative.confidence;
          wList.push(
            new PronouncedWord(
              +item.start_time,
              word,
              +item.end_time,
              confidence,
            )
          );
        }
      } else {
        const lastStartTime: number = wList[wList.length - 1].startTime;
        const lastEndTime: number = wList[wList.length - 1].endTime;
        for (const alternative of item.alternatives) {
          const punctuation: string = alternative.content;
          wList.push(
            new PronouncedWord(
              lastEndTime,
              punctuation,
              lastEndTime + 0.01,
              100,
            )
          );
        }
      }
    }
    return wList;
  }

  combineWordsWithSpeaker (spInterval: SpeakerSegment[], wList: PronouncedWord[]): SpeakerWithWords[] {
    let swCombined: SpeakerWithWords[] = [];
    
    for (const speakerSegment of spInterval) {
      let _words: string[] = [];
      let _joinableWords: string[] = [];
      
      for (const pronouncedWord of wList) {
        if (pronouncedWord.startTime >= speakerSegment.startTime && pronouncedWord.endTime <= speakerSegment.endTime) {
          _words.push(pronouncedWord.word);
        }
      }
      
      for (const word of _words) {
        if (word == ',' || word == '.' || word == '?' || word == '!') {
          _joinableWords.push(word);
        } else {
          _joinableWords.push(' ' + word);
        }
      }

      let joinedWords = _joinableWords.join('');

      while (joinedWords.charAt(0) == ' ') {
        joinedWords = joinedWords.replace(' ', '');
      }
      
      if (joinedWords.length > 0) {
        swCombined.push(
          new SpeakerWithWords(
            speakerSegment.startTime,
            speakerSegment.speakerLabel,
            speakerSegment.endTime,
            joinedWords,
          ),
        );
      }
    }
    return swCombined;
  }

  async deleteTranscription(recording: Recording) {
    //first we remove all versions
    try {
      const versions: Version[] = await DataStore.query(Version, version => version.recordingID("eq", recording.id));
  
      for (let version of versions) {
        try {
          const versionKey = 'versions/' + recording.id + '/' + version.id + '.json';
          await Storage.remove(versionKey, {level: 'private'});
          await DataStore.delete(version);
        } catch (e) {
          console.error('Error while deleting versions: ' + e);
        }
      }
      const originalKey = 'versions/' + recording.id + '/original.json';
      await Storage.remove(originalKey, {level: 'private'});
    } catch (e) {
      console.error('Error while deleting original version: ' + e);
    }
  
    //now we remove the audio and the transcription
    try {
      const transcriptKey = 'finishedJobs/' + recording.id + '.json';
      await Storage.remove(transcriptKey);
      await Storage.remove(recording.fileKey!, {level: 'private'});
      await DataStore.delete(recording);
    } catch (e) {
      console.error('Error while deleting recording: ' + e);
    }
  }
}

export class SpeakerSegment {
  startTime: number;
  speakerLabel: string;
  endTime: number;

  constructor(startTime: number, speakerLabel: string, endTime: number) {
    this.startTime = startTime;
    this.speakerLabel = speakerLabel;
    this.endTime = endTime;
  }
}

export class PronouncedWord {
  startTime: number;
  word: string;
  endTime: number;
  confidence: number;

  constructor(startTime: number, word: string, endTime: number, confidence: number) {
    this.startTime = startTime;
    this.word = word;
    this.endTime = endTime;
    this.confidence = confidence;
  }
}

export class SpeakerWithWords {
  startTime: number;
  speakerLabel: string;
  endTime: number;
  pronouncedWords: string;

  constructor(startTime: number, speakerLabel: string, endTime: number, pronouncedWords: string) {
    this.startTime = startTime;
    this.speakerLabel = speakerLabel;
    this.endTime = endTime;
    this.pronouncedWords = pronouncedWords;
  }
}

export class Speaker {
  label: string;
  number: number;

  constructor(label: string, number: number) {
    this.label = label;
    this.number = number;
  }
}