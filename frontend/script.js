document.addEventListener('DOMContentLoaded', () => {

  const searchForm = document.querySelector('.search-bar');
  const localTime = document.querySelector('.local-time-text');
  const cityName = document.querySelector('.city-name');
  const temperature = document.querySelector('.temp-main');
  const statValues = document.querySelectorAll('.stat-value');
  const stormTitle = document.querySelector('.storm-title');
  const stormDescription = document.querySelector('.storm-desc');
  const weatherMessage = document.querySelector('.weather-message');


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
        // UPDATE CITY
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

        // Update storm description
        stormDescription.textContent =
          `Current weather conditions in ${data.city}.`;


        console.log("AeroCast UI updated successfully!");

      }


      catch (error) {

        console.error("Error connecting to backend:", error);

        alert("Unable to connect to the weather server.");

      }

    });

  }

});

