import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { PromotionDbService } from 'src/app/shared/promotion-db-service/promotion-db.service';
import { Purchase, Referrer } from 'src/models';

@Component({
  selector: 'app-ambassador-page',
  templateUrl: './ambassador-page.component.html',
  styleUrls: ['./ambassador-page.component.scss'],
})
export class AmbassadorPageComponent implements OnInit {
  isLoading: boolean = true;
  referrerName: string = '';
  referrer: Referrer;
  minutesString: string;
  purchases: Purchase[];

  constructor(
    private route: ActivatedRoute,
    private promoDbService: PromotionDbService,
  ) {
    Chart.register(...registerables);
  }

  async ngOnInit() {
    this.referrerName = this.route.snapshot.paramMap.get('referrer') ?? '';
    this.referrer = await this.promoDbService.getReferrer(this.referrerName);
    this.minutesString = Math.round(this.referrer.seconds / 60).toString();
    this.purchases = await this.referrer.Purchases.toArray();
    this.isLoading = false;

    const minutesCanvas = document.getElementById("minutes") as HTMLCanvasElement;
    const purchasesCanvas = document.getElementById("purchases") as HTMLCanvasElement;
    
    new Chart(minutesCanvas, {
      type: 'line',
      data: this.getMinutesLast30Days(this.purchases),
      options: {
        font: {
          family: 'Roboto',
          weight: 'bold'
        },
        scales: {
          x: {
            display: false,
          },
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Transcribed minutes last 30 days'
          },
          legend: {
            display: false
          },
        }
      }
    });

    new Chart(purchasesCanvas, {
      type: 'line',
      data: this.getPurchasesLast30Days(this.purchases),
      options: {
        font: {
          family: 'Roboto',
          weight: 'bold'
        },
        scales: {
          x: {
            display: false
          },
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Purchases last 30 days'
          },
          legend: {
            display: false
          }
        }
      }
    });
  }

  getMinutesLast30Days(purchases: Purchase[]) {
    const last30Days = this.getLast30Days();
    let minutesPerDay: number[] = [];

    for (const date of last30Days) {
      const matchingDate = purchases.filter((purchase) => new Date(purchase.date).getDate() === date.getDate());
      const totalMinutes = matchingDate.reduce((accumulator, purchase) => accumulator += purchase.seconds / 60, 0);
      minutesPerDay.push(Math.round(totalMinutes));
    }

    return {
      labels: last30Days.map((date) => this.formatDateToDay(date)),
      datasets: [{
        label: 'Minutes of Transcription',
        data: minutesPerDay,
        borderColor: '#FF966C',
        backgroundColor: '#FF966C',
        tension: 0.1
      }]
    }
  }

  getPurchasesLast30Days(purchases: Purchase[]) {
    const last30Days = this.getLast30Days();
    let purchasesPerDay: number[] = [];
    
    for (const date of last30Days) {
      const matchingDate = purchases.filter((purchase) => new Date(purchase.date).getDate() === date.getDate());
      purchasesPerDay.push(matchingDate.length);
    }

    return {
      labels: last30Days.map((date) => this.formatDateToDay(date)),
      datasets: [{
        label: 'Total Purchases',
        data: purchasesPerDay,
        borderColor: '#FF966C',
        backgroundColor: '#FF966C',
        tension: 0.1
      }]
    }
  }

  getLast30Days(): Date[] {
    let last30Days: Date[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      last30Days.push(new Date(new Date().setDate(today.getDate() - i)));
    }
    return last30Days;
  }

  formatDateToDay(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }
}