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
  // 1. INITIALIZE LEAFLET MAP (Default: SF)
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

      if (!city) return;

      console.log(`Searching weather for: ${city}`);

      try {
        const response = await fetch(
          `https://aerocast-ajfq.onrender.com/api/weather?city=${encodeURIComponent(city)}`
        );
        const data = await response.json();

        if (!response.ok) {
          console.error(data.error);
          alert(data.error || "City not found");
          return;
        }

        // ------------------------------------
        // SAFE UI UPDATES (Won't crash if classes differ)
        // ------------------------------------
        if (cityName) cityName.textContent = `${data.city}, ${data.country}`;
        if (localTime) localTime.textContent = data.local_time;
        if (temperature) temperature.textContent = `${data.temperature}°`;
        
        if (statValues && statValues.length >= 2) {
          statValues[0].textContent = `${data.humidity}%`;
          statValues[1].textContent = `${data.wind_speed} km/h`;
        }

        if (stormTitle) stormTitle.textContent = data.condition;
        if (weatherMessage) weatherMessage.textContent = `Current conditions: ${data.condition}`;
        if (stormDescription) stormDescription.textContent = `Current weather conditions in ${data.city}.`;

        // ------------------------------------
        // UPDATE MAP (Using backend latitude & longitude)
        // ------------------------------------
        if (data.latitude && data.longitude) {
          const lat = parseFloat(data.latitude);
          const lon = parseFloat(data.longitude);
          const newCoords = [lat, lon];
          
          map.setView(newCoords, 13);
          marker.setLatLng(newCoords)
                .bindPopup(`<b>${data.city}</b><br>Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`)
                .openPopup();
          
          setTimeout(() => { map.invalidateSize(); }, 200);
        }

        // ------------------------------------
        // UPDATE HOURLY FORECAST
        // ------------------------------------
        if (hourlyContainer) {
          hourlyContainer.innerHTML = ''; 
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