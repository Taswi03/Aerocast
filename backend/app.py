from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)

# Allow our frontend to communicate with the Flask backend
CORS(app)


# --------------------------------------------------
# Convert Open-Meteo weather codes into descriptions
# --------------------------------------------------

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
    # STEP 1: Find latitude and longitude of the city
    # --------------------------------------------------

    geocoding_url = "https://geocoding-api.open-meteo.com/v1/search"

    geocoding_params = {
        "name": city,
        "count": 1,
        "language": "en",
        "format": "json"
    }


    try:

        geocoding_response = requests.get(
            geocoding_url,
            params=geocoding_params,
            timeout=10
        )

        geocoding_response.raise_for_status()

        geocoding_data = geocoding_response.json()


    except requests.RequestException:

        return jsonify({
            "error": "Unable to connect to location service"
        }), 500


    # --------------------------------------------------
    # Check if city exists
    # --------------------------------------------------

    if "results" not in geocoding_data:

        return jsonify({
            "error": "City not found"
        }), 404


    location = geocoding_data["results"][0]

    latitude = location["latitude"]
    longitude = location["longitude"]


    # --------------------------------------------------
    # STEP 2: Get weather using latitude & longitude
    # --------------------------------------------------

    weather_url = "https://api.open-meteo.com/v1/forecast"

    weather_params = {

        "latitude": latitude,

        "longitude": longitude,

        "current": (
            "temperature_2m,"
            "relative_humidity_2m,"
            "wind_speed_10m,"
            "weather_code"
        ),

        "timezone": "auto"
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
            "error": "Unable to get weather data",
            "details": repr(error)
        }), 500


 

    current_weather = weather_data["current"]

    temperature = current_weather["temperature_2m"]

    humidity = current_weather["relative_humidity_2m"]

    wind_speed = current_weather["wind_speed_10m"]

    weather_code = current_weather["weather_code"]


    # Convert weather code into readable condition
    condition = get_weather_condition(weather_code)


    # --------------------------------------------------
    # STEP 4: Send clean JSON to frontend
    # --------------------------------------------------

    return jsonify({

    "city": location["name"],

    "country": location.get("country"),

    "temperature": temperature,

    "humidity": humidity,

    "wind_speed": wind_speed,

    "condition": condition,

    "local_time": current_weather["time"]

})


# --------------------------------------------------
# Start Flask server
# --------------------------------------------------
if __name__ == "__main__":
    import os

    port = int(os.environ.get("PORT", 5000))

    app.run(host="0.0.0.0", port=port)