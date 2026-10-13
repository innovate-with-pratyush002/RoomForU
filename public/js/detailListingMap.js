const map = L.map("map");
const mapContainer = document.getElementById("map");
const distanceText = document.getElementById("distanceText");

const listingData = {
  id: mapContainer?.dataset?.id || "",
  lat: mapContainer?.dataset?.lat ? parseFloat(mapContainer.dataset.lat) : null,
  lon: mapContainer?.dataset?.lon ? parseFloat(mapContainer.dataset.lon) : null,
  location: mapContainer?.dataset?.location || "",
  state: mapContainer?.dataset?.state || ""
};

map.setView([20.5937, 78.9629], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

function isValidCoordinate(lat, lon) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

async function geocodePlace(placeName) {
  if (!placeName || !placeName.trim()) {
    return null;
  }

  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
      encodeURIComponent(placeName.trim());

    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);

    if (!isValidCoordinate(lat, lon)) {
      return null;
    }

    return { lat, lon };
  } catch (error) {
    console.error("Could not geocode listing location:", error);
    return null;
  }
}

function setMapMessage(message) {
  mapContainer.innerHTML = "<p>" + message + "</p>";
}

function setDistanceMessage(message) {
  if (distanceText) {
    distanceText.textContent = message;
  }
}

async function getListingLocation() {
  if (!listingData) {
    return null;
  }

  if (isValidCoordinate(listingData.lat, listingData.lon)) {
    return {
      lat: listingData.lat,
      lon: listingData.lon
    };
  }

  const searchCandidates = [
    listingData.location,
    [listingData.location, listingData.state].filter(Boolean).join(", "),
    listingData.state
  ].filter(Boolean);

  for (const candidate of searchCandidates) {
    const geocodedLocation = await geocodePlace(candidate);

    if (geocodedLocation) {
      return geocodedLocation;
    }
  }

  return null;
}

function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371;
  const latDiff = (lat2 - lat1) * Math.PI / 180;
  const lonDiff = (lon2 - lon1) * Math.PI / 180;

  const part1 = Math.sin(latDiff / 2) * Math.sin(latDiff / 2);
  const part2 = Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
  const part3 = Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);

  const finalValue = part1 + (part2 * part3);
  const angle = 2 * Math.atan2(Math.sqrt(finalValue), Math.sqrt(1 - finalValue));

  return earthRadius * angle;
}

function showOnlyListingLocation(listingLocation) {
  const listingMarker = L.marker([listingLocation.lat, listingLocation.lon]).addTo(map);

  listingMarker.bindPopup("Listing Location").openPopup();

  map.setView([listingLocation.lat, listingLocation.lon], 15);
}

function showUserAndListingLocation(listingLocation, userLocation) {
  const userMarker = L.marker([userLocation.lat, userLocation.lon]).addTo(map);
  userMarker.bindPopup("Your Location");

  const listingMarker = L.marker([listingLocation.lat, listingLocation.lon]).addTo(map);
  listingMarker.bindPopup("Listing Location");

  const line = L.polyline(
    [
      [userLocation.lat, userLocation.lon],
      [listingLocation.lat, listingLocation.lon]
    ],
    {
      color: "blue"
    }
  ).addTo(map);

  map.fitBounds(line.getBounds(), {
    padding: [40, 40]
  });

  const distance = getDistanceInKm(
    userLocation.lat,
    userLocation.lon,
    listingLocation.lat,
    listingLocation.lon
  ).toFixed(2);

  setDistanceMessage(distance + " km from your current location");

  const middleLat = (userLocation.lat + listingLocation.lat) / 2;
  const middleLon = (userLocation.lon + listingLocation.lon) / 2;

  L.popup()
    .setLatLng([middleLat, middleLon])
    .setContent("<b>Distance:</b> " + distance + " km")
    .openOn(map);
}

function handleLocationError(error, listingLocation) {
  showOnlyListingLocation(listingLocation);

  if (!error) {
    alert("Location could not be accessed. Please turn on location and try again.");
    return;
  }

  if (error.code === error.PERMISSION_DENIED) {
    alert("Location permission is blocked. Please allow location access from your browser site settings.");
    return;
  }

  const shouldRetry = confirm(
    "Location is off or unavailable. Please turn on your device location, then press OK to try again."
  );

  if (shouldRetry) {
    askUserLocation(listingLocation);
  }
}

function askUserLocation(listingLocation) {
  if (!navigator.geolocation) {
    setDistanceMessage("Location support unavailable. Distance cannot be shown.");
    showOnlyListingLocation(listingLocation);
    return;
  }

  setDistanceMessage("Please allow site location permission to see the distance.");

  navigator.geolocation.getCurrentPosition(
    function (position) {
      const userLocation = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };

      showUserAndListingLocation(listingLocation, userLocation);
    },
    function (error) {
      setDistanceMessage("Location permission denied, so distance cannot be shown.");
      handleLocationError(error, listingLocation);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

async function startMap() {
  const listingLocation = await getListingLocation();

  if (!listingLocation) {
    setMapMessage("Location could not be loaded for this listing.");
    setDistanceMessage("Distance could not be calculated for this listing.");
    return;
  }

  askUserLocation(listingLocation);
}

startMap();
