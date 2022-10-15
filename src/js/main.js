// set options for the map object
const options = {
  zoomSnap: 0.1,
  center: [38.04696, -84.507469],
  zoom: 12,
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
const all_points = d3.json("../data/shp/all_collision_points.geojson");
const hex_grid = d3.json("../data/geojson/selected_collisions_hex.geojson");

// promise statement to call an array of data variables then proceed to mapping function
Promise.all([collisionCountRoads, bicycle_points, scooter_points, all_points, hex_grid]).then(
  drawMap
);

// set global variables for map layer
// mapped attribute, and normalizing attribute
// let attributeValue = 'airbnbs';
// let normValue = 'total_unit_sum';

// start of drawing Map function
function drawMap(data) {
  // display Carto basemap tiles with light features and labels
  const tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  });

  // add basemap tiles to map
  tiles.addTo(map);

  // add data after Promise
  const collisionRoadsGeoJSON = data[0];
  const collisionBicyclesGeoJSON = data[1];
  const collisionScootersGeoJSON = data[2];
  const allCollisionsGeoJSON = data[3];
  const hexGridGeoJSON = data[4];

  // bicycle accident circle options
  var bikeMarkerOptions = {
    radius: 5,
    fillColor: "grey",
    color: "black",
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.3,
  };

  // scooter accident circle options
  var scooterMarkerOptions = {
    radius: 5,
    fillColor: "grey",
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
    pointToLayer: function (all_points, latlng) {
      return L.circleMarker(latlng).bringToFront();
    },
    // return feature and layer, grab properties, make popup template
    onEachFeature: function(feature, layer) {
      const props = feature.properties
      console.log(props)
      const popup = `<h3><u>${props['DIRECTIONA']}</h3>  ///// Popup information //////////////
                         <img src='${props["Image File Path"]}' width='100%'><br>
                         <!-- Button trigger modal -->
                          <a href='#' data-toggle="modal" data-target="#${props["modalID"]}">
                            Click to learn about ${props["Site Name"]}!
                          </a>`
                          // bind popup below and add click/mouseover affordances
        layer.bindPopup(popup)
        layer.on('click', function (e) {
          map.flyTo(e.latlng, 17)
        })
        layer.on('mouseover', function() {
          this.setStyle({
            color: 'yellow'
          })
        }),
        layer.on('mouseout', function() {
          this.setStyle({
            color: 'blue'
          });
        })
    },
  })
    .setStyle(bikeMarkerOptions)

  // Scooter points //
  // constructs a variable to store geojson and add to map
  var collisionScooters = L.geoJson(collisionScootersGeoJSON, {
    pointToLayer: function (scooter_points, latlng) {
      return L.circleMarker(latlng);
    },
    onEachFeature: function(feature, layer) {
      const props = feature.properties
      //console.log(props)
      const popup = `<h3>${props['Direction']}</h3><hr>
                      <li> When: at <strong> ${props['TIME']}</strong> on <strong>${props['DATE']} </strong></li>
                      <li> Where: <strong> Intersection of ${props['INTERSECTI']} & ${props['ROADWAY']} </strong></li>
                      <li> Manner of accident: ${props['MANNER']}
                      <li> Hit and Run? : <strong> ${props['HitAndRun']} </strong></li>
                      <li> Number of involved parties: <strong> ${props ['#UNITS']} </strong></li><hr>
                      <li> Injured: <strong>${props['Injured']}</strong></li>
                      <li> Killed: <strong> ${props['Killed']}</strong></li>
                      <li> Injured: <strong>${props['#INJURED']}</strong></li>
                      <li> Injured: <strong> ${props['#INJURED']}</strong></li>
                      <li> Injured: <strong> ${props['#INJURED']}</strong></li>
        

                      `
        layer.bindPopup(popup)
        layer.on('click', function(e) {
          map.flyTo(e.latlng, 17);
        })
    },
  })
    .setStyle(scooterMarkerOptions);

  console.log(collisionScooters)

  // print to check
  //console.log(collisionScooters);

  // All points
  // constructs a variable to store geojson and later added in points variable for radio buttons
  var allCollisions = L.geoJson(allCollisionsGeoJSON, {
    pointToLayer: function (all_points, latlng) {
      return L.circleMarker(latlng);
    },
  })
  .setStyle(allCircleOptions);

  // print to check
  //console.log(allCollisions)


  // style function for hex grids
  function hexColor(d) {
  return  d > 6  ? '#BD0026' :
    d > 5  ? '#E31A1C' :
    d > 4  ? '#FC4E2A' :
    d > 3   ? '#FD8D3C' :
    d > 2   ? '#FEB24C' :
    d > 1   ? '#FED976' :
               '#FFEDA0';
};


// style function for hex grids
function hexColorScooters(d) {
  return  d > 5  ? '#BD0026' :
    d > 4  ? '#E31A1C' :
    d > 3   ? '#FC4E2A' :
    d > 2   ? '#FD8D3C' :
    d > 1   ? '#FEB24C' :
               '#FFEDA0';
};


// Hex styles for all collisions, scooters, and bicycles
// hex for all collisions style
function hexStyle(feature) {
  return {
      fillColor: hexColor(feature.properties.all_NUMPOINTS),
      weight: 2,
      opacity: 1,
      color: 'black',
      fillOpacity: 0.5,
      stroke: 4
  };
};
// hex for scooters style
function hexStyleScooter(feature) {
  return {
      fillColor: hexColorScooters(feature.properties.NUMPOINTS),
      weight: 2,
      opacity: 1,
      color: 'black',
      fillOpacity: 0.5,
      stroke: 4
  };
};
// hex for bicycles count style
function hexStyleBicycle(feature) {
  return {
      fillColor: hexColorScooters(feature.properties.Bicycle_NUMPOINTS),
      weight: 2,
      opacity: 1,
      color: 'black',
      fillOpacity: 0.5,
      stroke: 4
  };
};

  // load hex density of all collisions
  var hex = L.geoJson(hexGridGeoJSON, {
    pointToLayer: function(hex_grid, latlng) {
      return L.polygon(latlng, {color: 'red'})
    },
    style: hexStyle,
    onEachFeature: function(feature, layer) {
      const props = feature.properties
      //console.log(props)
      const popup = `<h3> Number of all collisions: <strong>${props['all_NUMPOINTS']}</h3>`

        layer.bindPopup(popup)
        layer.on('mouseover', function() {
          this.setStyle({
            color: 'yellow'
          })
        }),
        layer.on('mouseout', function() {
          this.setStyle({
            color: 'black'
          });
        })
    },
  });

  console.log(hex)

// load hexagon density of scooters 
  var hexScooters = L.geoJson(hexGridGeoJSON, {
    pointToLayer: function(hex_grid, latlng) {
      return L.polygon(latlng, {color: 'red'})
    },
    style: hexStyleScooter,
    onEachFeature: function(feature, layer) {
      const props = feature.properties
      //console.log(props)
      const popup = `<h3> Number of scooter collisions: <strong>${props['NUMPOINTS']}</h3>`
        layer.bindPopup(popup)
        layer.on('mouseover', function() {
          this.setStyle({
            color: 'yellow'
          })
        }),
        layer.on('mouseout', function() {
          this.setStyle({
            color: 'black'
          });
        })
    },
  });

  // load hexagon density of bicycles
  var hexBicycles = L.geoJson(hexGridGeoJSON, {
    pointToLayer: function(hex_grid, latlng) {
      return L.polygon(latlng, {color: 'red'})
    },
    style: hexStyleBicycle,
    onEachFeature: function(feature, layer) {
      const props = feature.properties
      //console.log(props)
      const popup = `<h3>Number of bicycle collisions: <strong>${props['Bicycle_NUMPOINTS']}</h3>`
        layer.bindPopup(popup)
        layer.on('mouseover', function() {
          this.setStyle({
            color: 'yellow'
          })
        }),
        layer.on('mouseout', function() {
          this.setStyle({
            color: 'black'
          });
        }),
        layer.on('click', function(e) {
          map.flyTo(e.latlng, 15);
        })
    },
  });

var points = {
  "All Bicycle/Scooter Collisions": allCollisions,
  "Bicycle Collisions": collisionBicycles,
  "Scooter Collisions": collisionScooters,
  "Hexagonal Density Grid of All Collisions": hex,
  "Hexagonal Density Grid of Scooter Collisions": hexScooters,
  "Hexagonal Density Grid of Bicycle Collisions": hexBicycles
};

  // add the scooter/bicycle collision points to one layer group
 L.control.layers(points).addTo(map);


// var for Fayette County coordinates
var fayetteCoords = [38.035631, -84.498344]

 // return to Fayette County bounds on bottom button 
 $('#button-fly-nash').on('click', function() {
  map.flyTo(fayetteCoords, 12);
 });
}

// add legend to the map 
// function addLegend(breaks) {
  
//   // create leaflet object to and position top left 
//   const legendControl = L.control({
//     position: 'bottomright',
//   });

//   // when legend is added to map 
//   legendControl.onAdd = function () {
    
//     // select a div element with an id attribute of legend
//     const legend = L.DomUtil.get('legend');


/*Legend specific*/
var legend = L.control({ position: "bottomright" });

legend.onAdd = function(map) {
  var div = L.DomUtil.create("div", "legend");
  div.innerHTML += "<h4>TEST</h4>";
  div.innerHTML += '<i style="background: #477AC2"></i><span>Water</span><br>';
  div.innerHTML += '<i style="background: #448D40"></i><span>Forest</span><br>';
  div.innerHTML += '<i style="background: #E6E696"></i><span>Land</span><br>';
  div.innerHTML += '<i style="background: #E8E6E0"></i><span>Residential</span><br>';
  div.innerHTML += '<i style="background: #FFFFFF"></i><span>Ice</span><br>';
  div.innerHTML += '<i class="icon" style="background-image: url(https://d30y9cdsu7xlg0.cloudfront.net/png/194515-200.png);background-repeat: no-repeat;"></i><span>Grænse</span><br>';
  
  

  return div;
    // disable scroll and click from propogating
    L.DomEvent.disableScrollPropagation(legend);
    L.DomEvent.disableClickPropogation(legend);

    // return the selecion to the method
    return legend; 
  };

  // add the empty legend div to the map
  legend.addTo(map);

  //select the legend, add title, begin unordered list and assign to variable
 // const legend = $('#legend').html(`<h5> TEST </h5>`)
