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

  const map = L.map("map").setView([38.04696, -84.50747], 12);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { attribution: "&copy; OpenStreetMap contributors &copy; CARTO" }).addTo(map);

  // Legend & description
  const legend = L.control({ position: "bottomleft" });
  legend.onAdd = () => {
    const div = L.DomUtil.create("div", "map-legend-container leaflet-control");
    div.innerHTML = `
      <div class="map-description">This map shows motorized scooter injury incidents in Lexington, Kentucky. Use the date selectors to filter by month and year; the map will update to show incident locations.</div>
      <div class="legend-title">Legend</div>
      <div class="legend-item"><span class="legend-color" style="background:red;"></span>Injury</div>
      <div class="legend-item"><span class="legend-color" style="background:green;"></span>Non-Injury</div>
    `;
    return div;
  };
  legend.addTo(map);

  const injuryCluster = L.markerClusterGroup();
  const nonInjuryCluster = L.markerClusterGroup();
  let allFeatures = [];

  // Fetch scooter data
  fetch("../data/geojson/scooter_collisions.geojson")
    .then((r) => { if (!r.ok) throw Error(r.status); return r.json(); })
    .then((data) => {
      allFeatures = data.features;

      // determine range for month inputs
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

      // add points
      allFeatures.forEach((f) => {
        const injured = f.properties.Injured || 0;
        const [lng, lat] = f.geometry.coordinates;
        const m = L.circleMarker([lat, lng], { radius: 6, color: injured ? "red" : "green" }).bindPopup(`Injured: ${injured}`);
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
      options: { responsive: true, scales: { x: { title: { display: true, text: "Month" } }, y: { beginAtZero: true, title: { display: true, text: "Avg Injuries" } } } }
    });

    const ctx2 = document.getElementById("dowChart").getContext("2d");
    dowChart = new Chart(ctx2, {
      type: "bar",
      data: { labels: [], datasets: [{ label: "# of Incidents", data: [], backgroundColor: 'rgba(54, 162, 235, 0.6)' }] },
      options: { responsive: true, scales: { x: { title: { display: true, text: "Day of Week" } }, y: { beginAtZero: true, title: { display: true, text: "Count" } } } }
    });

    ["start-month", "end-month"].forEach((id) => document.getElementById(id).addEventListener("change", updateChart));
    document.getElementById("cluster-injury").addEventListener("change", (e) => e.target.checked ? map.addLayer(injuryCluster) : map.removeLayer(injuryCluster));
    document.getElementById("cluster-noninjury").addEventListener("change", (e) => e.target.checked ? map.addLayer(nonInjuryCluster) : map.removeLayer(nonInjuryCluster));

    updateChart();
  }

  function updateChart() {
    if (!injuryChart || !dowChart) return;
    const start = document.getElementById("start-month").value;
    const end = document.getElementById("end-month").value;
    const cnts = {}, dowCnts = { Sunday:0, Monday:0, Tuesday:0, Wednesday:0, Thursday:0, Friday:0, Saturday:0 };

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
