// main.js: map setup, clustering, legend, and chart updating for scooter collisions only

document.addEventListener("DOMContentLoaded", () => {
  function parseDate(str) {
    const parts = str.split("/");
    if (parts.length === 3) {
      let [m, d, y] = parts;
      if (y.length === 2) y = "20" + y;
      return new Date(+y, +m - 1, +d);
    }
    return new Date(str);
  }

const map = L.map("map", {
  zoomControl: false,
  maxZoom: 18 // ✅ Fix: define maxZoom to avoid plugin complaints
}).setView([38.04696, -84.50747], 12);

// Re-add zoom control to bottom right
L.control.zoom({ position: 'bottomright' }).addTo(map);
  // Add custom title and subtitle
  const titleContainer = L.DomUtil.create("div", "map-title-container");
  titleContainer.innerHTML = `
  <h2 class="map-title">Lexington Motorized Scooter Injury Map</h2>
  <p class="map-subtitle">Locations of Injury and Non-Injury Accidents from 2019–2023</p>
`;
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  maxZoom: 18
}).addTo(map);

  // Use Leaflet control to place it in the top-left
 const titleControl = L.control({ position: 'topleft' });
titleControl.onAdd = function () {
  const div = L.DomUtil.create("div", "map-title-container");
  div.innerHTML = `
    <h2 class="map-title">Lexington Motorized Scooter Injury Map</h2>
    <p class="map-subtitle">Locations of Injury and Non-Injury Accidents from 2019–2022</p>
  `;
  return div;
};
titleControl.addTo(map);

  // Legend & description
  // Legend & description
  const legend = L.control({ position: "bottomleft" }); // ✅ declare the variable

  legend.onAdd = () => {
    const div = L.DomUtil.create("div", "map-legend-container leaflet-control");
    div.id = "map-legend";
    div.innerHTML = `
    <div class="map-description">
      This interactive map displays motorized scooter incidents in Lexington, Kentucky from 2019-2023. 
      Use the date selectors in the sidebar to filter incidents by time period. 
      Clusters automatically group nearby incidents for better visualization.
    </div>
    <div class="legend-title">Incident Types</div>
    <div class="legend-item">
      <span class="legend-color" style="background: linear-gradient(135deg, #ff7e40 0%, #e65a2b 100%);"></span>
      <div>
        <strong>Injury Incidents</strong><br>
        <small>Accidents resulting in injuries</small>
      </div>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background: linear-gradient(135deg, #fed501 0%, #e6c000 100%);"></span>
      <div>
        <strong>Non-Injury Incidents</strong><br>
        <small>Property damage or minor accidents</small>
      </div>
    </div>
    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.1); font-size: 12px; color: #5a6c7d;">
      💡 <strong>Tip:</strong> Click on clusters to zoom in and see individual incidents
    </div>
  `;
    return div;
  };

  legend.addTo(map); // ✅ now it’s defined and safe to use


  const injuryCluster = L.markerClusterGroup();
  const nonInjuryCluster = L.markerClusterGroup();
  let allFeatures = [];

  // Fetch scooter data
  fetch("scooter_collisions.geojson")
    .then((r) => {
      if (!r.ok) throw Error(r.status);
      return r.json();
    })
    .then((data) => {
      allFeatures = data.features;

      // Set range for month inputs
      const dates = allFeatures.map((f) => parseDate(f.properties.DATE)).filter((d) => !isNaN(d));
      const min = new Date(Math.min(...dates));
      const max = new Date(Math.max(...dates));
      const toMonth = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      document.getElementById("start-month").min = toMonth(min);
      document.getElementById("start-month").max = toMonth(max);
      document.getElementById("start-month").value = toMonth(min);
      document.getElementById("end-month").min = toMonth(min);
      document.getElementById("end-month").max = toMonth(max);
      document.getElementById("end-month").value = toMonth(max);

      // Add points
      allFeatures.forEach((f) => {
        const injured = f.properties.Injured || 0;
        const [lng, lat] = f.geometry.coordinates;
        const m = L.circleMarker([lat, lng], {
          radius: 8,
          fillColor: injured ? "#ff7e40" : "#fed501",
          color: injured ? "#e65a2b" : "#e6c000",
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.7
        }).bindPopup(`
          <div style="font-family: 'Inter', sans-serif; min-width: 200px;">
            <h6 style="margin: 0 0 8px 0; color: ${injured ? '#ff7e40' : '#fed501'};">
              ${injured ? '🚨 Injury Incident' : '⚠️ Non-Injury Incident'}
            </h6>
            <p style="margin: 0 0 4px 0;"><strong>Date:</strong> ${f.properties.DATE}</p>
            <p style="margin: 0 0 4px 0;"><strong>Day:</strong> ${f.properties.DoW}</p>
            <p style="margin: 0;"><strong>Injuries:</strong> ${injured}</p>
          </div>
        `);
        injured ? injuryCluster.addLayer(m) : nonInjuryCluster.addLayer(m);
      });

      map.addLayer(injuryCluster);
      map.addLayer(nonInjuryCluster);
      setupChart();
    })
    .catch((e) => console.error("Error loading GeoJSON:", e));

  let injuryChart, dowChart;

  function setupChart() {
    const ctx1 = document.getElementById("injuryChart").getContext("2d");
    injuryChart = new Chart(ctx1, {
      type: "line",
      data: { labels: [], datasets: [{ label: "Avg Injuries", data: [] }] },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: "Month" } },
          y: { beginAtZero: true, title: { display: true, text: "Avg Injuries" } }
        }
      }
    });

    const ctx2 = document.getElementById("dowChart").getContext("2d");
    dowChart = new Chart(ctx2, {
      type: "bar",
      data: {
        labels: [],
        datasets: [{
          label: "# of Incidents",
          data: [],
          backgroundColor: 'rgba(54, 162, 235, 0.6)'
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: "Day of Week" } },
          y: { beginAtZero: true, title: { display: true, text: "Count" } }
        }
      }
    });

    ["start-month", "end-month"].forEach((id) =>
      document.getElementById(id).addEventListener("change", updateChart)
    );
    document.getElementById("cluster-injury").addEventListener("change", (e) =>
      e.target.checked ? map.addLayer(injuryCluster) : map.removeLayer(injuryCluster)
    );
    document.getElementById("cluster-noninjury").addEventListener("change", (e) =>
      e.target.checked ? map.addLayer(nonInjuryCluster) : map.removeLayer(nonInjuryCluster)
    );

    updateChart();
  }

  const toggleButton = document.getElementById('toggle-dashboard');
  const dashboard = document.getElementById('dashboard');
  const mapEl = document.getElementById('map');

  // Collapse dashboard on mobile view at load
  if (window.innerWidth < 768) {
    dashboard.classList.remove('dashboard-visible');
    dashboard.classList.add('dashboard-hidden');
    mapEl.style.right = '0';
  }

  toggleButton.addEventListener('click', () => {
    dashboard.classList.toggle('dashboard-visible');
    dashboard.classList.toggle('dashboard-hidden');

    const isCollapsed = dashboard.classList.contains('dashboard-hidden');
    mapEl.style.right = isCollapsed ? '0' : '400px';

    // Force Leaflet to resize
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  });

  // Legend toggle logic for mobile
  const legendToggle = document.getElementById('toggle-legend');
  const legendContainer = document.getElementById('map-legend');

  if (window.innerWidth < 768) {
    legendContainer.style.display = 'none';
  }

  legendToggle?.addEventListener('click', () => {
    if (legendContainer.style.display === 'none') {
      legendContainer.style.display = 'block';
    } else {
      legendContainer.style.display = 'none';
    }
  });

  function updateChart() {
    if (!injuryChart || !dowChart) return;

    const start = document.getElementById("start-month").value;
    const end = document.getElementById("end-month").value;

    const cnts = {};
    const dowCnts = {
      Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0,
      Thursday: 0, Friday: 0, Saturday: 0
    };

    allFeatures.forEach((f) => {
      const dt = parseDate(f.properties.DATE);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (key < start || key > end) return;

      cnts[key] = cnts[key] || { sum: 0, c: 0 };
      cnts[key].sum += f.properties.Injured || 0;
      cnts[key].c++;

      const day = f.properties.DoW;
      if (dowCnts[day] !== undefined) dowCnts[day]++;
    });

    const labels = Object.keys(cnts).sort();
    injuryChart.data.labels = labels;
    injuryChart.data.datasets[0].data = labels.map((k) => cnts[k].sum / cnts[k].c);
    injuryChart.update();

    const dowLabels = Object.keys(dowCnts);
    dowChart.data.labels = dowLabels;
    dowChart.data.datasets[0].data = dowLabels.map((d) => dowCnts[d]);
    dowChart.update();
  }
});
