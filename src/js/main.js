
// set options for the map object
const options = {
  zoomSnap: 0.1,
  center: [38.046960, -84.507469],
  zoom: 11,
  minZoom: 2,
  maxZoom: 13,
};

// creating the map object
const map = L.map('map', options);

// load in data with d3 fetch
// const blocksDataRaw = d3.json(
//   'data/geojson/blocks_census_airbnb_joined.geojson'
// );
// const listingsDataRaw = d3.csv('data/csv/listings_cleaned.csv');
// const listingsGeojson = d3.json('data/geojson/listings_cleaned.geojson');

// const visiblePoints = L.featureGroup().addTo(map);
// const hiddenPoints = L.featureGroup();

const collisionCountRoads = d3.json('../data/geojson/roads_counts.geojson')
const bicycle_points = d3.json('../data/shp/all_bicycle_collisions.geojson');
// promise statement to call an array of data variables then proceed to mapping function
Promise.all([collisionCountRoads, bicycle_points]).then(drawMap);

// set global variables for map layer
// mapped attribute, and normalizing attribute
let attributeValue = 'airbnbs';
let normValue = 'total_unit_sum';

// start of drawing Map function
function drawMap(data) {

  // display Carto basemap tiles with light features and labels
  const tiles = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  );

  // add basemap tiles to map
  tiles.addTo(map);

  const collisionRoadsGeoJSON = data[0];


  // airbnb point circle options
  var geojsonMarkerOptions = {
    fillColor: 'blue',
    color: 'black',
    weight: 2,
    opacity: .8,
    fillOpacity: .3,
  };

  var collisionRoads = L.geoJson(collisionRoadsGeoJSON, {
  }).addTo(map)

  console.log(collisionCountRoads)

   L.geoJson(bicycle_points, {
    pointToLayer: function (bicycle_points, latlng) {
      return L.marker(latlng)
    }
  });
}