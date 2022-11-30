import { Loader } from '@googlemaps/js-api-loader';
import { interval } from 'rxjs'
import * as _ from 'lodash'
import * as d3 from 'd3';
import * as util from './utils/utils'
import { MenuControl, chartWithData, ChartControl, paneInfoControl, RightChartControl, TimelineControl } from './chart/chart'
import { createTicks, Timer } from './utils/utils';
import { animate, render } from './render/render'
const IW_MAX_WIDTH = 60
const ZOOM = 7;
const APIKEY = process.env.GMAPIKEY;
const POLY_PATH_LENGTH = 10; // 차량 이동 정확도 , 낮을 수록 정확도 상승, 부하 증가
const apiOptions = {
    "apiKey": APIKEY,
    "version": "beta"
};
const MAPID = process.env.GMMAPID;
const mapOptions = {
    center: { lat: 37.408441988224936, lng: 127.57328066514565 },
    zoom: ZOOM,
    tilt: 45,
    mapId: MAPID,
    disableDefaultUI: true,
}
var generated = require('./datastore/generated.json');
//var simul_log = require('./datastore/waypoints.json')
//var demand_log = require('./datastore/demand.json')
//var location_log = require('./datastore/location.json')
var simul_log
var demand_log
var location_log
//let apiUrl = "http://125.176.69.32:1234"
let apiUrl = "http://localhost:1234"
var map: google.maps.Map;
var timeMinMax = [0, 0];
(async () => {
    appStart()
})();
async function appStart() {

    map = await initMap();
    // center control
    mapOptions.center = { lat: 36.409, lng: 126.9725 }
    //initWebGLOverlayView(map);
    //demandStart()

    const runFile = document.getElementById("runFile")
    runFile.addEventListener('change', function () {

        //@ts-ignore
        const file = runFile.files[0]
        if (file.name.match(/\.(txt|json)$/)) {
            var reader = new FileReader();

            reader.onload = function () {
                //@ts-ignore
                location_log = JSON.parse(reader.result)
            };

            reader.readAsText(file);
        } else {
            alert("File not supported, .txt or .json files only");
        }
    })
    const simulFile = document.getElementById("simulFile")
    simulFile.addEventListener('change', function () {
        //@ts-ignore
        const file = simulFile.files[0]
        if (file.name.match(/\.(txt|json)$/)) {
            var reader = new FileReader();

            reader.onload = function () {
                //@ts-ignore
                simul_log = JSON.parse(reader.result)
            };

            reader.readAsText(file);
        } else {
            alert("File not supported, .txt or .json files only");
        }
    })
    const demandFile = document.getElementById("demandFile")
    demandFile.addEventListener('change', function () {
        //@ts-ignore
        const file = demandFile.files[0]
        if (file.name.match(/\.(txt|json)$/)) {
            var reader = new FileReader();

            reader.onload = function () {
                //@ts-ignore
                demand_log = JSON.parse(reader.result)
            };

            reader.readAsText(file);
        } else {
            alert("File not supported, .txt or .json files only");
        }
    })
    // chart div width setting
    const mapWidth = document.getElementById('map').offsetWidth
    const floating_panel = document.getElementById('floating-panel')
    floating_panel.style.width = mapWidth + "px"
    floating_panel.style.transform = `translateX(-${mapWidth / 2}px)`
    const speedInput = <HTMLInputElement>document.getElementById('speed')
    const carsStartDiv = document.getElementById('carsStart')
    const planningDivd = document.getElementById('planning')
    const demoDiv = document.getElementById('demo')
    const resetDiv = document.getElementById('reset')
    carsStartDiv.addEventListener('click', function () {
        carsStart()
    })
    planningDivd.addEventListener('click', function () {
        //window.open('/planning', '_self')
        simulatorStart()
    })
    demoDiv.addEventListener('click', function () {
        window.open('/planning', '_self')
    })
    resetDiv.addEventListener('click', function () {
        window.location.reload()
    })
    speedInput.addEventListener('input', function () {
        document.getElementById('speedLabel').innerText = speedInput.value
    })
    //carsStart()
}
async function initMap(): Promise<any> {
    const mapDiv = document.getElementById("map");
    const apiLoader = new Loader(apiOptions);
    await apiLoader.load();
    return new google.maps.Map(mapDiv, mapOptions);
}


function simulatorStart() {

    // timeline slider control
    const timelineControlDiv = document.createElement('div');
    const timelineControl = new TimelineControl(timelineControlDiv, map, 0);
    const leftChartControlDiv = document.createElement('div')
    leftChartControlDiv.style.display = "flex"
    leftChartControlDiv.style.flexDirection = "column"
    leftChartControlDiv.style.justifyContent = "center"
    leftChartControlDiv.style.marginBottom = "20"
    const chartControlleft = new ChartControl(leftChartControlDiv, timeMinMax)
    const rightChartControlDiv = document.createElement('div')
    rightChartControlDiv.style.display = "flex"
    rightChartControlDiv.style.flexDirection = "row"
    rightChartControlDiv.style.justifyContent = "center"
    rightChartControlDiv.style.marginBottom = "20"
    rightChartControlDiv.style.marginRight = "-200"
    const chartControlright = new RightChartControl(rightChartControlDiv, generated)
    //@ts-ignore
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(timelineControlDiv);
    map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(leftChartControlDiv)
    map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(rightChartControlDiv)
    document.getElementById('floating-panel').style.visibility = 'hidden'
    simulator(map, timelineControlDiv, leftChartControlDiv, rightChartControlDiv);

}
async function setRoutes(map: google.maps.Map) {

    var svgMarker = {
        path: "M29.395,0H17.636c-3.117,0-5.643,3.467-5.643,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759 c3.116,0,5.644-2.527,5.644-5.644V6.584C35.037,3.467,32.511,0,29.395,0z M34.05,14.188v11.665l-2.729,0.351v-4.806L34.05,14.188z M32.618,10.773c-1.016,3.9-2.219,8.51-2.219,8.51H16.631l-2.222-8.51C14.41,10.773,23.293,7.755,32.618,10.773z M15.741,21.713 v4.492l-2.73-0.349V14.502L15.741,21.713z M13.011,37.938V27.579l2.73,0.343v8.196L13.011,37.938z M14.568,40.882l2.218-3.336 h13.771l2.219,3.336H14.568z M31.321,35.805v-7.872l2.729-0.355v10.048L31.321,35.805z",
        fillColor: "black",
        fillOpacity: 1,
        strokeWeight: 0.2,
        rotation: 0,
        scale: 0.5,
        anchor: new google.maps.Point(23, 20), // set value for align center to path
    };
    var lineSymbol = { ...svgMarker, fillColor: '#777777' };
    const lines = [];
    var tMM = await d3.json<[string, any]>(generated).then(data => {
        for (let i = 0; i < data.length; i++) {
            let line = {
                timestamp: [], poly: new google.maps.Polyline({
                    path: [],
                    icons: [
                        {
                            icon: lineSymbol,
                            offset: "100%"
                        },
                    ],
                    map: map,
                    strokeColor: 'red',
                    strokeWeight: 2,
                    strokeOpacity: 1

                })
            };
            // ascending sort with timestamp
            data[i].path.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            timeMinMax = util.getDateMinMax(data[i].path, "timestamp")
            for (let j = 0; j < data[i].path.length; j++) {
                let patharr = data[i].path[j];
                line.timestamp.push(Math.floor(new Date(patharr.timestamp).getTime() / 1000)); // line timestamp in seconds
                line.poly.getPath().push(new google.maps.LatLng(data[i].path[j].lat, data[i].path[j].lng));
            }
            line.poly.addListener('click', function () {
                //infoWindow.setContent(contentString);
                //infoWindow.open(map, line.getPath());
                //let color = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
                //line.setOptions({ strokeColor: color })
                console.log('busId => ', data[i].busId)
                lines.forEach(function (l) {
                    if (l !== line) {
                        l.poly.setVisible(!l.poly.getVisible())
                    }
                })
            });
            lines.push(line);
        }
        paneInfoControl(data)
        return timeMinMax;
    }
    );
    return { tMM, lines };
}
async function simulator(map: google.maps.Map, tcd: HTMLElement, lccd: HTMLElement, rccd: HTMLElement) {
    const { tMM, lines } = await setRoutes(map);
    const fps = 50;
    const maxTick = Math.floor((tMM[1] - tMM[0])) // seconds
    const inputSlider = tcd.getElementsByTagName('input')[0]
    const chartSlider = lccd.getElementsByTagName('input')[0]
    //@ts-ignore
    inputSlider.max = (maxTick / 10).toString(); // 10times fast time flows
    chartSlider.max = (maxTick / 10).toString(); // 10times fast time flows
    console.log('maxTick => ', maxTick, ' seconds')
    console.log('min time', new Date(tMM[0] * 1000))
    console.log('max time', new Date(tMM[1] * 1000))
    createTicks(map, maxTick);
    // geumho
    const timer = new util.Timer(animate(timeMinMax, map.getZoom(), lines, tcd, lccd, rccd), 1000 / fps);
    const timers = [timer];
    map.addListener('click', () => {
        for (let i = 0; i < timers.length; i++) {
            if (timers[i].paused) { timers[i].resume(); }
            else { timers[i].pause(); }
        }
    });

};
async function carsStart() {
    document.getElementById('showtime')!.style.visibility = 'visible';
    const loader = document.getElementById('overlay')
    loader.style.display = 'block'
    if (!(typeof simul_log === 'object' || location_log === 'object' || demand_log === 'object')) {
        const query = (<HTMLInputElement>document.getElementById('queryStr')).value
        const simul_url = apiUrl + "/simulation/" + query
        const location_url = apiUrl + "/location/" + query
        const demand_url = apiUrl + "/demand/" + query
        let simuls = await fetch(simul_url)
            .then(res => res.json())
            .catch(err => { throw err })
        demand_log = await fetch(demand_url)
            .then(res => res.json())
            .catch(err => { throw err })
        location_log = await fetch(location_url)
            .then(res => res.json())
            .catch(err => { throw err })
        let prevSeq = 0
        console.log(demand_log)
        simul_log = simuls.reduce(function (acc, d) {
            if (d.waypoint_seq === 0) {
                acc.push(d)
                prevSeq = 0
                return acc
            }
            if (d.waypoint_seq === prevSeq + 1) {
                const links = [...acc[acc.length - 1].path.links, ...d.path.links]
                const duration = acc[acc.length - 1].path.duration + d.path.duration
                const length = acc[acc.length - 1].path.length + d.path.length

                const combined = { ...acc[acc.length - 1], path: { links, duration, length } }
                acc.pop()
                acc.push(combined)
                prevSeq += 1
            }
            return acc
        }, [])
        const queryResultDiv = document.getElementById('queryResult')
        queryResultDiv.innerText = "demands : " + demand_log.length + " , locations : " + location_log.length +
            " , simulations: " + simul_log.length
        if (demand_log.length === 0 || location_log.length === 0 || simul_log.length === 0) {
            alert('data malformed');
            loader.style.display = 'none'
            return;
        }
    }

    loader.style.display = 'none'
    // define svg symbol with path data from svg file.
    let pathArr = []
    let locationArr = []
    let duration: number
    let waypointLoc: number[]
    let waypointName: string = "hello"
    let bounds = new google.maps.LatLngBounds
    let timeBounds = []
    let demands: { supply_idx: number, infoWindowStart: google.maps.InfoWindow, infoWindowEnd: google.maps.InfoWindow, pickedMarker: google.maps.Marker, droppedMarker: google.maps.Marker, idx: number, title: string, label: string, state: number, lng: number, lat: number, request_date: number, picked_date: number, dropped_date: number }[] = []
    if (typeof simul_log !== 'object') {
        alert("needed simulation log")
        return
    }

    if (typeof demand_log !== 'object') {
        alert("needed simulation log")
        return
    }
    console.log(location_log)
    const vehicle_statistics = util.vehicleDataPrepare(location_log)
    console.log(vehicle_statistics)
    timeBounds = util.getDateMinMax(location_log, "get_date")
    const demandData = demand_log.forEach(function (d) {
        const supply_idx = d.supply_idx
        let locs, lng, lat
        if (d.picked_date === null || d.dropped_date === null) return;
        d.pickup_loc.x === undefined ? locs = _(d.pickup_loc).replace(/[()]/g, '').split(",") : locs = [d.pickup_loc.x, d.pickup_loc.y]
        lng = parseFloat(locs[0])
        lat = parseFloat(locs[1])
        lng === 0.0 || bounds.extend({ lng, lat })
        let request_date = new Date(d.request_date).getTime()
        let picked_date = new Date(d.picked_date).getTime()
        let dropped_date = new Date(d.dropped_date).getTime()
        const scaledSize = 50
        const labelPosition = new google.maps.Point(25, 18)
        let icon = {
            url: "dist/assets/marker-blue.png",
            scaledSize: new google.maps.Size(scaledSize, scaledSize), // scaled size
            labelOrigin: labelPosition
        };
        const pickedMarker = new google.maps.Marker({
            position: { lng, lat },
            title: "user : " + d.user_idx,
            label: d.user_idx,
            animation: google.maps.Animation.DROP,
            icon
        })

        d.dropoff_loc.x === undefined ? locs = _(d.dropoff_loc).replace(/[()]/g, '').split(",") : locs = [d.dropoff_loc.x, d.dropoff_loc.y]
        if (locs.length === 0) return;
        lng = parseFloat(locs[0])
        lat = parseFloat(locs[1])
        icon = {
            url: "dist/assets/marker-red.png",
            scaledSize: new google.maps.Size(scaledSize, scaledSize), // scaled size
            labelOrigin: labelPosition
        };
        const droppedMarker = new google.maps.Marker({
            position: { lng, lat },
            title: "user : " + d.user_idx,
            label: d.user_idx,
            animation: google.maps.Animation.DROP,
            icon
        })
        const contentStringStart = `<div id="contentString"> pick<hr>${d.user_idx} </div>`
        const contentStringEnd = `<div id="contentString"> drop<hr>${d.user_idx}</div>`
        const infoWindowStart = new google.maps.InfoWindow({
            content: contentStringStart,
            ariaLabel: d.user_idx.toString(),
            maxWidth: IW_MAX_WIDTH
        })
        const infoWindowEnd = new google.maps.InfoWindow({
            content: contentStringEnd,
            ariaLabel: d.user_idx.toString(),
            maxWidth: IW_MAX_WIDTH
        })
        demands[demands.length] = { supply_idx, infoWindowStart, infoWindowEnd, pickedMarker, droppedMarker, idx: demands.length, title: d.pickup_poi, label: d.user_idx.toString(), state: d.state, lng, lat, request_date, picked_date, dropped_date }
        return demands
    })
    console.log(simul_log)
    const res = simul_log.forEach(function (data) {
        const paths = []
        const startTime = new Date(data.get_date).getTime()
        duration = data.path.duration
        const numOfWaypoints = data.path.links.length
        const totalDistance = data.path.dist
        waypointName = data.waypoint_name
        let waypointLocStr: string = data.waypoint_loc
        //data.waypoint_loc.x === undefined
        //? waypointLoc = waypointLocStr.replace(/[()]/g, '').split(',').map(d => parseFloat(d))
        //
        //: waypointLoc = [data.waypoint_loc.x, data.waypoint_loc.y]

        data.path.links.forEach(function (link) {
            paths.push(...link.lnglats)
            link.lnglats.forEach(function (d) {
                bounds.extend(d)
            })
        })
        pathArr.push({ idx: data.supply_idx, paths, duration, waypointLoc, waypointName, startTime })
    });
    const latlngs = pathArr
    if (typeof location_log !== 'object') {
        alert("needed location log")
        return
    }
    let paths: { locVal: { lng: number, lat: number }[], timestamp: number[] } = { locVal: [], timestamp: [] }
    var svgMarker = {
        path: "M29.395,0H17.636c-3.117,0-5.643,3.467-5.643,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759 c3.116,0,5.644-2.527,5.644-5.644V6.584C35.037,3.467,32.511,0,29.395,0z M34.05,14.188v11.665l-2.729,0.351v-4.806L34.05,14.188z M32.618,10.773c-1.016,3.9-2.219,8.51-2.219,8.51H16.631l-2.222-8.51C14.41,10.773,23.293,7.755,32.618,10.773z M15.741,21.713 v4.492l-2.73-0.349V14.502L15.741,21.713z M13.011,37.938V27.579l2.73,0.343v8.196L13.011,37.938z M14.568,40.882l2.218-3.336 h13.771l2.219,3.336H14.568z M31.321,35.805v-7.872l2.729-0.355v10.048L31.321,35.805z",
        fillColor: "black",
        fillOpacity: 1,
        strokeWeight: 0.2,
        rotation: 0,
        scale: 0.5,
        anchor: new google.maps.Point(23, 20), // set value for align center to path
    };
    const lineSymbol = { ...svgMarker, fillColor: "black" }
    let lines = []
    let vlines: { timestamp: number, poly: google.maps.Polyline }[] = []

    const vehicle_button_div = document.getElementById('vehicle-buttons')

    const showAllCarsButton = document.createElement('button')
    showAllCarsButton.innerHTML = "all"
    showAllCarsButton.onclick = function () {
        util.polyClick(lines, vlines, demands, -1, location_log, map)
    }
    vehicle_button_div.appendChild(showAllCarsButton)
    const supply_idxs = location_log.reduce(function (acc, cur) {
        if (!acc.includes(cur.supply_idx)) {
            acc.push(cur.supply_idx)
            const button = document.createElement('button')
            button.innerHTML = cur.supply_idx
            button.id = "button" + cur.supply_idx
            button.onclick = function () {
                util.polyClick(lines, vlines, demands, cur.supply_idx, location_log, map);
            }
            vehicle_button_div.appendChild(button)
        }
        return acc
    }, [])

    location_log = location_log.sort(function (a, b) {
        new Date(a.get_date).getTime() - new Date(b.get_date).getTime()
    })
    supply_idxs.forEach(function (idx) {

        paths = { locVal: [], timestamp: [] }
        location_log.forEach(function (data) {
            let locs, lng, lat
            if (data.supply_idx === idx) {
                data.loc.x === undefined
                    ? locs = _(data.loc).replace(/[()]/g, '').split(',')
                    : locs = [data.loc.x, data.loc.y]
                lng = parseFloat(locs[0])
                lat = parseFloat(locs[1])
                let timestamp = new Date(data.get_date).getTime()
                lng === 0.0 || paths.locVal.push({ lng, lat })
                lng === 0.0 || paths.timestamp.push(timestamp)
            }
        })
        //@ts-ignore
        const supply_log = paths.locVal
        //@ts-ignore
        const timestamp = paths.timestamp
        //console.log('timestamp', timestamp)

        let color = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
        let line;
        let poly_paths = []
        const plines = []
        for (let i = 0; i < supply_log.length; i++) {
            if (i % POLY_PATH_LENGTH !== POLY_PATH_LENGTH - 1) {
                poly_paths.push(supply_log[i])
                continue
            }
            poly_paths.push(supply_log[i])
            const p_line = {
                idx,
                timestamp: timestamp[i - POLY_PATH_LENGTH + 1],
                paths: poly_paths,
                poly: new google.maps.Polyline({
                    path: poly_paths,
                    icons: [
                        {
                            icon: lineSymbol,
                            offset: "100%",
                        },
                    ],
                    strokeColor: color,
                    strokeOpacity: 0.0,
                    strokeWeight: 2,
                })
            };
            plines.push(p_line)
            poly_paths = []
        }

        //line.poly.addListener('click', function () {
        ////infoWindow.setContent(contentString);
        ////infoWindow.open(map, line.getPath());
        ////let color = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
        ////line.setOptions({ strokeColor: color })
        //console.log('busId => ', idx)
        //lines.forEach(function (l) {
        //if (l !== line) {
        //l.poly.setVisible(!l.poly.getVisible())
        //}
        //})
        //});
        lines.push(plines)

    })
    map.fitBounds(bounds, 100)

    latlngs.forEach(function (d) {
        var line = {
            timestamp: d.startTime,
            idx: d.idx,
            poly: new google.maps.Polyline({
                path: d.paths,
                strokeColor: '#0096ff',
                strokeOpacity: 1,

            })
        };
        //timer = new Timer(render(15, lines, duration, map), 20)
        let infoWindow = new google.maps.InfoWindow({
            content: '<div id = "contentString"> Click the map to get Lat/Lng!</div>',
            position: line.poly.getPath().getAt(0)
        })
        //infoWindow.open(map)
        //map.addListener('click', (ev: google.maps.PolyMouseEvent) => {
        //timer.paused ? timer.resume() : timer.pause()
        //infoWindow.close()
        //infoWindow = new google.maps.InfoWindow({
        //position: ev.latLng,
        //})
        //const content = JSON.stringify(ev.latLng.toJSON())
        //const contentString = `<div id="contentString">` + content + `</div>`
        //infoWindow.setContent(contentString)
        //infoWindow.open(map)
        //})
        //waypointMarker.addListener('click', function (ev: google.maps.PolyMouseEvent) {
        //infoWindow.close()
        //infoWindow = new google.maps.InfoWindow({
        //position: ev.latLng,
        //})
        //const contentString = `<div id="contentString">` + d.waypointName + `</div>`
        //infoWindow.setContent(contentString)
        //infoWindow.open(map)
        //
        //})
        vlines.push(line)

    });
    const leftChartDiv = document.getElementById('left-chart')
    new ChartControl(leftChartDiv, timeMinMax, "chart1Div", '실차율')
    const middleChartDiv = document.getElementById('middle-chart')
    new ChartControl(middleChartDiv, timeMinMax, "chart2Div", "대기시간")
    const rightChartDiv = document.getElementById('right-chart')
    new ChartControl(rightChartDiv, timeMinMax, "chart3Div", '우회시간')
    const timer = new util.Timer(render(map, 15, lines, vlines, demands, vehicle_statistics, duration, timeBounds, leftChartDiv, middleChartDiv, rightChartDiv), 20)

    const chartSlider = leftChartDiv.getElementsByTagName('input')[0]
    const chart2Slider = middleChartDiv.getElementsByTagName('input')[0]
    const chart3Slider = rightChartDiv.getElementsByTagName('input')[0]
    chartSlider.addEventListener('mousedown', () => {
        timer.pause();
    })
    chart2Slider.addEventListener('mousedown', () => {
        timer.pause();
    })
    chart3Slider.addEventListener('mousedown', () => {
        timer.pause();
    })
    chartSlider.addEventListener('mouseup', () => {
        timer.resume();
    })
    chart2Slider.addEventListener('mouseup', () => {
        timer.resume();
    })
    chart3Slider.addEventListener('mouseup', () => {
        timer.resume();
    })
    map.addListener('click', (ev: google.maps.PolyMouseEvent) => {
        map.setZoom(15)
        map.setCenter(ev.latLng)
    })
    //const pauseDiv = document.getElementById('pausing')
    //let str = timer.paused ? 'RESUMED' : 'PAUSED'
    //pauseDiv.innerHTML = "<b>" + str + "</b>"
    //timer.paused ? timer.resume() : timer.pause()
}
async function demandStart() {
    let timeBounds: number[]
    let bounds = new google.maps.LatLngBounds
    let markerData: { idx: number, title: string, label: string, lng: number, lat: number, dlng: number, dlat: number, pdate: string, ddate: string }[] = []
    let markers: google.maps.Marker[] = []
    let infoWindow = new google.maps.InfoWindow({
        content: '<div id = "contentString"> Click the map to get Lat/Lng!</div>',
    })
    const query = (<HTMLInputElement>document.getElementById('queryStr')).value
    const demand_url = apiUrl + "/demand/" + query
    demand_log = await fetch(demand_url)
        .then(res => res.json())
        .catch(err => { throw err })

    timeBounds = util.getDateMinMax(demand_log, "request_date")

    demand_log.forEach(function (d) {
        d.pickup_loc.x === 0.0 || bounds.extend({ lng: d.pickup_loc.x, lat: d.pickup_loc.y })
        const picked_date = new Date(d.picked_date).toString()
        const dropped_date = new Date(d.dropped_date).toString()
        markerData[markerData.length] = { idx: markerData.length, title: d.pickup_poi, label: d.user_idx.toString(), lng: d.pickup_loc.x, lat: d.pickup_loc.y, dlng: d.dropoff_loc.x, dlat: d.dropoff_loc.y, pdate: picked_date, ddate: dropped_date }
    })
    const demandData = markerData
    console.log(markerData)
    const source = interval(1000)
    const subscribe = source.subscribe(val => {
        for (let i = 0; i < val; i++) {
            demandData[i].label !== demandData[val].label || markers[i].setMap(null)
        }
        const waypointMarker = new google.maps.Marker({
            position: { lng: demandData[val].lng, lat: demandData[val].lat },
            map,
            title: demandData[val].title,
            label: demandData[val].label
        })

        waypointMarker.addListener('click', function (ev) {
            infoWindow.close()
            infoWindow = new google.maps.InfoWindow({
                position: ev.latLng,
            })
            const contentString = `<div id="contentString">` + demandData[val].label + `<br>` + demandData[val].title + `</div>`
            infoWindow.setContent(contentString)
            infoWindow.open(map)

        })
        map.addListener('click', () => {
            infoWindow.close()
        })

        markers.push(waypointMarker)

        val !== demandData.length - 1 || subscribe.unsubscribe()
    })
    map.fitBounds(bounds, 100)
}
function planningStart() {
    throw new Error('Function not implemented.');
}

function demoStart() {
    throw new Error('Function not implemented.');
}
