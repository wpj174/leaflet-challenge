// Creating our initial map object:
// We set the longitude, latitude, and starting zoom level.
// This gets inserted into the div with an id of "map".
var defaultMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// grayscale layer
var grayscale =  L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

// terrain layer 1
var terrain1 = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 18,
	ext: 'png'
});

// terrain layer 2
var terrain2 = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-background/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 18,
	ext: 'png'
});

// topo layer
var topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// make basemabes object
var basemaps = {
  Topographic: topo,
  Terrain1: terrain1,
  Terrain2: terrain2,
  GrayScale: grayscale,
  Default: defaultMap
};

var myMap = L.map("map", {
  center: [50, -120],
  zoom: 3,
  layers: [defaultMap, grayscale, terrain1, terrain2, topo]
});

// Adding a tile layer (the background map image) to our map:
// We use the addTo() method to add objects to our map.
defaultMap.addTo(myMap);

// tectonic plate data
// variable to hold the tectonic plate layer
var tectonic = new L.layerGroup();

// call api to get tectonic plate data
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
  //console.log(plateData);

  // load date w/ geojson and add to tectonic layer
  L.geoJson(plateData,{
    // add styling to make visible
    color: "brown",
    weight: 1
  }).addTo(tectonic);
});

// add tectonic plate layer to map
tectonic.addTo(myMap);

// variable to hold the earthquakes data
var quakes = new L.layerGroup();

// create the data for the earthquakes and populate the layer group
// call the USGS GeoJSON api
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
.then(
  function(quakeData){
    console.log(quakeData);

    // plot circles where radii are driven by quake magnitude, color by depth

    // function to set color
    function quakeColor(depth){
      if (depth > 90)
        return "red";
      else if (depth > 70)
        return "orangered";
      else if (depth > 50)
        return "orange";
      else if (depth > 30)
        return "#ffbf00";
      else if (depth > 10)
        return "yellow";
      else
        return "chartreuse";
    }

    // functin to set size (radius)
    function quakeSize(mag){
      return ((mag * 5) + 1);
    }

    // add on the styling for each data point
    function quakeStyle(feature){
      return {
        opacity: 1,
        fillOpacity: 0.5,
        fillColor: quakeColor(feature.geometry.coordinates[2]),
        color: "black",
        radius: quakeSize(feature.properties.mag),
        weight: 0.5,
        stroke: true
      }
    }

    // add GeoJSON data to the earthquake layer group
    L.geoJson(quakeData, {
      // make each feature a marker that is on the map; each is a circle
      pointToLayer: function(feature, latLng) {
        return L.circleMarker(latLng);
      },
      // set the style for each marker
      style: quakeStyle, // calls the data style func and passes in earthquake data
      // add popups
      onEachFeature: function(feature, layer){
        layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                        Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                        Location: <b>${feature.properties.place}</b>`);
      }
    }).addTo(quakes);
  }
);

  
// add earthquake layer to the map
quakes.addTo(myMap);


// add the tectonic overlay
var overlays = {
  "Earthquake Data": quakes,
  "Tectonic Plates": tectonic
};

// add the layer control
L.control
  .layers(basemaps, overlays)
  .addTo(myMap);

// add legend to map
var legend = L.control({
  position: "bottomright"
});

// add the properties for the legend
legend.onAdd = function() {
  // div for the legent to appear in
  var div = L.DomUtil.create("div", "info legend");

  // set up the intervals
  var intervals = [-10, 10, 30, 50, 70, 90];
  // set up the colors for the intervals
  var colors = [
    "chartreuse",
    "yellow",
    "#ffbf00",
    "orange",
    "orangered",
    "red"
  ];

  // loop through the intervals and the colors to generate the labels
  // with a colored square for each interval
  for (var i = 0; i < intervals.length; i++)
  {
    // inner html that sets the square for each interval and label
    div.innerHTML += "<i style='background: "
      + colors[i]
      + "'></i> "
      + intervals[i]
      + (intervals[i + 1] ? "km &mdash; " + intervals[i + 1] + "km<br>" : "km +");
  }

  return div;
};

// add legend to the map
legend.addTo(myMap);

