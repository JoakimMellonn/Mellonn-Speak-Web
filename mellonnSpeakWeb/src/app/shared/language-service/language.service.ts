import { Injectable } from '@angular/core';
import { Storage } from 'aws-amplify';
import { parse } from 'node-html-parser';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  languageList: string[] = [];
  languageCodeList: string[] = [];

  constructor() { }

  async getLanguages() {
    try {
      const result = await fetch('https://docs.aws.amazon.com/transcribe/latest/dg/supported-languages.html', {mode: 'no-cors'});
      const text = await result.text();
      const doc = parse(text);

      const tBody = doc.getElementsByTagName('table');
      const tr = tBody[0].getElementsByTagName('tr');

      let i: number = 0;

      while (this.languageCodeList.length == 0 && i < 5) {
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
        i++;
      }
      if (i >= 5) throw 'timeout';
    } catch (err) {
      try {
        const url = await Storage.get('data/languages.json');
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });
        const json = await response.json();
        this.languageList = json.languages;
        this.languageCodeList = json.languageCodes;
      } catch (err) {
        console.log('Error while getting backup language list: ' + err);
      }
    }
  }

  getLanguage(languageCode: string) {
    return this.languageList[this.languageCodeList.indexOf(languageCode)];
  }

  getLanguageCode(language: string) {
    return this.languageCodeList[this.languageList.indexOf(language)];
  }
}
