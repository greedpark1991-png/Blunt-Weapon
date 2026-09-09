const MONTH_DAYS=[31,28,31,30,31,30,31,31,30,31,30,31];
const WEEK=['월','화','수','목','금','토','일'];
export class CalendarSystem{
  constructor(data,legacyDay=1){
    if(data?.year){this.year=data.year;this.month=data.month;this.day=data.day;this.weekday=data.weekday??0;}
    else{this.year=1;this.month=1;this.day=1;this.weekday=0;for(let i=1;i<(legacyDay||1);i++)this.advance();}
  }
  advance(){this.day++;this.weekday=(this.weekday+1)%7;const max=MONTH_DAYS[this.month-1];if(this.day>max){this.day=1;this.month++;if(this.month>12){this.month=1;this.year++;}}}
  format(short=false){return short?`${this.month}월 ${this.day}일 ${WEEK[this.weekday]}`:`${this.year}년차 ${this.month}월 ${this.day}일 ${WEEK[this.weekday]}요일`;}
  totalDays(){let y=(this.year-1)*365,d=0;for(let m=1;m<this.month;m++)d+=MONTH_DAYS[m-1];return y+d+this.day;}
  daysUntil(month,day){let y=this.year,m=this.month,d=this.day,count=0;while(count<370){if(m===month&&d===day)return count;d++;count++;if(d>MONTH_DAYS[m-1]){d=1;m++;if(m>12){m=1;y++;}}}return count;}
  toJSON(){return{year:this.year,month:this.month,day:this.day,weekday:this.weekday};}
}
export {MONTH_DAYS,WEEK};
