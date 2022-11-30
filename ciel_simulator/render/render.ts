import { DemandKind } from '../types/types'
import * as d3 from 'd3';
import * as util from '../utils/utils'
import * as _ from 'lodash'
import { MenuControl, chartWithData, chartWithDataForRender, ChartControl, paneInfoControl, RightChartControl, TimelineControl } from '../chart/chart'
var DUMMY = [
    {
        count: 0,
        timestamp: 0
    },
];
var DUMMY2 = [
    {
        count: 0,
        timestamp: 0
    },
];
var DUMMY3 = [
    {
        count: 0,
        timestamp: 0
    },
];
export function animate(timeMinMax: number[], zoom: number, lines: any[], tcd: HTMLElement, lccd: HTMLElement, rccd: HTMLElement): ((a?: boolean) => void) {
    var count = 0;
    var zoom = zoom;
    const inputSlider = tcd.getElementsByTagName('input')[0]
    const chartSlider = lccd.getElementsByTagName('input')[0]
    console.log(chartSlider)
    const datetimeDiv = tcd.getElementsByTagName('div')[1]
    let prevLeftSliderValue = '0'
    let prevTopSliderValue = '0'
    let changedValue = '0'
    //console.log(datetimeDiv)
    //@ts-ignore
    //console.log(inputSlider.value)

    return (paused = true) => {
        if (paused) {
            changedValue = inputSlider.value !== prevTopSliderValue ? inputSlider.value : chartSlider.value !== prevLeftSliderValue ? chartSlider.value : '0'
            if (changedValue !== '0') {

                //@ts-ignore
                count = parseInt(changedValue)

                d3.select('#chart1div').selectAll("*").remove()
                const char1Div = lccd.getElementsByTagName('div')[0]
                DUMMY = DUMMY[DUMMY.length - 1].timestamp > count ? DUMMY.filter(d => d.timestamp < count) : [...DUMMY, { count: count / 10, timestamp: count }]
                char1Div.appendChild(chartWithData(DUMMY, timeMinMax))
                inputSlider.value = changedValue
                chartSlider.value = changedValue
                prevLeftSliderValue = changedValue
                prevTopSliderValue = changedValue
            }
        } else {
            count = (count + 1);
            inputSlider.value = count.toString();
            chartSlider.value = count.toString();
            d3.select('#chart1div').selectAll("*").remove()
            const char1Div = lccd.getElementsByTagName('div')[0]
            DUMMY = [...DUMMY, { count: count * (Math.random() * (10 - 5) + 5), timestamp: count }]
            char1Div.appendChild(chartWithData(DUMMY, timeMinMax))

            prevLeftSliderValue = changedValue
            prevTopSliderValue = changedValue
            // chart2div
            //d3.select('#chart2div').selectAll("*").remove()
            //const chart2div = rccd.getElementsByTagName('div')[0]
            //chart1(timeMinMax[0] + count).then(chart => chart2div.appendChild(chart))
        }
        let currentDatetime = new Date(count * 10000 + timeMinMax[0] * 1000) // seconds to milliseconds for exact time text

        //@ts-ignore
        datetimeDiv.innerHTML = currentDatetime
        for (let i = 0; i < lines.length; i++) {
            if (currentDatetime.getTime() / 1000 >= lines[i].timestamp[0]) {
                let icons = lines[i].poly.get("icons");
                const modifiedZero = count * 1000 - (lines[i].timestamp[0] - timeMinMax[0]) * 100
                const offset = modifiedZero >= 0 ? modifiedZero : 0;
                icons[0].offset = offset / (lines[i].timestamp[lines[i].timestamp.length - 1] - lines[i].timestamp[0]) + "%";
                lines[i].poly.set("icons", icons);
            }
        }
    }
}

export function render(map: google.maps.Map, zoom: number, lines: any[], vlines: any[], demands: any[], vehicle_stat: any[], duration: number, timeBounds: any[], lccd: HTMLElement, mccd: HTMLElement, rccd: HTMLElement): ((a?: boolean) => void) {
    var SPEED_MULTIPLIER = 50 // 실제 시간의 100배
    const PERCENT_MODIFIER = 100 // OFFSET이 %라서 생기는 보정치
    const COUNT_STEP = 100 // rendering 시 delta time 당 상승량
    const MILISECOND_MODIFIER = 1000
    const RIGHT_PANE_INFO_REFRESH_INTERVAL = 1000// 오른쪽 차량 정보 갱신 간격
    var count = 0;
    var zoom = zoom;
    let strings: string[] = []
    SPEED_MULTIPLIER = parseInt((<HTMLInputElement>document.getElementById('speed')).value)
    const demandDiv = document.getElementById('demand')
    const datetimeDiv = document.getElementById('showtime')
    const chartSlider = lccd.getElementsByTagName('input')[0]
    const chart2Slider = mccd.getElementsByTagName('input')[0]
    const chart3Slider = rccd.getElementsByTagName('input')[0]
    const maxTick = Math.floor((timeBounds[1] - timeBounds[0])) // seconds
    console.log('max tick : ', maxTick)
    console.log('end time : ', new Date(timeBounds[1] * 1000))
    chartSlider.max = (maxTick).toString() // seconds
    chart2Slider.max = (maxTick).toString() // seconds
    chart3Slider.max = (maxTick).toString() // seconds
    console.log('chart slider max', chartSlider.max)
    // chart line color
    const color = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
    const color2 = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
    const color3 = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
    const color4 = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);

    let colorPallete = []
    let infoWindows = []
    var svgMarker = {
        path: "M29.395,0H17.636c-3.117,0-5.643,3.467-5.643,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759 c3.116,0,5.644-2.527,5.644-5.644V6.584C35.037,3.467,32.511,0,29.395,0z M34.05,14.188v11.665l-2.729,0.351v-4.806L34.05,14.188z M32.618,10.773c-1.016,3.9-2.219,8.51-2.219,8.51H16.631l-2.222-8.51C14.41,10.773,23.293,7.755,32.618,10.773z M15.741,21.713 v4.492l-2.73-0.349V14.502L15.741,21.713z M13.011,37.938V27.579l2.73,0.343v8.196L13.011,37.938z M14.568,40.882l2.218-3.336 h13.771l2.219,3.336H14.568z M31.321,35.805v-7.872l2.729-0.355v10.048L31.321,35.805z",
        fillColor: "black",
        fillOpacity: 1,
        strokeWeight: 0.2,
        rotation: 0,
        scale: 1,
        anchor: new google.maps.Point(23, 20), // set value for align center to path
    };
    let changedValue = '0'
    let chartSliderValue = '0'
    let chart2SliderValue = '0'
    let chart3SliderValue = '0'
    let curDemands = []
    let plineFunc = util.getPline()
    let polys = []
    let seq = []
    const colorForPoly = util.randomColorForPoly()
    const vehicleInfoControl = util.vehicleInfoControl(RIGHT_PANE_INFO_REFRESH_INTERVAL)
    const getInfoWindows = util.infoWindows(map)
    const isShowInfoWindow = (<HTMLInputElement>document.getElementById('showInfo')).checked
    let isShowCarInfoWindow = (<HTMLInputElement>document.getElementById('showCarInfo')).checked
    return (paused = false) => {
        if (paused) {
            for (let i = 0; i < lines.length; i++) {
                lines[i][seq[i]].poly.setMap(null)
            }

            plineFunc = util.getPline()
            changedValue = chartSlider.value !== chartSliderValue
                ? chartSlider.value
                : chart2Slider.value !== chart2SliderValue
                    ? chart2Slider.value
                    : chart3Slider.value !== chart3SliderValue
                        ? chart3Slider.value
                        : '0'
            if (changedValue !== '0') {
                const demandSetMapM = util.memoize(util.demandSetMap)
                demands.forEach(function (d) {
                    demandSetMapM(d, DemandKind.Both, null, isShowInfoWindow)
                })
                vlines.forEach(function (d) {
                    d.poly.setMap(null)
                })
                //@ts-ignore
                count = parseInt(changedValue * MILISECOND_MODIFIER / SPEED_MULTIPLIER)

                d3.select('#chart1div').selectAll("*").remove()
                d3.select('#chart2div').selectAll("*").remove()
                d3.select('#chart3div').selectAll("*").remove()
                const char1Div = lccd.getElementsByTagName('div')[0]
                DUMMY = DUMMY[DUMMY.length - 1].timestamp > count ? DUMMY.filter(d => d.timestamp < count) : [...DUMMY, { count: count / 10, timestamp: count }]
                char1Div.appendChild(chartWithData(DUMMY, timeBounds))

                chartSlider.value = changedValue
                chart2Slider.value = changedValue
                chart3Slider.value = changedValue
                chartSliderValue = changedValue
                chart2SliderValue = changedValue
                chart3SliderValue = changedValue
            }
        } else {
            count = (count + COUNT_STEP);
            chartSlider.value = count.toString();
            d3.select('#chart1div').selectAll("*").remove()
            const char1Div = lccd.getElementsByTagName('div')[0]
            DUMMY = [...DUMMY, { count: count * (Math.random() * (10 - 5) + 5), timestamp: count }]
            char1Div.appendChild(chartWithData(DUMMY, timeBounds))

            chartSliderValue = changedValue
            chart2SliderValue = changedValue
            chart3SliderValue = changedValue

        }
        //let polys = []
        const baseTimeValue = count * SPEED_MULTIPLIER + timeBounds[0] * MILISECOND_MODIFIER
        const currentDatetime = new Date(baseTimeValue) // seconds to milliseconds for exact time text
        datetimeDiv.innerHTML = "<b>" + currentDatetime + "</b>"
        chartSlider.value = (count * SPEED_MULTIPLIER / MILISECOND_MODIFIER).toString(); // seconds
        chart2Slider.value = (count * SPEED_MULTIPLIER / MILISECOND_MODIFIER).toString(); // seconds
        chart3Slider.value = (count * SPEED_MULTIPLIER / MILISECOND_MODIFIER).toString(); // seconds
        d3.select('#chart1Div').selectAll("*").remove()
        d3.select('#chart2Div').selectAll("*").remove()
        d3.select('#chart3Div').selectAll("*").remove()
        //left

        const chartDiv = lccd.getElementsByTagName('div')[0]
        DUMMY = [...DUMMY, { count: 100 * (Math.random() * (10 - 5) + 5), timestamp: count }]
        chartDiv.appendChild(chartWithDataForRender(DUMMY, SPEED_MULTIPLIER, timeBounds, color))
        // middle
        const chart2Div = mccd.getElementsByTagName('div')[0]
        DUMMY2 = [...DUMMY2, { count: count * (Math.random() * (10 - 5) + 5), timestamp: count }]
        chart2Div.appendChild(chartWithDataForRender(DUMMY2, SPEED_MULTIPLIER, timeBounds, color2))
        // right
        const chart3Div = rccd.getElementsByTagName('div')[0]
        DUMMY3 = [...DUMMY3, { count: - count * (Math.random() * (10 - 5) + 5), timestamp: count }]
        chart3Div.appendChild(chartWithDataForRender(DUMMY3, SPEED_MULTIPLIER, timeBounds, color3))

        // memoize for drawing marker, infowindow smoothly
        const demandSetMapM = util.memoize(util.demandSetMap)
        for (let i = 0; i < lines.length; i++) {
            //select pline from lines[i]
            seq = plineFunc(lines, i, baseTimeValue)
            colorPallete = colorForPoly(lines)
            infoWindows = getInfoWindows(lines)
            if (baseTimeValue >= lines[i][seq[i]].timestamp) {
                //console.log("bus start : idx ", i, " at time : ", currentDatetime)
                var icons = lines[i][seq[i]].poly.get("icons");

                // select current time polyline in line object line.timestamp[i], line.path[i], line.timestamp[i+1], line.path[i+1]
                // timestamp, path should aggregate in x minutes group for speed.
                const offset = (baseTimeValue - lines[i][seq[i]].timestamp) * PERCENT_MODIFIER;
                icons[0].offset = offset / (lines[i][seq[i] + 1].timestamp - lines[i][seq[i]].timestamp) + "%";
                colorPallete.forEach(function (d) {
                    if (d.idx == lines[i][0].idx) {
                        icons[0].icon = { ...svgMarker, fillColor: d.strokeColor }
                    }
                })
                if (isShowCarInfoWindow) {
                    infoWindows.forEach(function (d) {
                        if (d.idx === lines[i][0].idx) {
                            d.infoWindow.setContent(`<div id="contentString">${lines[i][0].idx} </div>`)
                            util.infoOnPolyIcon(lines[i][seq[i]].poly, d.infoWindow)
                        }
                    })
                }
                //TODO camera follow car disabled
                //if (i === 1) {
                //util.centerOnPolyIcon(lines[i][seq[i]].poly, map)
                //}
                //

                lines[i][seq[i]].poly.set("icons", icons);
                lines[i][seq[i]].poly.setMap(map)
            }
        }

        // waypoints
        for (let i = 0; i < vlines.length; i++) {
            if (vlines[i].timestamp < baseTimeValue) {
                polys.forEach(function (d) {
                    d.poly.setMap(null)
                })
                //polys = []
                const filtered = polys.filter(el => el.idx !== vlines[i].idx)
                polys = [...filtered, { idx: vlines[i].idx, poly: vlines[i].poly }]
                for (let i = 0; i < polys.length; i++) {
                    colorPallete.forEach(function (d) {
                        if (d.idx == polys[i].idx) {
                            polys[i].poly.setOptions({ strokeColor: d.strokeColor })
                        }
                    })
                }
            }
        }
        polys.forEach(function (d) {
            d.poly.setMap(map)
        })

        for (let i = 0; i < demands.length; i++) {
            if (demands[i].request_date < baseTimeValue && demands[i].dropped_date != null) {
                curDemands = []
                strings.length < 10 || strings.pop()
                const date = new Date(demands[i].picked_date)
                const dropped = new Date(demands[i].dropped_date)
                const requested = new Date(demands[i].request_date)
                const infoWindowStart = demands[i].infoWindowStart
                const infoWindowEnd = demands[i].infoWindowEnd

                // rightpane demand info show
                //const dateStr =
                //date.getFullYear() +
                //"/" + (date.getMonth() + 1) +
                //"/" + date.getDate() +
                //" " + date.getHours() +
                //":" + date.getMinutes() +
                //":" + date.getSeconds()
                //strings = ['<div class="demandSection"><p><span> User ID : ' + demands[i].label + '</span></p> <p> requested at : ' + dateStr + '</p> <p> state : ' + demands[i].state + '</p></div><br>', ...strings]
                //demandDiv.innerHTML = strings.toString().replace(/,/g, '<br>')
                paused || curDemands.push({ uid: demands[i].label, infoWindowStart, infoWindowEnd, request_date: requested, picked_date: date.getTime(), dropped_date: dropped, pickedMarker: demands[i].pickedMarker, droppedMarker: demands[i].droppedMarker })
            }
            curDemands.forEach(function (d) {
                if (d.request_date < baseTimeValue && d.picked_date > baseTimeValue) {
                    demandSetMapM(d, DemandKind.Both, map, isShowInfoWindow)
                }
                d.dropped_date >= baseTimeValue || demandSetMapM(d, DemandKind.Dropped, null, isShowInfoWindow)

                d.picked_date >= baseTimeValue || demandSetMapM(d, DemandKind.Picked, null, isShowInfoWindow)


            })
        }
        // insert vehicle statistics
        vehicleInfoControl(vehicle_stat, baseTimeValue)
    }
}
