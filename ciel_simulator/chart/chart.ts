import * as d3 from 'd3';
import * as util from '../utils/utils'
const Plot = require('@observablehq/plot');
var DUMMY = [
        {
                count: 0,
                timestamp: 0
        },
];
// chart with data
export const chartWithData = (data, timeMinMax) => {
        let formattedData: object[] = [];
        data.forEach(function (d) {
                //console.log(new Date(d.timestamp * 10000 + timeMinMax[0] * 1000).toLocaleString())
                //const ttime = new Date(d.timestamp * 10000 + timeMinMax[0] * 1000).toLocaleString()
                const ttime = d.timestamp * 10000 + timeMinMax[0] * 1000
                formattedData.push({ time: ttime, value: parseFloat(d.count) })
        });

        var dotplot = Plot.line(formattedData, { y: "value", x: "time" }).plot({ height: 100, width: 500, style: { background: 'black', color: 'orange' }, x: { type: 'time', label: null } })
        dotplot.legend("color")
        return dotplot
};
export const chartWithDataForRender = (data, multiplier, timeMinMax, color) => {
        let formattedData: object[] = [];
        data.forEach(function (d) {
                //console.log(new Date(d.timestamp * 10000 + timeMinMax[0] * 1000).toLocaleString())
                //const ttime = new Date(d.timestamp * 10000 + timeMinMax[0] * 1000).toLocaleString()
                const ttime = d.timestamp * multiplier + timeMinMax[0] * 1000
                formattedData.push({ time: ttime, value: parseFloat(d.count) })
        });

        var dotplot = Plot.line(formattedData, { y: "value", x: "time" }).plot({ height: 100, width: 500, style: { background: 'black', color }, x: { type: 'time', label: null } })
        //dotplot.legend("color")
        return dotplot
};

// chart 1
export const chart1 = (timestampEnd, generated) => d3.json<[string, any]>(generated).then(data => {
        let formattedData: object[] = [];
        data.forEach(function (d) {
                d.path.forEach(function (p) {
                        if (timestampEnd === 0) {
                                formattedData.push({ id: d.busId, time: new Date(p.timestamp).getHours(), y: parseFloat(p.lat), count: parseFloat(p.lng) })
                        }
                })
        });
        //console.log(formattedData)
        var dotplot = Plot.rectY(formattedData, Plot.binX({ y: "count" }, { x: "time", fill: "id" })).plot({ height: 150, width: 500, style: { background: 'black' }, x: { label: null } })
        dotplot.legend("color")
        return dotplot
});

export function paneInfoControl(data: [string, any]) {
        const listItems = d3
                .select('#data')
                .select('ul')
                .selectAll('li')
                .data(data)
                .enter()
                .append('li')
                .append('span')
                .style('font-size', '10px')
                .text(data => 'bus id : ' + data.busId.slice(14,))
                .append('p')
                .text(data => 'length of path : ' + data.path.length)
                .append('p')
                .text(data => 'start time : ' + data.path[0].timestamp)
                .append('p')
                .text(data => 'end time : ' + data.path[data.path.length - 1].timestamp)
                .append('p')
                .text(data => 'total distance : ' + util.getTotalDistance(data.path) + 'km')
                .append('p')
                .text(data => 'average velocity : ' + Math.floor(parseInt(util.getTotalDistance(data.path)) / (new Date(data.path[data.path.length - 1].timestamp).getTime() - new Date(data.path[0].timestamp).getTime()) * 1000 * 60 * 60) + 'km/h')
}

export class ChartControl {
        constructor(
                controlDiv: HTMLElement,
                timeMinMax: any,
                id?: string,
                name?: string
        ) {
                controlDiv.style.clear = "both";
                controlDiv.style.backgroundColor = "black"

                const legendDiv = document.createElement("p")
                legendDiv.innerHTML = name
                controlDiv.appendChild(legendDiv)
                const chart1Div = document.createElement("div");
                controlDiv.appendChild(chart1Div)
                id === undefined ? chart1Div.id = "chart1div" : chart1Div.id = id
                //chart1Div.innerText = "chart1"
                chart1Div.appendChild(chartWithData(DUMMY, timeMinMax))
                // input slider

                const slider: HTMLInputElement = document.createElement('input');
                slider.className = 'slider'
                slider.style.color = 'grey'
                slider.id = "leftSlider";
                slider.name = "leftSlider";
                slider.type = 'range';
                slider.setAttribute('list', 'tickmarks')
                slider.min = '0';
                slider.max = '100';
                slider.value = '0';
                slider.step = '0.1';
                slider.addEventListener('change', function (e) {
                        //@ts-ignore
                        //console.log(e.target.value)

                });
                controlDiv.appendChild(slider)
        }
}

export class RightChartControl {
        constructor(
                controlDiv: HTMLElement,
                generated: any
        ) {
                controlDiv.style.clear = "both";

                const chart2Div = document.createElement("div");
                controlDiv.appendChild(chart2Div)
                chart2Div.id = 'chart2div'
                //chart2Div.innerText = "chart2"
                chart1(0, generated).then(chart => {
                        //console.log("chart => ", chart)
                        chart2Div.appendChild(chart)
                })

        }
}

export class TimelineControl {
        private map_: google.maps.Map;
        private currentTime_: number;
        constructor(
                controlDiv: HTMLElement,
                map: google.maps.Map,
                currentTime: number
        ) {
                this.map_ = map;
                this.currentTime_ = currentTime;
                const BORDER_WIDTH = '1px';
                controlDiv.style.clear = 'both';
                // Set CSS for the control border
                const timelineUI = document.createElement("div");

                timelineUI.id = "timelineUI";
                timelineUI.setAttribute('tagName', 'timelineUI');
                timelineUI.title = "Click to time warp";
                timelineUI.style.backgroundColor = 'black';
                timelineUI.style.borderStyle = 'solid';
                timelineUI.style.borderWidth = BORDER_WIDTH;
                timelineUI.style.borderColor = 'grey';
                timelineUI.style.cursor = 'pointer';
                timelineUI.style.marginBottom = '5px';
                timelineUI.style.padding = '5px';
                controlDiv.appendChild(timelineUI);
                controlDiv.style.padding = '5px';
                const clockUI: HTMLElement = document.createElement('div');
                clockUI.className = "clockUI";
                clockUI.innerHTML = "<b>2022. 9. 7. 12:30</b>";
                clockUI.style.color = "white";
                const slider: HTMLInputElement = document.createElement('input');
                slider.style.width = '500px';
                slider.style.color = 'grey'
                slider.id = "timelineSlider";
                slider.name = "timelineSlider";
                slider.type = 'range';
                slider.setAttribute('list', 'tickmarks')
                slider.min = '0';
                slider.max = '100';
                slider.value = '0';
                slider.step = '0.1';
                slider.addEventListener('change', function (e) {
                        //@ts-ignore
                        console.log(e.target.value)

                });
                timelineUI.appendChild(clockUI);
                timelineUI.appendChild(slider);

        }
}
export class MenuControl {
        private map_: google.maps.Map;
        private center_: google.maps.LatLng;
        constructor(
                controlDiv: HTMLElement,
                map: google.maps.Map,
                center: google.maps.LatLngLiteral,
                simulatorStart: any,
                carsStart,
                demandStart
        ) {
                this.map_ = map;
                // Set the center property upon construction
                this.center_ = new google.maps.LatLng(center);
                const BORDER_WIDTH = '1px';
                controlDiv.style.clear = "both";

                // Set CSS for the control border
                const simulationUI = document.createElement("div");

                simulationUI.id = "simulationUI";
                simulationUI.title = "simulation test";
                simulationUI.style.backgroundColor = 'black';
                simulationUI.style.borderStyle = 'solid';
                simulationUI.style.marginBottom = '3px';
                simulationUI.style.borderWidth = BORDER_WIDTH;
                simulationUI.style.borderColor = 'grey';
                simulationUI.style.cursor = 'pointer';

                controlDiv.appendChild(simulationUI);
                controlDiv.style.padding = '5px';

                // Set CSS for the control interior
                const simulationUIText = document.createElement("div");

                simulationUIText.id = "simulationUIText";
                simulationUIText.innerHTML = "Simulation";
                simulationUIText.style.fontSize = '12px';
                simulationUIText.style.color = 'grey';

                simulationUI.appendChild(simulationUIText);

                // Set CSS for the setCenter control border
                const resetUI = document.createElement("div");

                resetUI.id = "resetUI";
                resetUI.title = "click for reset";
                resetUI.style.backgroundColor = 'black';
                resetUI.style.borderColor = 'grey';
                resetUI.style.marginBottom = '3px';
                resetUI.style.borderStyle = 'solid';
                resetUI.style.borderWidth = BORDER_WIDTH;
                resetUI.style.cursor = 'pointer';

                controlDiv.appendChild(resetUI);

                // Set CSS for the control interior
                const resetUIText = document.createElement("div");

                resetUIText.id = "resetUIText";
                resetUIText.innerHTML = "Reset";
                resetUIText.style.fontSize = '12px';
                resetUIText.style.color = 'grey';
                resetUI.appendChild(resetUIText);



                // Set CSS for the setCenter control border
                const carsUI = document.createElement("div");

                carsUI.id = "carsUI";
                carsUI.title = "Analizing start";
                carsUI.style.backgroundColor = 'black';
                carsUI.style.borderColor = 'grey';
                carsUI.style.marginBottom = '3px';
                carsUI.style.borderStyle = 'solid';
                carsUI.style.borderWidth = BORDER_WIDTH;
                carsUI.style.cursor = 'pointer';

                controlDiv.appendChild(carsUI);

                // Set CSS for the control interior
                const carsText = document.createElement("div");

                carsText.id = "carsText";
                carsText.innerHTML = "Path Test";
                carsText.style.fontSize = '12px';
                carsText.style.paddingInline = '4px';
                carsText.style.color = 'grey';
                carsUI.appendChild(carsText);


                // Set CSS for the setCenter control border
                const demandUI = document.createElement("div");

                demandUI.id = "demandUI";
                demandUI.title = "demand test";
                demandUI.style.backgroundColor = 'black';
                demandUI.style.borderColor = 'grey';
                demandUI.style.borderStyle = 'solid';
                demandUI.style.borderWidth = BORDER_WIDTH;
                demandUI.style.cursor = 'pointer';

                controlDiv.appendChild(demandUI);

                // Set CSS for the control interior
                const demandText = document.createElement("div");

                demandText.id = "demandText";
                demandText.innerHTML = "Demand Test";
                demandText.style.fontSize = '12px';
                demandText.style.color = 'grey';
                demandUI.appendChild(demandText);

                simulationUI.addEventListener("click", () => {
                        simulatorStart()
                });

                resetUI.addEventListener("click", () => {
                        window.location.reload()
                });
                carsUI.addEventListener("click", () => {
                        carsStart()
                });
                demandUI.addEventListener("click", () => {
                        demandStart()
                })
        }
}
