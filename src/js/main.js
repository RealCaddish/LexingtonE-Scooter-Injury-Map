// set options for the map object
const options = {
  zoomSnap: 0.1,
  center: [38.04696, -84.507469],
  zoom: 11,
  minZoom: 2,
  maxZoom: 17,
};

// creating the map object
const map = L.map("map", options);

// load in data with d3 fetch
// const blocksDataRaw = d3.json(
//   'data/geojson/blocks_census_airbnb_joined.geojson'
// );
// const listingsDataRaw = d3.csv('data/csv/listings_cleaned.csv');
// const listingsGeojson = d3.json('data/geojson/listings_cleaned.geojson');

// const visiblePoints = L.featureGroup().addTo(map);
// const hiddenPoints = L.featureGroup();

const collisionCountRoads = d3.json("../data/geojson/roads_counts.geojson");
const bicycle_points = d3.json("../data/shp/all_bicycle_collisions.geojson");
const scooter_points = d3.json("../data/geojson/scooter_collisions.geojson");
const all_points = d3.json("../data/shp/all_collision_points.geojson")
// promise statement to call an array of data variables then proceed to mapping function
Promise.all([collisionCountRoads, bicycle_points, scooter_points, all_points]).then(
  drawMap
);

// set global variables for map layer
// mapped attribute, and normalizing attribute
// let attributeValue = 'airbnbs';
// let normValue = 'total_unit_sum';

// start of drawing Map function
function drawMap(data) {
  // display Carto basemap tiles with light features and labels
  const tiles = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png'
  }
  );

  // add basemap tiles to map
  tiles.addTo(map);

  // add data after Promise
  const collisionRoadsGeoJSON = data[0];
  const collisionBicyclesGeoJSON = data[1];
  const collisionScootersGeoJSON = data[2];
  const allCollisionsGeoJSON = data[3];

  // bicycle accident circle options
  var bikeMarkerOptions = {
    radius: 5,
    fillColor: "blue",
    color: "black",
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.3,
  };

  // scooter accident circle options
  var scooterMarkerOptions = {
    radius: 5,
    fillColor: "yellow",
    color: "black",
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.3,
  };

   // scooter accident circle options
   var allCircleOptions = {
    radius: 5,
    fillColor: "grey",
    color: "black",
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.8,
  };


  var collisionLineOptions = {
    color: 'grey',
    weight: '1.5',
    opacity: '.1',
    fillOpacity: '.3'
  };

  // color function for road choropleth 
  function getColor(d) {
    return d > 9 ? '#f2f0f7':
           d > 6 ? '#dadaeb':
           d > 5 ? '#bcbddc':
           d > 4 ? '#9e9ac8':
           d > 3 ? '#807dba':
           d > 2 ? '#6a51a3':
           d > 1  ? '#4a1486':
                      '#f7f7f7';
  }; 

  // define function for GeoJson layer so that its fillColor depends on
  function style(feature) {

    return {
        fillColor: getColor(feature.properties.total_NUMPOINTS),
        weight: 2,
        color: getColor(feature.properties.total_NUMPOINTS),
        fillOpacity: .9,
        stroke: false
    };
}  
////// Adding data as geojson to maps //////

  // Roads //
  // constructs a variable to store geojson and add to map
  var collisionRoads = L.geoJson(collisionRoadsGeoJSON, {
    style: style
  }).addTo(map);

  // print to check
  console.log(collisionCountRoads);

  // Bicycle Points //
  // constructs a variable to store geojson and add to map
  var collisionBicycles = L.geoJson(collisionBicyclesGeoJSON, {
    pointToLayer: function (bicycle_points, latlng) {
      return L.circleMarker(latlng);
    },
    onEachFeature: function(feature, layer) {
      const props = feature.properties
      console.log(props)
      const popup = `<h3><u>${props['DIRECTIONA']}</h3>
                         <img src='${props["Image File Path"]}' width='100%'><br>
                         <!-- Button trigger modal -->
                          <a href='#' data-toggle="modal" data-target="#${props["modalID"]}">
                            Click to learn about ${props["Site Name"]}!
                          </a>`
        layer.bindPopup(popup)
    }
  })
    .setStyle(bikeMarkerOptions)

  // print to check
  console.log(collisionBicycles);

  // Scooter points //
  // constructs a variable to store geojson and add to map
  var collisionScooters = L.geoJson(collisionScootersGeoJSON, {
    pointToLayer: function (scooter_points, latlng) {
      return L.circleMarker(latlng);
    },
  })
    .setStyle(scooterMarkerOptions);

  // print to check
  console.log(collisionScooters);

  // All points
  // constructs a variable to store geojson and add to map
  var allCollisions = L.geoJson(allCollisionsGeoJSON, {
    pointToLayer: function (all_points, latlng) {
      return L.circleMarker(latlng);
    },
  })
  .setStyle(allCircleOptions);

  // print to check
  console.log(allCollisions)




var points = {
  "All Bicycle/Scooter Collisions": allCollisions,
  "Bicycle Collisions": collisionBicycles,
  "Scooter Collisions": collisionScooters
};

///////////////// pop-ups //////////////////////


// create a popup for bicycles

  // add the scooter/bicycle collision points to one layer group
 L.control.layers(points).addTo(map);



};
