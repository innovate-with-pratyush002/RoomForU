const locationInput = document.getElementById('locationField');
const stateInput = document.getElementById('stateField');
const currentBtn = document.getElementById('currentLocationBtn');
const form = document.querySelector('.edit-form');
const mapContainer = document.getElementById('map');

const listingData = {
  id: mapContainer?.dataset?.id || "",
  lat: mapContainer?.dataset?.lat ? parseFloat(mapContainer.dataset.lat) : null,
  lon: mapContainer?.dataset?.lon ? parseFloat(mapContainer.dataset.lon) : null
};

let map = L.map('map').setView([20.5937, 78.9629], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let marker;
let isUserTyping = false;
let debounceTimer = null;

function setMarker(lat, lon) {
  if (!marker) {
    marker = L.marker([lat, lon], { draggable: true }).addTo(map);
    marker.on('dragend', async () => {
      const p = marker.getLatLng();
      await reverseGeocode(p.lat, p.lng, true);
    });
  } else {
    marker.setLatLng([lat, lon]);
  }
  map.setView([lat, lon], 15);
}

async function reverseGeocode(lat, lon, allowOverwrite) {
  try {
    const res = await axios.get(
      'https://nominatim.openstreetmap.org/reverse',
      {
        params: { lat, lon, format: 'json', addressdetails: 1 }
      }
    );

    if (res.data?.address && allowOverwrite) {
      const a = res.data.address;

      locationInput.value =
        a.suburb ||
        a.neighbourhood ||
        a.residential ||
        a.road ||
        a.city ||
        a.town ||
        a.village ||
        '';

      stateInput.value = a.state || '';
    }

    document.getElementById('latField').value = lat;
    document.getElementById('lonField').value = lon;

  } catch (e) {
    console.error(e);
  }
}

async function forwardGeocode() {
  if (!isUserTyping) return;

  const q = `${locationInput.value}, ${stateInput.value}`;
  if (q.trim().length < 4) return;

  try {
    const res = await axios.get(
      'https://nominatim.openstreetmap.org/search',
      {
        params: { q, format: 'json', limit: 1 }
      }
    );

    if (res.data?.length) {
      setMarker(+res.data[0].lat, +res.data[0].lon);
    }

  } catch (e) {
    console.error(e);
  }
}

function handleTyping() {
  isUserTyping = true;
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    forwardGeocode();
    isUserTyping = false;
  }, 700);
}

locationInput.addEventListener('input', handleTyping);
stateInput.addEventListener('input', handleTyping);

              /*  map click */
map.on('click', async e => {
  setMarker(e.latlng.lat, e.latlng.lng);
  await reverseGeocode(e.latlng.lat, e.latlng.lng, true);
});

           /* curr loc  */
currentBtn.addEventListener('click', () => {
  navigator.geolocation.getCurrentPosition(async pos => {
    setMarker(pos.coords.latitude, pos.coords.longitude);
    await reverseGeocode(pos.coords.latitude, pos.coords.longitude, true);
  });
});

         /* initial  */
if (listingData.lat && listingData.lon) {
  setMarker(listingData.lat, listingData.lon);
  reverseGeocode(listingData.lat, listingData.lon, true);
}

form.addEventListener('submit', () => {
  if (marker) {
    const p = marker.getLatLng();
    latField.value = p.lat;
    lonField.value = p.lng;
  }
});
