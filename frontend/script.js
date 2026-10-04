document.addEventListener('DOMContentLoaded', () => {

  const searchForm = document.querySelector('.search-bar');
  const localTime = document.querySelector('.local-time-text');
  const cityName = document.querySelector('.city-name');
  const temperature = document.querySelector('.temp-main');
  const statValues = document.querySelectorAll('.stat-value');
  const stormTitle = document.querySelector('.storm-title');
  const stormDescription = document.querySelector('.storm-desc');
  const weatherMessage = document.querySelector('.weather-message');
  const hourlyContainer = document.getElementById('hourlyForecast');

  // ------------------------------------
  // 1. INITIALIZE LEAFLET MAP
  // ------------------------------------
  let defaultLat = 37.7749;
  let defaultLon = -122.4194;

  const map = L.map('map').setView([defaultLat, defaultLon], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let marker = L.marker([defaultLat, defaultLon]).addTo(map)
      .bindPopup('<b>San Francisco</b><br>Current location')
      .openPopup();


  if (searchForm) {

    searchForm.addEventListener('submit', async (e) => {

      e.preventDefault();

      const input = searchForm.querySelector('.search-input');
      const city = input.value.trim();

      if (!city) {
        return;
      }

      console.log(`Searching weather for: ${city}`);

      try {

        // Ask Flask for weather data
        const response = await fetch(
          `https://aerocast-ajfq.onrender.com/api/weather?city=${encodeURIComponent(city)}`
        );

        // Convert response into JavaScript object
        const data = await response.json();

        // If Flask returns an error
        if (!response.ok) {
          console.error(data.error);
          alert(data.error);
          return;
        }

        // ------------------------------------
        // UPDATE CITY & TIME
        // ------------------------------------
        cityName.textContent = `${data.city}, ${data.country}`;
        localTime.textContent = data.local_time;

        // ------------------------------------
        // UPDATE TEMPERATURE
        // ------------------------------------
        temperature.textContent = `${data.temperature}°`;

        // ------------------------------------
        // UPDATE HUMIDITY
        // ------------------------------------
        statValues[0].textContent = `${data.humidity}%`;

        // ------------------------------------
        // UPDATE WIND SPEED
        // ------------------------------------
        statValues[1].textContent = `${data.wind_speed} km/h`;

        // ------------------------------------
        // UPDATE WEATHER CONDITION
        // ------------------------------------
        stormTitle.textContent = data.condition;
        weatherMessage.textContent = `Current conditions: ${data.condition}`;
        stormDescription.textContent = `Current weather conditions in ${data.city}.`;

        // ------------------------------------
        // UPDATE MAP (Using lat & lon from backend)
        // ------------------------------------
        if (data.lat && data.lon) {
          const lat = parseFloat(data.lat);
          const lon = parseFloat(data.lon);
          const newCoords = [lat, lon];
          
          map.setView(newCoords, 13);
          marker.setLatLng(newCoords)
                .bindPopup(`<b>${data.city}</b><br>Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`)
                .openPopup();
          
          // Fix render alignment bug if container size shifted
          setTimeout(() => { map.invalidateSize(); }, 200);
        }

        // ------------------------------------
        // UPDATE HOURLY FORECAST (Safe Fallback)
        // ------------------------------------
        if (hourlyContainer) {
          hourlyContainer.innerHTML = ''; // Clear old items

          if (data.hourly && data.hourly.length > 0) {
            data.hourly.forEach(hour => {
              const card = document.createElement('div');
              card.className = 'hourly-card';
              card.innerHTML = `
                <span style="font-size: 0.75rem; color: rgba(255,255,255,0.6);">${hour.time}</span>
                <span style="font-size: 1.25rem; margin: 0.35rem 0;">${hour.icon || '🌡️'}</span>
                <span style="font-size: 0.9rem; font-weight: 600; color: #fff;">${hour.temp}</span>
              `;
              hourlyContainer.appendChild(card);
            });
          } else {
            // Graceful message since you haven't built the hourly endpoint yet
            hourlyContainer.innerHTML = `<p style="font-size: 0.85rem; color: rgba(255,255,255,0.4); padding: 0.5rem; margin: 0;">Hourly forecast coming soon...</p>`;
          }
        }

        console.log("AeroCast UI updated successfully!");

      } catch (error) {
        console.error("Error connecting to backend:", error);
        alert("Unable to connect to the weather server.");
      }

    });

  }

});