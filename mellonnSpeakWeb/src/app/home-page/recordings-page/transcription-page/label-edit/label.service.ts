import { Injectable } from '@angular/core';
import { DataStore } from 'aws-amplify';
import { Subject } from 'rxjs';
import { Recording } from 'src/models';
import { AudioService } from '../services/audio.service';
import { SpeakerWithWords } from '../services/transcription-service.service';

@Injectable({
  providedIn: 'root'
})
export class LabelService {
  unsavedLabelList: string[] = [];
  unsavedInterviewerList: string[] = [];
  lastPlayed: number;
  speakerClips: SpeakerClip[];
  currentEnd: number;

  private closeModal = new Subject<number>();
  closeModalCalled = this.closeModal.asObservable();

  private currentlyPlaying = new Subject<number>();
  currentlyPlayingCalled = this.currentlyPlaying.asObservable();

  constructor(private audio: AudioService) { }

  resetLabel() {
    this.unsavedLabelList = [];
    this.unsavedInterviewerList = [];
  }

  async assignLabels(recording: Recording) {
    let saveLabelList: string[] = this.unsavedLabelList;
    let saveInterviewList: string[] = [];

    for (let interviewer of this.unsavedInterviewerList) {
      if (interviewer != '') {
        saveInterviewList.push(interviewer);
      }
    }

    try {
      await DataStore.save(
        Recording.copyOf(recording, updated => {
          updated.labels = saveLabelList;
          updated.interviewers = saveInterviewList;
        })
      );
      this.resetLabel();
      this.closeModal.next(1);
    } catch (e) {
      console.error('Error while updating labels: ' + e);
    }
  }

  getSpeakerClips(speakerWithWords: SpeakerWithWords[], speakerCount: number): SpeakerClip[] {
    let returnClips: SpeakerClip[] = [];

    for (let i = 0; i < speakerCount; i++) {
      const spk = 'spk_' + i;
      let speakerClips: SpeakerClip[] = [];

      for (let sww of speakerWithWords) {
        if (sww.speakerLabel == spk && (sww.endTime - sww.startTime) > 7) {
          speakerClips.push(new SpeakerClip(i, sww.startTime + 2, sww.startTime + 7));
        }
      }

      if (speakerClips.length == 0) {
        for (let sww of speakerWithWords) {
          if (sww.speakerLabel == spk) {
            speakerClips.push(new SpeakerClip(i, sww.startTime, sww.endTime));
          }
        }
      }

      speakerClips.forEach((clip) => {
        returnClips.push(clip);
      });
    }
    return returnClips;
  }

  playAudio(speaker: number) {
    this.currentlyPlaying.next(speaker);

    if (speaker == this.lastPlayed) {
      if (!this.audio.player.paused) {
        this.audio.pause();
        this.currentlyPlaying.next(-1);
      } else {
        this.audio.play();
      }
    } else {
      for (let clip of this.speakerClips) {
        if (clip.speaker == speaker) {
          this.audio.setStartEnd(clip.startTime, clip.endTime);
          this.currentEnd = clip.endTime;
          break;
        }
      }
      this.audio.play();
    }
    this.lastPlayed = speaker;
  }

  shuffleAudio(speaker: number) {
    let shuffleClips: SpeakerClip[] = [];

    for(let clip of this.speakerClips) {
      if (clip.speaker == speaker) {
        shuffleClips.push(clip);
      }
    }

    const chosenClip = shuffleClips[Math.floor(Math.random() * shuffleClips.length - 1)];
    this.audio.setStartEnd(chosenClip.startTime, chosenClip.endTime);
    this.currentEnd = chosenClip.endTime;
    this.audio.play();
    this.currentlyPlaying.next(speaker);
  }

  stopAudio() {
    this.audio.pause();
    this.currentlyPlaying.next(-1);
    this.lastPlayed = -1;
  }
}

export class SpeakerClip {
  speaker: number;
  startTime: number;
  endTime: number;

  constructor(speaker: number, startTime: number, endTime: number) {
    this.speaker = speaker,
    this.startTime = startTime,
    this.endTime = endTime
  }
}