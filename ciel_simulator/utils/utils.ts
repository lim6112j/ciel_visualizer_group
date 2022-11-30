import { DemandKind } from '../types/types'
import * as d3 from 'd3';
interface Coordinate {
    lat: number,
    lng: number,
    timestamp: string,
    name: string
}
export function getDateMinMax(data: any[], columnName: string) {

    return data.reduce(function (acc, cur) {
        //console.log(cur)
        let curtimestamp = Math.floor(new Date(cur[columnName]).getTime() / 1000);// timeMinMax in seconds

        acc[0] = acc[0] === 0 ? curtimestamp : curtimestamp < acc[0] ? curtimestamp : acc[0];
        acc[1] = acc[1] === 0 ? curtimestamp : curtimestamp > acc[1] ? curtimestamp : acc[1];
        return acc;
    }, [0, 0]);
}
export function demandSetMap(demand: any, demandKind: DemandKind, target: google.maps.Map | null, isShowInfoWindow: boolean) {
    if (demandKind === DemandKind.Picked) {
        demand.pickedMarker.setMap(target)
        if (isShowInfoWindow !== false) {
            target !== null ? demand.infoWindowStart.open({ anchor: demand.pickedMarker, map: target, shouldFocus: false }) : demand.infoWindowStart.close()
        }
    } else if (demandKind === DemandKind.Dropped) {
        demand.droppedMarker.setMap(target)

        if (isShowInfoWindow !== false) {
            target !== null ? demand.infoWindowEnd.open({ anchor: demand.droppedMarker, map: target, shouldFocus: false }) : demand.infoWindowEnd.close()
        }
    } else if (demandKind === DemandKind.Both) {
        const uid: string = `${demand.uid}`
        demand.pickedMarker.setLabel(uid)
        demand.droppedMarker.setLabel(uid)
        demand.pickedMarker.setMap(target)
        demand.droppedMarker.setMap(target)
        if (isShowInfoWindow !== false) {
            target !== null ? demand.infoWindowEnd.open({ anchor: demand.droppedMarker, map: target, shouldFocus: false }) : demand.infoWindowEnd.close()
            target !== null ? demand.infoWindowStart.open({ anchor: demand.pickedMarker, map: target, shouldFocus: false }) : demand.infoWindowStart.close()
        }
    }
    return true // return value for memoize
}

export function getTotalDistance(coordinates: Coordinate[]) {
    coordinates = coordinates.filter((cord) => {
        if (cord.lat && cord.lng) {
            return true;
        }
    });

    let totalDistance = 0;

    if (!coordinates) {
        return '0';
    }

    if (coordinates.length < 2) {
        return '0';
    }

    for (let i = 0; i < coordinates.length - 2; i++) {
        if (
            !coordinates[i].lng ||
            !coordinates[i].lat ||
            !coordinates[i + 1].lng ||
            !coordinates[i + 1].lat
        ) {
            totalDistance = totalDistance;
        }
        totalDistance =
            totalDistance +
            getDistanceBetweenTwoPoints(coordinates[i], coordinates[i + 1]);
    }

    return totalDistance.toFixed(2);
}
function getDistanceBetweenTwoPoints(cord1: Coordinate, cord2: Coordinate) {
    if (cord1.lat == cord2.lat && cord1.lng == cord2.lng) {
        return 0;
    }

    const radlat1 = (Math.PI * cord1.lat) / 180;
    const radlat2 = (Math.PI * cord2.lat) / 180;

    const theta = cord1.lng - cord2.lng;
    const radtheta = (Math.PI * theta) / 180;

    let dist =
        Math.sin(radlat1) * Math.sin(radlat2) +
        Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);

    if (dist > 1) {
        dist = 1;
    }

    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    dist = dist * 1.609344; //convert miles to km

    return dist;
}

export function createTicks(map: google.maps.Map, maxTick: number) {
    var mapDiv = map.getDiv();
    //console.log(mapDiv)
    var datalist = document.createElement('datalist');
    mapDiv.appendChild(datalist);
    datalist.id = 'tickmarks';
    for (let i = 0; i <= 5; i++) {
        let optionDiv = document.createElement('option');
        optionDiv.setAttribute('value', (i * maxTick / 5).toString());
        optionDiv.setAttribute('label', i * maxTick / 5 + "%")
        datalist.appendChild(optionDiv);
    }
}

export class Timer {
    private callback_: (a: any) => void;
    private delay_: number;
    private timerId = 0;
    private callbackStartTime: number = 0;
    private remaining = 0;
    paused = false;
    constructor(callback: (a: boolean) => void, delay: number) {
        this.callback_ = callback;
        this.delay_ = delay;
        this.setTimeout();
    }
    pause() {
        this.clear();
        this.remaining -= Date.now() - this.callbackStartTime;
        window.setTimeout(this.setTimeout.bind(this), this.remaining);
        this.paused = true;
    };
    resume() {
        this.clear();
        window.setTimeout(this.setTimeout.bind(this), this.remaining);
        this.paused = false;
    };
    private setTimeout() {
        this.clear();
        this.timerId = window.setInterval(() => {
            this.callbackStartTime = Date.now();
            this.callback_(this.paused);
        }, this.delay_);
    }
    private clear() {
        window.clearInterval(this.timerId);
    };
}
export function jsonToTuple(jsonobj: { x: string, y: string }): string {
    return "(" + jsonobj.x + "," + jsonobj.y + ")"
}
export function polyClick(lines: any, vlines: any, demands: any, idx: number, data: any, map: google.maps.Map) {
    console.log('busId => ', idx)
    const div = document.getElementById('show-trace')
    const button = document.createElement('button')
    button.innerHTML = 'show trace'
    button.onclick = function () {
        showTrace(lines, idx, data, map)
    }
    if (idx === -1) {
        lines.forEach(function (l) {
            l.forEach(function (d) {
                d.poly.setVisible(true)
            })

        })

        vlines.forEach(function (d) {
            d.poly.setVisible(true)
        })
        demands.forEach(function (d) {
            d.pickedMarker!.setVisible(true)
            d.droppedMarker!.setVisible(true)
        })
        return
    }
    //TODO show trace 기능을 존속할지 살지할지
    //div.appendChild(button)
    lines.forEach(function (l) {
        l.forEach(function (d) {
            if (l[0].idx !== idx) {
                d.poly.setVisible(false)
            } else {
                d.poly.setVisible(true)
            }
        })

    })
    vlines.forEach(function (d) {
        if (d.idx !== idx) {
            d.poly.setVisible(false)
        } else {
            d.poly.setVisible(true)
        }
    })

    demands.forEach(function (d) {
        if (d.supply_idx !== idx) {
            d.pickedMarker.setVisible(false)
            d.droppedMarker.setVisible(false)
        } else {
            d.pickedMarker.setVisible(true)
            d.droppedMarker.setVisible(true)
        }
    })
}

export function showTrace(lines: any, idx: number, data: any, map) {
    let prevTime = 0
    let timestamp = 0
    data.filter((d) => d.supply_idx === idx).sort((a, b) => a.get_date - b.get_date).map(function (supply) {
        timestamp = new Date(supply.get_date).getTime()
        if (timestamp > prevTime + 60000) {
            const marker = new google.maps.Marker({
                position: { lng: supply.loc.x, lat: supply.loc.y },
                title: new Date(timestamp).toLocaleTimeString(),
                opacity: 0.1,
                map
            })
            prevTime = timestamp
        }

    });
}
export function pushPath(path: any, poly: google.maps.Polyline) {
    const tempPath = poly.getPath()
    tempPath.push(path)
    console.log(tempPath)
    return poly
}
export function getPline() {
    let found = false
    let seq: any[] = []
    return function (lines, idx, timestamp) {
        if (seq.length === 0) { // initialize
            lines.forEach(d => seq.push(0))
        }

        if (found === false) {
            const plines = lines[idx]
            for (let j = 0; j < plines.length; j++)
                if (plines[j].timestamp >= timestamp) {
                    found = true
                    seq[idx] = j
                    return seq
                }
        } else {
            const plines = lines[idx]
            if (timestamp >= plines[seq[idx] + 1].timestamp) {
                plines[seq[idx]].poly.setMap(null)
                seq[idx] += 1
            }
            return seq
        }
    }
}
export function randomColorForPoly() {
    let strokeColor = () => '#' + (Math.random() * 0xFFFFFF << 0).toString(16)
    let initialized = false
    let colorPallet: any[] = []
    return (lines) => {
        if (!initialized) {
            let len = lines.length
            for (let i = 0; i < len; i++) {
                const colr = strokeColor()
                const strokeClr = ColorLuminance(colr, 0.3)
                const button = document.getElementById('button' + lines[i][0].idx)
                button!.style.color = 'white'
                button!.style.backgroundColor = strokeClr
                colorPallet.push({ idx: lines[i][0].idx, strokeColor: strokeClr })
            }
        }
        initialized = true
        return colorPallet
    }
}
function ColorLuminance(hex, lum) {
    // validate hex string
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    lum = lum || 0;

    // convert to decimal and change luminosity
    var rgb = "#", c, i;
    for (i = 0; i < 3; i++) {
        c = parseInt(hex.substr(i * 2, 2), 16);
        c = Math.round(Math.min(Math.max(25, c + (c * lum)), 255)).toString(16);
        rgb += ("00" + c).substr(c.length);
    }

    return rgb;
}
export function centerOnPolyIcon(line, map) {
    var markerDistFromStart = parseInt(line.get('icons')[0].offset) * google.maps.geometry.spherical.computeLength(line.getPath()) / 100;
    var heading = google.maps.geometry.spherical.computeHeading(line.getPath().getAt(0), line.getPath().getAt(1))
    var markerLatLng = google.maps.geometry.spherical.computeOffset(line.getPath().getAt(0), markerDistFromStart, heading)
    //map.panTo(markerLatLng)
    map.setCenter(markerLatLng)
}
export function infoWindows(map): ([]) => any[] {

    let initialized = false
    let infoWindows: { idx: number, infoWindow: google.maps.InfoWindow }[] = []

    return (lines: any) => {
        if (!initialized) {
            let len = lines.length
            for (let i = 0; i < len; i++) {
                const infoWindow = new google.maps.InfoWindow({
                    content: `<div id = "contentString"> n/a </div>`,
                })
                infoWindow.open(map)
                infoWindows.push({ idx: lines[i][0].idx, infoWindow })
            }
        }
        initialized = true
        return infoWindows
    }
}
function computelen(paths) {
    console.log('cache not used')
    return google.maps.geometry.spherical.computeLength(paths)
}
const computelenM = memo(computelen)
export function infoOnPolyIcon(line: any, infoWindow: any) {
    const paths = line.getPath()
    var markerDistFromStart = parseInt(line.get('icons')[0].offset) * computelenM(paths) / 100;
    //var markerInfoFromSeq = paths.reduce((acc, cur, idx) => {
    //const pathArr = [
    //new google.maps.LatLng(paths.getAt(idx)),
    //new google.maps.LatLng(paths.getAt(idx + 1))
    //]
    //const tempAccDist = acc.dist - google.maps.geometry.spherical.computeLength(pathArr)
    //acc = tempAccDist < 0 ? acc : { dist: tempAccDist, idx: idx }
    //return acc
    //}, { dist: markerDistFromStart, idx: 0 })
    let acc = { dist: markerDistFromStart, idx: 0 }
    for (let idx = 0; idx < paths.length - 1; idx++) {
        const pathArr = [
            new google.maps.LatLng(paths.getAt(idx)),
            new google.maps.LatLng(paths.getAt(idx + 1))
        ]
        const tempAccDist = acc.dist - google.maps.geometry.spherical.computeLength(pathArr)
        if (tempAccDist < 0) {
            break
        }
        acc = { dist: tempAccDist, idx }
    }
    const markerInfoFromSeq = acc
    var heading = google.maps.geometry.spherical.computeHeading(line.getPath().getAt(markerInfoFromSeq.idx), line.getPath().getAt(markerInfoFromSeq.idx + 1))
    var markerLatLng = google.maps.geometry.spherical.computeOffset(line.getPath().getAt(markerInfoFromSeq.idx), markerInfoFromSeq.dist, heading)
    //map.panTo(markerLatLng)
    infoWindow.setPosition(markerLatLng)
}
export function infoWindowSetup(d: any, Picked: DemandKind, arg2: null): boolean {
    throw new Error('Function not implemented.');
}

// json.stringify error for normalization, specific memoize function for demandSetMap
export function memoize(fn) {
    var cache = {}
    return function (...args) {
        const nullOrMap = args[2] === null ? 'null' : 'map'
        const argsStr = "" + args[0].picked_date + args[1] + nullOrMap
        const cacheReturn = () => {
            //console.log('cache used')
            cache[argsStr]
        }
        const result = (cache[argsStr] =
            typeof cache[argsStr] === 'undefined'
                ? fn(...args)
                : cacheReturn())
        return result
    }
}

function memo(fn) {
    var cache = {}
    return function (...args) {
        const argsStr = JSON.stringify(args)
        const cacheReturn = () => {
            console.log('cache used')
            cache[argsStr]
        }
        const result = (cache[argsStr] =
            typeof cache[argsStr] === 'undefined'
                ? fn(...args)
                : cacheReturn())
        return result
    }
}
interface vehicleStat {

}
export function vehicleDataPrepare(location_log) {
    return location_log.reduce((acc, cur) => {
        const idx = cur.supply_idx
        let accIdx: any[] = acc.filter(d => d.idx === idx)
        if (accIdx.length === 0) {
            accIdx = [{ idx: idx, locs: [], timestamp: [], speed: [] }]
        }
        const locs = [...accIdx[0].locs, cur.loc]
        const timestamp = [...accIdx[0].timestamp, cur.get_date]
        const speed = [...accIdx[0].speed, cur.speed]
        const accNotIdx = acc.filter(d => d.idx !== idx)
        return [...accNotIdx, { idx: idx, locs: locs, timestamp: timestamp, speed: speed }]
    }, [])
}
//accuracy
//:
//0
//device_id
//:
//"01222118074"
//get_date
//:
//"2022-07-20T23:36:03.920Z"
//heading
//:
//0
//input_date
//:
//"2022-07-20T23:36:04.078Z"
//loc
//:
//{x: 0, y: 0}
//speed
//:
//0
//supply_idx
//:
//16
export function vehicleInfoControl(refreshInterval) {
    let timeCount = 0
    return (data: { idx: number, timestamp: any[], speed: any[] }[], baseTime) => {
        // 1000 frame 마다 정보 갱신
        if (timeCount < refreshInterval) {
            timeCount += 1
            return
        }
        const dataFiltered = data.reduce((acc, cur, i) => {
            const foundIdx = cur.timestamp.findIndex((d) => new Date(d).getTime() > baseTime)
            if (foundIdx < 0) return
            const speed = cur.speed[foundIdx]
            const timestamp = cur.timestamp[foundIdx]
            return [...acc, { idx: cur.idx, timestamp: [timestamp], speed: [speed] }]
        }, [])
        d3.select('#data').selectAll('*').remove()
        const listItems = d3
            .select('#data')
            .selectAll('div')
            .data(dataFiltered)
            .enter()
            .append('div')
            .classed('demandSection', true)
            .append('span')
            .style('font-size', '10px')
            .text(d => '차량번호 : ' + d.idx)
            .append('p')
            .text(d => '탑승  : ' + Math.round(Math.random() * 4))
            .append('p')
            .text(d => '평균 실차율  : ' + Math.round(Math.random() * (50 - 30) + 30) + '%')
            .append('p')
            .text(d => '평균 우회시간 :' + Math.round(Math.random() * (12 - 8) + 8) + '(mins)')
            .append('p')
            .text(d => '평균 대기시간 :' + Math.round(Math.random() * (15 - 5) + 5) + '(mins)')
            .append('p')
            .text(d => '평균 속도 :' + Math.round(Math.random() * (50 - 40) + 40) + '(km/h)')
        timeCount = 0
        //.append('p')
        //.text(data => 'end time : ' + data.path[data.path.length - 1].timestamp)
        //.append('p')
        //.text(data => 'total distance : ' + getTotalDistance(data.path) + 'km')
        //.append('p')
        //.text(data => 'average velocity : ' + Math.floor(parseInt(getTotalDistance(data.path)) / (new Date(data.path[data.path.length - 1].timestamp).getTime() - new Date(data.path[0].timestamp).getTime()) * 1000 * 60 * 60) + 'km/h')
    }
}
