/**
 * WIMP — WhereIsMyParking
 * app.js | v3 — UX Flow Refactor (Splash, Landing, Rotate Status, Static Address, Back to Home)
 *
 * Data layer & analytics are 100% preserved:
 *   - Static dataset: /data/kerala-parking.json (zero live Overpass calls)
 *   - PMF Analytics: track('session_start'), track('location_granted'), etc.
 *   - Address data: sourced 100% from static dataset (no live geocoding per card)
 */

'use strict';

/* ─────────────────────────────────────────
   CONFIG
───────────────────────────────────────── */
const CONFIG = {
  radiusDefault:    2000,    // metres — initial search radius
  radiusExpanded:   5000,    // metres — auto-expand if < minResults found
  minResults:       3,       // threshold to trigger radius expansion
  dataUrl:          '/data/kerala-parking.json', // static OSM snapshot
  nominatimUrl:     'https://nominatim.openstreetmap.org/search',
  nominatimTimeout: 8000,    // ms — abort manual geocoding if no response in 8s
  geoTimeout:       8000,    // ms — geolocation watchdog
  splashMaxMs:      2000,    // ms — max splash duration before showing landing
  analyticsUrl:     null,    // Set to Cloudflare Worker URL when available
  analyticsKey:     'wimp_analytics_events',
  analyticsMax:     500,
};

/* ─────────────────────────────────────────
   STATE
───────────────────────────────────────── */
let state = {
  lat:           null,
  lng:           null,
  radius:        CONFIG.radiusDefault,
  lots:          [],
  allLots:       null,  // full Kerala dataset, cached after first fetch
  dataError:     false,
  splashDone:    false,
  loadingTimer:  null,
  loadingMsgIdx: 0,
};

/* ─────────────────────────────────────────
   DOM REFS
───────────────────────────────────────── */
const $ = id => document.getElementById(id);
const el = {
  statusDot:            $('status-dot'),
  statusText:           $('status-text'),

  // Screens
  splashScreen:         $('splash-screen'),
  landingScreen:        $('landing-screen'),
  skeletonState:        $('skeleton-state'),
  resultsSection:       $('results-section'),
  fallbackPanel:        $('fallback-panel'),
  emptyState:           $('empty-state'),
  errorState:           $('error-state'),

  // Buttons & Controls
  btnGrantLocation:     $('btn-grant-location'),
  btnEnterManually:     $('btn-enter-manually'),
  resultsCountLabel:    $('results-count-label'),
  resultsRadiusLabel:   $('results-radius-label'),
  resultsList:          $('results-list'),
  fallbackInput:        $('fallback-input'),
  btnFallbackSearch:    $('btn-fallback-search'),
  geocodeError:         $('geocode-error'),
  emptySubText:         $('empty-sub-text'),
  btnRetryEmpty:        $('btn-retry-empty'),
  btnHomeEmpty:         $('btn-home-empty'),
  errorDetail:          $('error-detail'),
  btnRetryError:        $('btn-retry-error'),
  btnHomeError:         $('btn-home-error'),
  btnBackHomeResults:   $('btn-back-home-results'),
  btnBackHomeFallback:  $('btn-back-home-fallback'),
  fabTop:               $('fab-top'),
};

/* ─────────────────────────────────────────
   UI STATE MACHINE
───────────────────────────────────────── */
const ALL_STATES = [
  'splashScreen', 'landingScreen', 'skeletonState',
  'resultsSection', 'fallbackPanel', 'emptyState', 'errorState',
];

function showState(...names) {
  stopLoadingRotator();
  ALL_STATES.forEach(s => {
    const elem = el[s];
    if (elem) elem.classList.toggle('hidden', !names.includes(s));
  });
}

function setStatus(msg, mode = 'idle') {
  el.statusText.textContent = msg;
  el.statusDot.className = 'status-dot';
  if (mode === 'active')  el.statusDot.classList.add('active');
  if (mode === 'loading') el.statusDot.classList.add('loading');
  if (mode === 'error')   el.statusDot.classList.add('error');
}

/* ─────────────────────────────────────────
   LOADING MESSAGE ROTATOR
───────────────────────────────────────── */
const LOADING_MESSAGES = [
  'Locating your position…',
  'Finding nearby parking…',
  'Searching nearby parking lots…',
];

function startLoadingRotator() {
  stopLoadingRotator();
  state.loadingMsgIdx = 0;
  setStatus(LOADING_MESSAGES[0], 'loading');
  state.loadingTimer = setInterval(() => {
    state.loadingMsgIdx = (state.loadingMsgIdx + 1) % LOADING_MESSAGES.length;
    setStatus(LOADING_MESSAGES[state.loadingMsgIdx], 'loading');
  }, 1500);
}

function stopLoadingRotator() {
  if (state.loadingTimer) {
    clearInterval(state.loadingTimer);
    state.loadingTimer = null;
  }
}

/* ─────────────────────────────────────────
   PMF ANALYTICS (100% PRESERVED)
───────────────────────────────────────── */
function track(event, payload = {}) {
  const data = { event, ts: Date.now(), ...payload };
  console.info('[WIMP analytics]', data);

  // Persist to localStorage
  try {
    const raw    = localStorage.getItem(CONFIG.analyticsKey);
    const stored = raw ? JSON.parse(raw) : [];
    stored.push(data);
    if (stored.length > CONFIG.analyticsMax) stored.splice(0, stored.length - CONFIG.analyticsMax);
    localStorage.setItem(CONFIG.analyticsKey, JSON.stringify(stored));
  } catch (_) {}

  // Beacon to remote endpoint if configured
  if (!CONFIG.analyticsUrl) return;
  try {
    navigator.sendBeacon(CONFIG.analyticsUrl + '/track', JSON.stringify(data));
  } catch (_) {}
}

/* ─────────────────────────────────────────
   STATIC DATA LAYER (NO LIVE OVERPASS)
───────────────────────────────────────── */
async function ensureDataLoaded() {
  if (state.allLots !== null) return true;   // already loaded
  if (state.dataError) return false;         // already failed

  try {
    const res = await fetch(CONFIG.dataUrl, { cache: 'default' });
    if (!res.ok) throw new Error(`Data fetch: HTTP ${res.status}`);
    state.allLots = await res.json();
    return true;
  } catch (err) {
    console.error('[WIMP] Failed to load kerala-parking.json:', err);
    state.dataError = true;
    renderError('Could not load parking data. Check your connection and try again.');
    return false;
  }
}

/* ─────────────────────────────────────────
   GEOLOCATION
───────────────────────────────────────── */
function requestLocation() {
  track('session_start');
  showState('skeletonState');
  startLoadingRotator();

  if (!navigator.geolocation) {
    track('location_denied', { reason: 'api_unavailable' });
    showFallback('Geolocation is not supported by your browser.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    onLocationGranted,
    onLocationDenied,
    { enableHighAccuracy: false, timeout: CONFIG.geoTimeout, maximumAge: 30000 }
  );
}

async function onLocationGranted(pos) {
  stopLoadingRotator();
  state.lat = pos.coords.latitude;
  state.lng = pos.coords.longitude;
  track('location_granted');

  const ok = await ensureDataLoaded();
  if (!ok) return;

  findNearbyParking(state.lat, state.lng, CONFIG.radiusDefault);
}

function onLocationDenied(err) {
  stopLoadingRotator();
  const reason = err.code === 1 ? 'permission_denied'
               : err.code === 2 ? 'position_unavailable' : 'timeout';
  track('location_denied', { reason });
  setStatus('Location unavailable', 'error');
  showFallback();
}

/* ─────────────────────────────────────────
   CLIENT-SIDE PARKING SEARCH (PURE HAVERSINE)
───────────────────────────────────────── */
function findNearbyParking(lat, lng, radius, isExpanded = false) {
  state.radius = radius;

  const nearby = state.allLots
    .map(lot => ({ ...lot, dist: haversine(lat, lng, lot.lat, lot.lng) }))
    .filter(lot => lot.dist <= radius)
    .sort((a, b) => a.dist - b.dist);

  // Auto-expand once if too few results
  if (nearby.length < CONFIG.minResults && !isExpanded && radius < CONFIG.radiusExpanded) {
    setStatus(`Expanding to ${CONFIG.radiusExpanded / 1000} km…`, 'loading');
    return findNearbyParking(lat, lng, CONFIG.radiusExpanded, true);
  }

  state.lots = nearby;
  track('results_shown', { count: nearby.length, radius });

  if (nearby.length === 0) renderEmpty();
  else                     renderResults(nearby, radius);
}

/* ─────────────────────────────────────────
   HAVERSINE & FORMATTING
───────────────────────────────────────── */
function haversine(lat1, lng1, lat2, lng2) {
  const R  = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a  = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function formatDist(m) {
  return m < 1000
    ? { value: Math.round(m),       unit: 'm'  }
    : { value: (m / 1000).toFixed(1), unit: 'km' };
}

/* ─────────────────────────────────────────
   NOMINATIM GEOCODING FALLBACK (8s TIMEOUT)
───────────────────────────────────────── */
async function geocodeFallback(query) {
  showState('skeletonState');
  startLoadingRotator();
  el.geocodeError.classList.add('hidden');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CONFIG.nominatimTimeout);

  try {
    const url = CONFIG.nominatimUrl + '?' + new URLSearchParams({
      q: query + ', Kerala, India',
      format: 'json', limit: '1', addressdetails: '0',
    });
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'WIMP-parking-finder/1.0' },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error('Nominatim error');

    const results = await res.json();
    stopLoadingRotator();

    if (!results.length) {
      el.geocodeError.textContent = 'Location not found. Try a different name.';
      el.geocodeError.classList.remove('hidden');
      showFallback();
      setStatus('Location not found', 'error');
      return;
    }

    state.lat = parseFloat(results[0].lat);
    state.lng = parseFloat(results[0].lon);

    showState('skeletonState');
    startLoadingRotator();

    const ok = await ensureDataLoaded();
    stopLoadingRotator();
    if (ok) findNearbyParking(state.lat, state.lng, CONFIG.radiusDefault);

  } catch (err) {
    clearTimeout(timer);
    stopLoadingRotator();
    const isTimeout = err.name === 'AbortError';
    el.geocodeError.textContent = isTimeout
      ? 'Location search timed out. Check your connection and try again.'
      : 'Could not search. Check your connection.';
    el.geocodeError.classList.remove('hidden');
    showFallback();
    setStatus(isTimeout ? 'Search timed out' : 'Search failed', 'error');
  }
}

/* ─────────────────────────────────────────
   NAVIGATION HANDOFF
───────────────────────────────────────── */
function openNavigation(lat, lng, name) {
  track('navigate_tapped', { lat, lng, name });
  const geoUri  = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = geoUri;
    setTimeout(() => window.open(mapsUrl, '_blank', 'noopener'), 800);
  } else {
    window.open(mapsUrl, '_blank', 'noopener');
  }
}

/* ─────────────────────────────────────────
   RENDERING
───────────────────────────────────────── */
function renderResults(lots, radius) {
  stopLoadingRotator();
  setStatus(`${lots.length} parking spot${lots.length !== 1 ? 's' : ''} found`, 'active');
  el.resultsCountLabel.textContent  = `${lots.length} result${lots.length !== 1 ? 's' : ''}`;
  el.resultsRadiusLabel.textContent = `within ${radius >= 1000 ? (radius/1000) + 'km' : radius + 'm'}`;
  el.resultsList.innerHTML = '';

  lots.forEach((lot, i) => {
    const { value, unit } = formatDist(lot.dist);
    const access = lot.accessType || 'Unspecified';
    const accessClass = access.toLowerCase();
    const addressStr = lot.address || 'Unspecified location';

    const li = document.createElement('li');
    li.innerHTML = `
      <article class="result-card" style="animation-delay:${i*50}ms" data-id="${lot.id}">
        <div class="card-top">
          <div class="card-title-group">
            <div class="card-badges">
              <span class="card-rank">#${i+1} Nearest</span>
              <span class="badge-access ${accessClass}">${escHtml(access)}</span>
            </div>
            <h3 class="card-name">${escHtml(lot.name || lot.label || 'Parking Area')}</h3>
            <p class="card-address-text">📍 ${escHtml(addressStr)}</p>
          </div>
          <div class="card-distance" aria-label="${value} ${unit} away">
            ${value}<span>${unit}</span>
          </div>
        </div>

        ${lot.type && lot.type.length ? `
        <div class="card-meta">
          ${lot.type.map(t => `<span class="meta-tag">${escHtml(t)}</span>`).join('')}
        </div>` : ''}

        <!-- Direct Navigate Button (Zero extra taps / ungated) -->
        <button
          class="btn-navigate"
          type="button"
          data-lat="${lot.lat}"
          data-lng="${lot.lng}"
          data-name="${escAttr(lot.name || lot.label || 'Parking Area')}"
          aria-label="Navigate to ${escAttr(lot.name || 'Parking Area')}, ${value} ${unit} away"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <polygon points="3 11 22 2 13 21 11 13 3 11" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          </svg>
          Navigate
        </button>
      </article>`;
    el.resultsList.appendChild(li);
  });

  showState('resultsSection');
  el.fabTop.classList.toggle('visible', lots.length > 5);
}

function renderEmpty() {
  stopLoadingRotator();
  track('empty_state_hit', { radius: state.radius });
  setStatus('No parking found nearby', 'error');
  el.emptySubText.textContent = state.radius >= CONFIG.radiusExpanded
    ? `No parking found within ${CONFIG.radiusExpanded/1000} km. OSM data may be sparse here — try a different area.`
    : `No parking found within ${CONFIG.radiusDefault/1000} km.`;
  showState('emptyState');
}

function renderError(detail) {
  stopLoadingRotator();
  setStatus('Failed to load', 'error');
  el.errorDetail.textContent = detail || 'Something went wrong. Try again.';
  showState('errorState');
}

function showFallback(note) {
  stopLoadingRotator();
  showState('fallbackPanel');
  el.geocodeError.classList.toggle('hidden', !note);
  if (note) el.geocodeError.textContent = note;
  setStatus('Enter your location manually', 'idle');
  setTimeout(() => el.fallbackInput?.focus(), 100);
}

function showLanding() {
  stopLoadingRotator();
  showState('landingScreen');
  setStatus('Ready — choose an option below', 'idle');
}

/* ─────────────────────────────────────────
   ESCAPE HELPERS
───────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(str) {
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ─────────────────────────────────────────
   EVENT LISTENERS
───────────────────────────────────────── */
function bindEvents() {
  // Navigation button click on card face
  el.resultsList.addEventListener('click', e => {
    const btn = e.target.closest('.btn-navigate');
    if (!btn) return;
    const { lat, lng, name } = btn.dataset;
    openNavigation(parseFloat(lat), parseFloat(lng), name);
  });

  // Landing actions
  el.btnGrantLocation?.addEventListener('click', requestLocation);
  el.btnEnterManually?.addEventListener('click', () => showFallback());

  // Manual fallback search
  el.btnFallbackSearch?.addEventListener('click', () => {
    const q = el.fallbackInput.value.trim();
    if (q) geocodeFallback(q); else el.fallbackInput.focus();
  });
  el.fallbackInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = el.fallbackInput.value.trim();
      if (q) geocodeFallback(q);
    }
  });

  // Back to Home affordances (State machine, no page reloads)
  el.btnBackHomeResults?.addEventListener('click', showLanding);
  el.btnBackHomeFallback?.addEventListener('click', showLanding);
  el.btnHomeEmpty?.addEventListener('click', showLanding);
  el.btnHomeError?.addEventListener('click', showLanding);

  // Recovery actions
  el.btnRetryEmpty?.addEventListener('click', () => showFallback());
  el.btnRetryError?.addEventListener('click', () => {
    state.dataError = false;
    if (state.lat && state.lng) {
      showState('skeletonState');
      startLoadingRotator();
      ensureDataLoaded().then(ok => ok && findNearbyParking(state.lat, state.lng, CONFIG.radiusDefault));
    } else {
      showLanding();
    }
  });

  // Scroll-to-top FAB
  el.fabTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', () => {
    if (state.lots.length > 5)
      el.fabTop.classList.toggle('visible', window.scrollY > 300);
  }, { passive: true });
}

/* ─────────────────────────────────────────
   INIT & BOOT FLOW
───────────────────────────────────────── */
function init() {
  bindEvents();

  // Show splash screen on boot
  showState('splashScreen');
  setStatus('Booting WIMP…', 'loading');

  // Pre-fetch dataset in parallel
  ensureDataLoaded().catch(() => {});

  // Transition out of splash screen after 1.8s max
  setTimeout(() => {
    state.splashDone = true;
    showLanding();
  }, CONFIG.splashMaxMs);
}

document.addEventListener('DOMContentLoaded', init);
