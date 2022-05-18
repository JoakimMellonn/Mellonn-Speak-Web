import { Injectable } from '@angular/core';
import { parse } from 'node-html-parser';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  languageList: string[] = [];
  languageCodeList: string[] = [];

  constructor() { }

  async getLanguages() {
    const result = await fetch('https://docs.aws.amazon.com/transcribe/latest/dg/supported-languages.html');
    const text = await result.text();
    const doc = parse(text);

    const tBody = doc.getElementsByTagName('table');
    const tr = tBody[0].getElementsByTagName('tr');

    for(let row of tr) {
      let language: string;
      const columns = row.getElementsByTagName('td');
      try {
        const a = columns[0].getElementsByTagName('a')[0];
        if (columns[0].text.includes(',')) {
          const variation = columns[0].text.replace(RegExp('[^,A-Za-z0-9]', 'g'), '');
          const temp = variation.split(',');
          language = temp[0] + ' (' + temp[1] + ')';
        } else {
          const temp = a.text.replace(RegExp('[^,A-Za-z0-9]', 'g'), '');
          language = temp;
        }
        this.languageList.push(language);
        this.languageCodeList.push(columns[1].text);
      } catch {
      }
    }
  }
}
