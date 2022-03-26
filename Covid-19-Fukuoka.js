// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: chart-area;
const dataUrl = "https://ckan.open-governmentdata.org/dataset/412b1e1c-7c05-443e-8c1f-e8dfcff57b91/resource/3e306520-17e0-4684-8b88-bddf748c68bd/download/400009_pref_fukuoka_covid19_newlycases.csv"

const holidaysUrl = "https://raw.githubusercontent.com/holiday-jp/holiday_jp-js/master/lib/holidays.js"

class LineChart {
    // LineChart by https://kevinkub.de/
    constructor(width, height, seriesA, seriesB) {
        this.ctx = new DrawContext();
        this.ctx.size = new Size(width, height);
        this.seriesA = seriesA;
        this.seriesB = seriesB;
    }
    _calculatePath(series, fillPath) {
        let maxValue = Math.max(...series);
        let minValue = Math.min(...series);
        let difference = maxValue - minValue;
        let count = series.length;
        let step = this.ctx.size.width / (count - 1);
        let points = series.map((current, index, all) => {
        let x = step * index;
        let y = this.ctx.size.height - (current - minValue) / difference * this.ctx.size.height;
        return new Point(x, y);
        });
        return this._getSmoothPath(points, fillPath);
    }
    _getSmoothPath(points, fillPath) {
        let path = new Path();
        path.move(new Point(0, this.ctx.size.height));
        path.addLine(points[0]);
        for (let i = 0; i < points.length - 1; i++) {
        let xAvg = (points[i].x + points[i + 1].x) / 2;
        let yAvg = (points[i].y + points[i + 1].y) / 2;
        let avg = new Point(xAvg, yAvg);
        let cp1 = new Point((xAvg + points[i].x) / 2, points[i].y);
        let next = new Point(points[i + 1].x, points[i + 1].y);
        let cp2 = new Point((xAvg + points[i + 1].x) / 2, points[i + 1].y);
        path.addQuadCurve(avg, cp1);
        path.addQuadCurve(next, cp2);
        }
        if (fillPath) {
        path.addLine(new Point(this.ctx.size.width, this.ctx.size.height));
        path.closeSubpath();
        }
        return path;
    }
    configure(fn) {
        let pathA = this._calculatePath(this.seriesA, true);
        let pathB = this._calculatePath(this.seriesB, false);
        if (fn) {
        fn(this.ctx, pathA, pathB);
        } else {
        this.ctx.addPath(pathA);
        this.ctx.fillPath(pathA);
        this.ctx.addPath(pathB);
        this.ctx.fillPath(pathB);
        }
        return this.ctx;
    }
}

function calc(data, nr = 0) {
    ctr = 0
    for (line of data) {
        const components = line.split(",")
        if (nr === ctr) {
            let fmt = new DateFormatter()
            fmt.dateFormat = 'yyyy/MM/dd'
            return {
            cases: parseFloat(components[5]),
            date: fmt.date(components[3]),
            }
        }
        ctr++
    }
    return {
        error: "GKZ unbekannt.",
    }
}

  
let widget = await createWidget()
if (config.runsInWidget) {
  // The script runs inside a widget, so we pass our instance of ListWidget to be shown inside the widget on the Home Screen.
  Script.setWidget(widget)
} else {
  // The script runs inside the app, so we preview the widget.
  widget.presentMedium()
}
// Calling Script.complete() signals to Scriptable that the script have finished running.
// This can speed up the execution, in particular when running the script from Shortcuts or using Siri.
Script.complete()

async function createWidget(){
    let widget = new ListWidget();

    
    let day_month_formatter = new DateFormatter()
    day_month_formatter.dateFormat = "M/d"
    
    const holidaysData = await new Request(holidaysUrl).loadString()
    let fileFM = FileManager.iCloud()
    fileFM.writeString(fileFM.joinPath(fileFM.documentsDirectory(),"holidays.js"), holidaysData)
    let holidaysJS = importModule("holidays.js")
    const holidays = Object.keys(holidaysJS)
 
    const now = new Date()
    const now_df = new DateFormatter()
    now_df.dateFormat = "yyyy/MM/dd HH:mm:ss"
    const nowstr = widget.addText(now_df.string(now))
    nowstr.rightAlignText()
    nowstr.font = Font.lightMonospacedSystemFont(8)
    widget.addSpacer(15)

    
    const titlestr = widget.addText("福岡県 新型コロナウイルス新規感染者数")
    titlestr.centerAlignText()
    titlestr.font = Font.semiboldSystemFont(14)
    
    widget.addSpacer(10)
    
    const infectedStack = widget.addStack()
    infectedStack.layoutHorizontally()
    widget.addSpacer(7)
    const infectedStack2 = widget.addStack()
    infectedStack2.layoutHorizontally()

    const data = await new Request(dataUrl).loadString()
    var data_lines = data.split("\n").reverse()


    data_timeline = []
    for (var i = 1; i < 15; i++) {
        data_timeline.push(calc(data_lines, i))
    }
    
    const check_df = new DateFormatter()
    check_df.dateFormat = "yyyy-MM-dd"


    for (var i = 13; i >= 0; i--) {
        const text_cases = data_timeline[i]["cases"]
        var date_infected;
        if(i / 7 >= 1){
          date_infected = infectedStack.addText(
            day_month_formatter.string(data_timeline[i]["date"]) + "\n" +
            text_cases
          )
          datestr = check_df.string(data_timeline[i]["date"])
          if(holidays.includes(datestr)){
            date_infected.textColor = Color.red()
          }else if(data_timeline[i]["date"].getDay() == 0){
            date_infected.textColor = Color.red()
          }else if(data_timeline[i]["date"].getDay() == 6){
            date_infected.textColor = Color.blue()
          }
        }else {
          date_infected = infectedStack2.addText(
            day_month_formatter.string(data_timeline[i]["date"]) + "\n" +
            text_cases
          )
          datestr = check_df.string(data_timeline[i]["date"])
          if(holidays.includes(datestr)){
            date_infected.textColor = Color.red()
          }else if(data_timeline[i]["date"].getDay() == 0){
            date_infected.textColor = Color.red()
          }else if(data_timeline[i]["date"].getDay() == 6){
            date_infected.textColor = Color.blue()
          }
        }
        date_infected.font = Font.mediumSystemFont(12)
        
        date_infected.centerAlignText()
        if(i % 7 != 0){
          if(i / 7 >= 1){
            infectedStack.addSpacer()
          }else {
            infectedStack2.addSpacer()
          }
        }

    }
    
    
    return widget
}

function getTrendArrow(preValue, currentValue) {
  return (currentValue <= preValue) ? '↓' : '↑'
}

