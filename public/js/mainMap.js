//tippecanoe geo_timeseries_masked_original.json -pf -pk -Bg -d9 -D7 -g4 -rg -o t.mbtiles
// how to do it with leaflet -
/*var map = L.map("map-container").setView([51.505, -0.09], 13);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'kjjj11223344.p8g6k9ha',
    accessToken: "pk.eyJ1Ijoia2pqajExMjIzMzQ0IiwiYSI6ImNpbDJqYXZ6czNjdWd2eW0zMTA2aW1tNXUifQ.cPofQqq5jqm6l4zix7k6vw"
}).addTo(map);*/


// Source: http://stackoverflow.com/questions/497790
var dates = {
    convert: function(d) {
        // Converts the date in d to a date-object. The input can be:
        //   a date object: returned without modification
        //  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
        //   a number     : Interpreted as number of milliseconds
        //                  since 1 Jan 1970 (a timestamp) 
        //   a string     : Any format supported by the javascript engine, like
        //                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
        //  an object     : Interpreted as an object with year, month and date
        //                  attributes.  **NOTE** month is 0-11.
        return (
            d.constructor === Date ? d :
            d.constructor === Array ? new Date(d[0], d[1], d[2]) :
            d.constructor === Number ? new Date(d) :
            d.constructor === String ? new Date(d) :
            typeof d === "object" ? new Date(d.year, d.month, d.date) :
            NaN
        );
    },
    compare: function(a, b) {
        // Compare two dates (could be of any type supported by the convert
        // function above) and returns:
        //  -1 : if a < b
        //   0 : if a = b
        //   1 : if a > b
        // NaN : if a or b is an illegal date
        // NOTE: The code inside isFinite does an assignment (=).
        return (
            isFinite(a = this.convert(a).valueOf()) &&
            isFinite(b = this.convert(b).valueOf()) ?
            (a > b) - (a < b) :
            NaN
        );
    },
    inRange: function(d, start, end) {
        // Checks if date in d is between dates in start and end.
        // Returns a boolean or NaN:
        //    true  : if d is between start and end (inclusive)
        //    false : if d is before start or after end
        //    NaN   : if one or more of the dates is illegal.
        // NOTE: The code inside isFinite does an assignment (=).
        return (
            isFinite(d = this.convert(d).valueOf()) &&
            isFinite(start = this.convert(start).valueOf()) &&
            isFinite(end = this.convert(end).valueOf()) ?
            start <= d && d <= end :
            NaN
        );
    }
}

var currentPoint = 1;
var currentArea = null;
var file = "/home/vagrant/code/insar_map_mvc/public/json/geo_timeseries_masked.h5test_chunk_";

// falk's date string is in format yyyymmdd - ex: 20090817 
// take an array of these strings and return an array of date objects
var convertStringsToDateArray = function(date_string_array) {
    var date_array = [];
    for (i = 0; i < date_string_array.length; i++) {
        var year = date_string_array[i].substr(0, 4);
        var month = date_string_array[i].substr(4, 2);
        var day = date_string_array[i].substr(6, 2);
        var date = new Date(year, month, day);
        date_array.push(date);
    }
    return date_array;
}

// find how many days have elapsed in a date object
var getDaysElapsed = function(date) {
    var date2 = new Date(date.getFullYear(), 01, 1);
    var timeDiff = Math.abs(date.getTime() - date2.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
}

// convert date in decimal - for example, 20060131 is Jan 31, 2006
// 31 days have passed so decimal format = [2006 + (31/365)] = 2006.0849
// take an array of date objects and return an array of date decimals
var convertDatesToDecimalArray = function(date_array) {
    var decimals = [];
    for (i = 0; i < date_array.length; i++) {
        decimals.push(date_array[i].getFullYear() + getDaysElapsed(date_array[i]) / 365);
    }
    return decimals;
}

// takes displacements and dates, returns slope and y intercept in array
function calcLinearRegression(displacements, decimal_dates) {
    data = [];
    for (i = 0; i < decimal_dates.length; i++) {
        data.push([decimal_dates[i], displacements[i]]);
    }
    var result = regression('linear', data);
    return result;
}

// takes slope, y-intercept; decimal_dates and chart_data(displacement) must
// start and end around bounds of the sliders
function getRegressionChartData(slope, y, decimal_dates, chart_data) {
    var data = [];
    var first_date = chart_data[0][0];
    var first_reg_displacement = slope * decimal_dates[0] + y;
    var last_date = chart_data[chart_data.length - 1][0];
    var last_reg_displacement = slope * decimal_dates[decimal_dates.length - 1] + y;
    data.push([first_date, first_reg_displacement]);
    data.push([last_date, last_reg_displacement]);
    return data;
}

// returns an array of [date, displacement] objects
function getDisplacementChartData(displacements, dates) {
    var data = [];
    for (i = 0; i < dates.length; i++) {
        var year = parseInt(dates[i].substr(0, 4));
        var month = parseInt(dates[i].substr(4, 2));
        var day = parseInt(dates[i].substr(6, 2));
        data.push([Date.UTC(year, month, day), displacements[i]]);
    }
    return data;
}

function Map(loadJSONFunc) {
    var that = this;
    // my mapbox api key
    mapboxgl.accessToken = "pk.eyJ1Ijoia2pqajExMjIzMzQ0IiwiYSI6ImNpbDJqYXZ6czNjdWd2eW0zMTA2aW1tNXUifQ.cPofQqq5jqm6l4zix7k6vw";
    // the map
    this.map = null;
    this.geoJSONSource = null;
    this.geodata = null;
    this.drawer = null;
    this.geoDataMap = {};
    this.layers_ = [];
    this.drawer = null;
    this.loadJSONFunc = loadJSONFunc;
    this.tileURLID = "kjjj11223344.4avm5zmh";
    this.tileJSON = null;
    this.clickLocationMarker = new mapboxgl.GeoJSONSource();

    this.disableInteractivity = function() {
        that.map.dragPan.disable();
        that.map.scrollZoom.disable();
        that.map.doubleClickZoom.disable();
    };

    this.enableInteractivity = function() {
        that.map.dragPan.enable();
        that.map.scrollZoom.enable();
        that.map.doubleClickZoom.enable();
    };
    this.clickOnAPoint = function(e) {
        var features = that.map.queryRenderedFeatures(e.point, {
            layers: that.layers
        });

        var layerID = "touchLocation";

        if (!features.length) {
            return;
        }

        var feature = features[0];
        console.log(feature);
        var lat = feature.geometry.coordinates[0];
        var long = feature.geometry.coordinates[1];
        var chunk = feature.properties.c;
        var pointNumber = feature.properties.p;
        var title = chunk.toString() + ":" + pointNumber.toString() + ":" + lat.toString() + ":" + long.toString();

        var query = {
            "area": currentArea,
            "title": title
        }

        if (!that.map.getLayer(layerID)) {
            that.clickLocationMarker.setData({
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lat, long]
                    },
                    "properties": {
                        "marker-symbol": "dog-park"
                    }
                }]
            });
            that.map.addSource(layerID, that.clickLocationMarker);

            that.map.addLayer({
                "id": layerID,
                "type": "symbol",
                "source": layerID,
                "layout": {
                    "icon-image": "{marker-symbol}-15",
                }
            });
        } else {
            that.clickLocationMarker.setData({
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lat, long]
                    },
                    "properties": {
                        "marker-symbol": "dog-park"
                    }
                }]
            });
        }

        // load displacements from server, and then show on graph
        loadJSONFunc(query, "point", function(response) {
            var json = JSON.parse(response);

            // put code here, the dates are in dates variable, and points are in
            // falk's dates from json file are in format yyyymmdd - 20090817
            var date_string_array = json.dates;
            var displacement_array = json.displacements;
            var date_array = convertStringsToDateArray(date_string_array);

            // convert dates to decimal format
            var decimal_dates = convertDatesToDecimalArray(date_array);

            // returns array for displacement on chart
            chart_data = getDisplacementChartData(displacement_array, date_string_array);

            // calculate and render a linear regression of those dates and displacements
            var result = calcLinearRegression(displacement_array, decimal_dates);
            var slope = result["equation"][0];
            var y = result["equation"][1];

            // returns array for linear regression on chart
            var regression_data = getRegressionChartData(slope, y, decimal_dates, chart_data);

            // now add the new regression line as a second dataset in the chart
            $(function() {
                $('#chartContainer').highcharts({
                    title: {
                        text: 'Timeseries Displacement Chart'
                    },
                    subtitle: {
                        text: "velocity: " + slope.toString().substr(0, 8) + " m/yr"
                    },
                    navigator: {
                        enabled: true
                    },
                    xAxis: {
                        type: 'datetime',
                        events: { // get dates for slider bounds
                            afterSetExtremes: function(e) {
                                var minDate = e.min;
                                var maxDate = e.max;
                                console.log(Highcharts.dateFormat(null, e.min));

                                // lower limit index of subarray bounded by slider dates
                                // must be >= minDate; upper limit <= maxDate                              
                                var minIndex = 0;
                                var maxIndex = 0;
                                for (i = 0; i < date_array.length; i++) {
                                    if (minIndex != 0) {
                                        var compare = dates.compare(maxDate, date_array[i]);
                                        if (compare == 0 || compare == 1) {
                                            console.log("getting max index");
                                            console.log("date at max index is " + date_array[i]);
                                            maxIndex = i;
                                        }
                                    } else {
                                        var compare = dates.compare(minDate, date_array[i]);
                                        if (compare == 0 || compare == -1) {
                                            console.log("getting min index");
                                            minIndex = i;
                                        }
                                    }
                                }
                                // console.log("max date: " + date_array[maxIndex]);
                                // console.log("max slider: " + Highcharts.dateFormat(null, maxDate));

                                // get slope and y intercept of sub array 
                                var sub_displacements = displacement_array.slice(minIndex, maxIndex + 1);
                                var sub_decimal_dates = decimal_dates.slice(minIndex, maxIndex + 1);
                                var sub_result = calcLinearRegression(sub_displacements, sub_decimal_dates);

                                // get linear regression data for sub array
                                var sub_chart_data = chart_data.slice(minIndex, maxIndex + 1);
                                var sub_slope = sub_result["equation"][0];
                                var sub_y = sub_result["equation"][1];
                                var sub_regression_data = getRegressionChartData(sub_slope, sub_y, sub_decimal_dates, sub_chart_data);
                            
                                console.log("calculated sub array");

                                // remove an existing sub array from chart
                                var chart = $('#chartContainer').highcharts();
                                var seriesLength = chart.series.length;

                                for (var i = seriesLength - 1; i > -1; i--) {
                                    console.log(chart.series[i].name);
                                    if (chart.series[i].name == "Linear Regression") {
                                        chart.series[i].remove();
                                        console.log("removed sub data");
                                        break;
                                    }
                                }

                                var date_range = Highcharts.dateFormat(null, minDate) + " - " + Highcharts.dateFormat(null, maxDate);
                                chart.addSeries({
                                    name: 'Linear Regression',
                                    color: '#808080',
                                    data: sub_regression_data                             
                                });

                                chart.setTitle(null, {
                                    text: "velocity: " + sub_slope.toString().substr(0, 8) + " m/yr"
                                });
                                console.log("finished add Series " + sub_slope.toString());
                            }
                        },
                        dateTimeLabelFormats: {
                            month: '%e. %b',
                            year: '%Y'
                        },
                        title: {
                            text: 'Date'
                        }
                    },
                    yAxis: {
                        title: {
                            text: 'Ground Displacement (m)'
                        },
                        legend: {
                            layout: 'vertical',
                            align: 'left',
                            verticalAlign: 'top',
                            x: 100,
                            y: 70,
                            floating: true,
                            backgroundColor: '#FFFFFF',
                            borderWidth: 1,
                        },
                        plotLines: [{
                            value: 0,
                            width: 1,
                            color: '#808080'
                        }]
                    },
                    tooltip: {
                        headerFormat: '<b>{series.name}</b><br>',
                        pointFormat: '{point.x:%e. %b %Y}: {point.y:.6f} m'
                    },
                    series: [{
                        name: 'Displacement',
                        data: chart_data
                    }, {
                        name: 'Linear Regression',
                        data: regression_data
                    }]
                });
            });

            console.log("rendered: " + slope);
        });
    };

    this.clickOnAnAreaMaker = function(e) {
        var features = that.map.queryRenderedFeatures(e.point, {
            layers: that.layers
        });

        var layerID = "touchLocation";

        if (!features.length) {
            return;
        }

        var feature = features[0];
        console.log(feature);
        var areaName = feature.properties.area;
        // var lat = feature.geometry.coordinates[0];
        // var long = feature.geometry.coordinates[1];
        // var chunk = feature.properties.c;
        // var pointNumber = feature.properties.p;
        // var title = chunk.toString() + ":" + pointNumber.toString() + ":" + lat.toString() + ":" + long.toString();

        // var query = {
        //     "area": currentArea,
        //     "title": title
        // }

        getGEOJSON(areaName);
    };

    this.initLayer = function(data) {
        var layer;
        var layerList = document.getElementById('layerList');

        data['vector_layers'].forEach(function(el) {
            that.layers_.push({
                id: el['id'] + Math.random(),
                source: 'vector_layer_',
                'source-layer': el['id'],
                interactive: true,
                type: 'circle',
                layout: {
                    'visibility': 'visible'
                },
                paint: {
                    'circle-color': {
                        property: 'm',
                        stops: [
                            [-0.02, '#0000FF'], // blue
                            [-0.01, '#00FFFF'], // cyan
                            [0.0, '#01DF01'], // lime green
                            [0.01, '#FFBF00'], // yellow orange
                            [0.02, '#FF0000'] // red orange
                        ]
                    },
                    'circle-radius': {
                        // for an explanation of this array see here:
                        // https://www.mapbox.com/blog/data-driven-styling/
                        stops: [
                            [5, 2],
                            [8, 2],
                            [13, 8],
                            [21, 16],
                            [34, 32]
                        ]
                    }
                }
            });
        });
        var tileset = 'mapbox.streets';
        that.map.setStyle({
            version: 8,
            sprite: "mapbox://sprites/mapbox/streets-v8",
            glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
            sources: {
                "raster-tiles": {
                    "type": "raster",
                    "url": "mapbox://" + tileset,
                    "tileSize": 256
                },
                'vector_layer_': {
                    type: 'vector',
                    tiles: data['tiles'],
                    minzoom: data['minzoom'],
                    maxzoom: data['maxzoom'],
                    bounds: data['bounds']
                }
            },
            layers: that.layers_
        });

        // remove click listener for selecting an area, and add new one for clicking on a point
        that.map.off("click");
        that.map.on('click', that.clickOnAPoint);

        return layer;
    }



    this.addMapToPage = function(containerID) {
        that.map = new mapboxgl.Map({
            container: containerID, // container id
            center: [130.89, 31.89], // starting position
            zoom: 7 // starting zoom
        });

        that.map.on("load", function() {
            loadJSONFunc("", "areas", function(response) {
                var json = JSON.parse(response);

                var areaMarker = new mapboxgl.GeoJSONSource();
                var features = [];

                for (var i = 0; i < json.length; i++) {
                    var curArray = json[i];
                    var subDirectories = curArray[0].split("/");
                    var dirName = subDirectories[subDirectories.length - 1];
                    var dirFullName = curArray[0];
                    var dirSize = curArray[1];
                    var lat = curArray[2];
                    var long = curArray[3];

                    var feature = {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [long, lat]
                        },
                        "properties": {
                            "marker-symbol": "dog-park",
                            "area": dirName
                        }
                    };

                    features.push(feature);
                };

                // add the markers representing the available areas
                areaMarker.setData({
                    "type": "FeatureCollection",
                    "features": features
                });
                var id = "areas";
                that.map.addSource(id, areaMarker);

                that.map.addLayer({
                    "id": id,
                    "type": "symbol",
                    "source": id,
                    "layout": {
                        "icon-image": "{marker-symbol}-15",
                    }
                });
            });
        });

        var tileset = 'mapbox.streets';
        that.layers_.push({
            "id": "simple-tiles",
            "type": "raster",
            "source": "raster-tiles",
            "minzoom": 0,
            "maxzoom": 22
        });
        that.map.setStyle({
            version: 8,
            sprite: "mapbox://sprites/mapbox/streets-v8",
            glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
            sources: {
                "raster-tiles": {
                    "type": "raster",
                    "url": "mapbox://" + tileset,
                    "tileSize": 256
                }
            },
            layers: that.layers_
        });

        that.map.addControl(new mapboxgl.Navigation());

        // disable rotation gesture
        that.map.dragRotate.disable();

        that.map.on('click', that.clickOnAnAreaMaker);

        // Use the same approach as above to indicate that the symbols are clickable
        // by changing the cursor style to 'pointer'.
        that.map.on('mousemove', function(e) {
            var features = that.map.queryRenderedFeatures(e.point, { layers: that.layers });
            that.map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
        });

        // handle zoom changed. we want to change the icon-size in the layer for varying zooms.
        // if you notice, in tremaps, all the points are just one size, as if they were real, physical points.
        // so, when you zoom out, the points appear to be smaller than when you are zoomed in. with the markers
        // we are using, though, the marker icons are always the same size, so we can use that function to
        // dynamically change the sizes depending on the current map zoom.
        that.map.on('zoomend', function() {
            var features = that.map.queryRenderedFeatures(that.map.getBounds());
            console.log(that.map.getZoom());
        });
    }
}


// function to use AJAX to load json from that same website - I looked online and AJAX is basically just used
// to asynchronously load data using javascript from a server, in our case, our local website
function loadJSON(arg, param, callback) {
    var fullQuery = param + "/"

    for (var key in arg) {
        fullQuery += arg[key] + "/"
    }

    console.log(fullQuery);
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', fullQuery, true); // Replace 'my_data' with the path to your file
    xobj.onreadystatechange = function() {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
        }
    };
    xobj.send(null);
}

var myMap = new Map(loadJSON);
myMap.addMapToPage("map-container");
