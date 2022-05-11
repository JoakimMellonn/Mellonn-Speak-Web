import { Injectable } from '@angular/core';
import { DataStore } from 'aws-amplify';
import { Subject } from 'rxjs';
import { Recording } from 'src/models';

@Injectable({
  providedIn: 'root'
})
export class LabelService {
  unsavedLabelList: string[] = [];
  unsavedInterviewerList: string[] = [];

  private closeModal = new Subject<number>();
  closeModalCalled = this.closeModal.asObservable();

  constructor() { }

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

    console.log('Saved interviewers: ' + saveInterviewList);

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
}
