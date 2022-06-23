import { Pipe, PipeTransform } from '@angular/core';
import { Promotion } from 'src/app/shared/promotion-service/promotion.service';

@Pipe({
  name: 'searchPromo'
})
export class SearchPromoPipe implements PipeTransform {

  transform(items: Promotion[], filter: string): any {
    if (!items || !filter) {
        return items;
    }
    // filter items array, items which match and return true will be
    // kept, false will be filtered out
    return items.filter(item => item.code.indexOf(filter) !== -1 || item.type.indexOf(filter) !== -1);
  }

}
