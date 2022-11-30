"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demandSetMap = exports.getDateMinMax = void 0;
function getDateMinMax(data, columnName) {
    return data.reduce(function (acc, cur) {
        //console.log(cur)
        var curtimestamp = Math.floor(new Date(cur[columnName]).getTime() / 1000); // timeMinMax in seconds
        acc[0] = acc[0] === 0 ? curtimestamp : curtimestamp < acc[0] ? curtimestamp : acc[0];
        acc[1] = acc[1] === 0 ? curtimestamp : curtimestamp > acc[1] ? curtimestamp : acc[1];
        return acc;
    }, [0, 0]);
}
exports.getDateMinMax = getDateMinMax;
function demandSetMap(demand, target) {
    demand.pickedMarker.setMap(target);
    demand.droppedMarker.setMap(target);
}
exports.demandSetMap = demandSetMap;
