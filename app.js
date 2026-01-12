let data = null;
let expanded = new Set();

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupSearch();
});

// Load data from JSON
async function loadData() {
  try {
    const res = await fetch('./list.json');
    data = await res.json();
    render(data.districts);
  } catch (e) {
    document.getElementById('districts').innerHTML = '<div class="loading">Failed to load. Please refresh.</div>';
  }
}

// Render districts
function render(districts) {
  const container = document.getElementById('districts');
  const noResults = document.getElementById('no-results');

  if (!districts.length) {
    container.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }

  noResults.classList.add('hidden');
  container.innerHTML = districts.map(d => districtHTML(d)).join('');

  // Add click handlers
  container.querySelectorAll('.district-header').forEach(btn => {
    btn.onclick = () => toggleDistrict(btn.dataset.id);
  });
}

// District HTML
function districtHTML(d) {
  const id = d.district_en.toLowerCase().replace(/\s+/g, '-');
  const isOpen = expanded.has(id);

  return `
    <div class="district">
      <button class="district-header" data-id="${id}" aria-expanded="${isOpen}">
        <div class="district-name">
          <span class="district-name-ml">${d.district_ml}</span>
          <span class="district-name-en">${d.district_en}</span>
        </div>
        <div class="district-meta">
          <span class="unit-count">${d.stations.length} stations</span>
          <span class="chevron">▼</span>
        </div>
      </button>
      <div class="stations ${isOpen ? 'open' : ''}" id="stations-${id}">
        ${d.stations.map(s => stationHTML(s)).join('')}
      </div>
    </div>
  `;
}

// Station HTML
function stationHTML(s) {
  return `
    <div class="station">
      <div class="station-name">
        <span class="station-name-ml">${s.name_ml}</span>
        <span class="station-name-en">${s.name_en}</span>
      </div>
      <a href="tel:${s.phone}" class="call-btn" title="Call ${s.name_en}">📞</a>
    </div>
  `;
}

// Toggle district
function toggleDistrict(id) {
  const btn = document.querySelector(`[data-id="${id}"]`);
  const stations = document.getElementById(`stations-${id}`);

  if (expanded.has(id)) {
    expanded.delete(id);
    stations.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  } else {
    expanded.add(id);
    stations.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }
}

// Search setup
function setupSearch() {
  const input = document.getElementById('search');
  let timer;

  input.oninput = (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => search(e.target.value), 150);
  };
}

// Search function
function search(query) {
  if (!data) return;

  const q = query.trim().toLowerCase();

  if (!q) {
    expanded.clear();
    render(data.districts);
    return;
  }

  const results = data.districts
    .map(d => {
      const districtMatch = d.district_en.toLowerCase().includes(q) || d.district_ml.includes(q);
      const matchingStations = d.stations.filter(s =>
        s.name_en.toLowerCase().includes(q) || s.name_ml.includes(q)
      );

      if (districtMatch || matchingStations.length) {
        const id = d.district_en.toLowerCase().replace(/\s+/g, '-');
        expanded.add(id);
        return { ...d, stations: districtMatch ? d.stations : matchingStations };
      }
      return null;
    })
    .filter(Boolean);

  render(results);

  if (!results.length) {
    document.getElementById('no-results').querySelector('p').textContent = `No results for "${query}"`;
  }
}
