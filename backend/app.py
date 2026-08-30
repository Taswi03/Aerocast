from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import os

app = Flask(__name__)

# Allow our frontend to communicate with the Flask backend
CORS(app)



def get_weather_condition(code):

    weather_conditions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",

        45: "Fog",
        48: "Depositing rime fog",

        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",

        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",

        71: "Slight snow",
        73: "Moderate snow",
        75: "Heavy snow",

        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",

        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail"
    }

    return weather_conditions.get(code, "Unknown")


# --------------------------------------------------
# Home route
# --------------------------------------------------

@app.route("/")
def home():

    return "AeroCast Backend is running!"


# --------------------------------------------------
# Test API
# --------------------------------------------------

@app.route("/api/test")
def test():

    return jsonify({
        "message": "Backend is working!",
        "status": "success"
    })


# --------------------------------------------------
# Weather API
# --------------------------------------------------

@app.route("/api/weather")
def get_weather():

    # Get city from URL
    # Example:
    # /api/weather?city=Mumbai

    city = request.args.get("city")

    # Check if city was provided
    if not city:

        return jsonify({
            "error": "Please provide a city"
        }), 400


    # --------------------------------------------------
    # OpenWeather API
    # --------------------------------------------------

    api_key = os.environ.get("OPENWEATHER_API_KEY")

    if not api_key:

        return jsonify({
            "error": "Weather API key is not configured"
        }), 500


    weather_url = "https://api.openweathermap.org/data/2.5/weather"

    weather_params = {

        "q": city,

        "appid": api_key,

        "units": "metric"

    }


    try:

        weather_response = requests.get(
            weather_url,
            params=weather_params,
            timeout=10
        )

        weather_response.raise_for_status()

        weather_data = weather_response.json()


    except requests.RequestException as error:

        print("WEATHER API ERROR:", repr(error), flush=True)

        return jsonify({
            "error": "Unable to get weather data"
        }), 500


    # --------------------------------------------------
    # Extract weather information
    # --------------------------------------------------

    temperature = weather_data["main"]["temp"]

    humidity = weather_data["main"]["humidity"]

    # OpenWeather gives wind speed in m/s.
    # Convert it to km/h.

    wind_speed = weather_data["wind"]["speed"] * 3.6

    condition = weather_data["weather"][0]["description"]

    city_name = weather_data["name"]

    country = weather_data["sys"]["country"]


    # --------------------------------------------------
    # Convert OpenWeather timestamp to local time
    # --------------------------------------------------

    from datetime import datetime, timezone, timedelta

    timezone_offset = weather_data["timezone"]

    local_time = datetime.fromtimestamp(
        weather_data["dt"],
        timezone.utc
    ) + timedelta(seconds=timezone_offset)


    # --------------------------------------------------
    # Send clean JSON to frontend
    # --------------------------------------------------

    return jsonify({

        "city": city_name,

        "country": country,

        "temperature": round(temperature, 1),

        "humidity": humidity,

        "wind_speed": round(wind_speed, 1),

        "condition": condition.title(),

        "local_time": local_time.strftime("%Y-%m-%d %H:%M")

    })
# --------------------------------------------------
# Start Flask server
# --------------------------------------------------
if __name__ == "__main__":
    

    port = int(os.environ.get("PORT", 5000))

    app.run(host="0.0.0.0", port=port)