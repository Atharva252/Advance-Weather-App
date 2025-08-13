import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTemperatureHigh, FaWind, FaMusic, FaSearch, FaMapMarkerAlt, FaEye, FaTint, FaCalendarAlt } from "react-icons/fa";

// API keys
const openWeatherKey = "333f0ab5696d9026b439030e24d22256";
const jamendoKey = "f0bbfce4";

const WeatherApp = () => {
  const [city, setCity] = useState("");
  const [cityToSearch, setCityToSearch] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  // const [historicalData, setHistoricalData] = useState([]); // unused
  const [musicUrl, setMusicUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("current"); // current, forecast, history
  // const [showMusicPopup, setShowMusicPopup] = useState(false); // unused
  const [showWeatherPopup, setShowWeatherPopup] = useState(false);

  // Fetch current weather
  useEffect(() => {
    if (!cityToSearch) return;

    const fetchWeatherData = async () => {
      setLoading(true);
      setError("");
      setWeatherData(null);
      setForecastData(null);
      // setHistoricalData([]);

      try {
        // Geocode the city/place name
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityToSearch)}&limit=1&appid=${openWeatherKey}`;
        const geoRes = await axios.get(geoUrl);
        if (!geoRes.data || geoRes.data.length === 0) {
          setError("Place not found. Please enter a valid city name.");
          setLoading(false);
          return;
        }
        const { lat, lon, name, country, state } = geoRes.data[0];

        // Get current weather by lat/lon
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherKey}&units=metric`;
        const currentRes = await axios.get(currentUrl);
        // Attach resolved name/country/state for display
        currentRes.data.resolvedName = name;
        currentRes.data.resolvedCountry = country;
        currentRes.data.resolvedState = state;
        setWeatherData(currentRes.data);

        // Get 5-day forecast (3-hour intervals)
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${openWeatherKey}&units=metric`;
        const forecastRes = await axios.get(forecastUrl);
        setForecastData(forecastRes.data);
        // setHistoricalData([]); // No historical data on free plan
      } catch (err) {
        console.error("Error fetching weather data:", err);
        setError("City not found or API error");
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [cityToSearch]);

  // Fetch music based on weather
  useEffect(() => {
    const getMusicByWeather = async () => {
      if (!weatherData) return;

      let mood = "chill";
      const temp = weatherData.main.temp;
      const condition = weatherData.weather[0].main.toLowerCase();

      if (condition.includes("rain")) mood = "rainy day";
      else if (temp > 30) mood = "summer vibes";
      else if (temp < 15) mood = "cozy acoustic";

      try {
        const response = await axios.get(
          `https://api.jamendo.com/v3.0/tracks/?client_id=${jamendoKey}&format=json&limit=1&tags=${mood}&include=musicinfo`
        );
        if (response.data.results.length > 0) {
          setMusicUrl(response.data.results[0].audio);
        }
      } catch (err) {
        console.error("Error fetching music:", err);
      }
    };

    getMusicByWeather();
  }, [weatherData]);

  const handleSearch = () => {
    if (!city.trim()) {
      setError("Please enter a city name");
      return;
    }
    setError("");
    setCityToSearch(city.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getWeatherIcon = (condition) => {
    const icons = {
      clear: "☀️",
      clouds: "☁️",
      rain: "🌧️",
      drizzle: "🌦️",
      thunderstorm: "⛈️",
      snow: "❄️",
      mist: "🌫️",
      fog: "🌫️",
      haze: "🌫️"
    };
    return icons[condition.toLowerCase()] || "🌤️";
  };

  const getBackgroundGradient = (condition) => {
    const gradients = {
      clear: "from-yellow-400 via-orange-500 to-red-500",
      clouds: "from-gray-400 via-gray-500 to-gray-600",
      rain: "from-blue-600 via-blue-700 to-indigo-800",
      drizzle: "from-blue-400 via-blue-500 to-blue-600",
      thunderstorm: "from-gray-800 via-gray-900 to-black",
      snow: "from-blue-100 via-blue-200 to-blue-300",
      mist: "from-gray-300 via-gray-400 to-gray-500"
    };
    return gradients[condition?.toLowerCase()] || "from-blue-400 via-purple-500 to-indigo-600";
  };

  // Card background for forecast, based on weather and temperature
  const getCardBg = (weather, temp) => {
    if (weather.includes("rain")) return "bg-blue-400/80";
    if (weather.includes("cloud")) return "bg-gray-400/80";
    if (weather.includes("clear") && temp > 30) return "bg-yellow-400/80";
    if (weather.includes("clear")) return "bg-blue-200/80";
    if (weather.includes("snow")) return "bg-blue-100/80";
    if (temp > 35) return "bg-red-400/80";
    if (temp < 10) return "bg-indigo-300/80";
    return "bg-white/20";
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // const formatDateFull = (date) => {
  //   return date.toLocaleDateString('en-US', { 
  //     weekday: 'long', 
  //     year: 'numeric',
  //     month: 'long', 
  //     day: 'numeric' 
  //   });
  // };

  // Determine background for outside the card
  let outerBg = "bg-gradient-to-br from-gray-200 to-gray-400";
  if (weatherData) {
    outerBg = getCardBg(weatherData.weather[0].main.toLowerCase(), weatherData.main.temp);
  } else if (forecastData && forecastData.list && forecastData.list.length > 0) {
    const first = forecastData.list[0];
    outerBg = getCardBg(first.weather[0].main.toLowerCase(), first.main.temp);
  }

  return (
    <div className={`min-h-screen w-screen flex items-center justify-center transition-all duration-1000 overflow-auto ${outerBg}`}> 
      <div className="w-full max-w-2xl flex flex-col items-center justify-center p-4">
        {/* Main Card */}
        <div className={`w-full rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col transition-all duration-1000 bg-gradient-to-br ${weatherData ? getBackgroundGradient(weatherData.weather[0].main) : 'from-blue-400 via-purple-500 to-indigo-600'}`}>
          {/* Header */}
          <div className="bg-white/20 backdrop-blur-sm p-4 sm:p-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
              🌦️ Weather & Mood
            </h1>
            <p className="text-white/80 text-xs sm:text-sm">Discover weather trends and matching music</p>
          </div>

          {/* Search Section */}
          <div className="p-4 sm:p-6">
            <div className="relative">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter city name..."
                className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 sm:p-3 text-white transition-all duration-300 disabled:opacity-50"
              >
                <FaSearch className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
                <p className="text-white/90">Loading weather data...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl p-4 text-center">
                <p className="text-red-100">{error}</p>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          {weatherData && (
            <div className="px-4 sm:px-6">
              <div className="flex bg-white/10 backdrop-blur-sm rounded-2xl p-1">
                <button
                  onClick={() => setActiveTab("current")}
                  className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === "current" 
                      ? "bg-white/20 text-white shadow-lg" 
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Current
                </button>
                <button
                  onClick={() => setActiveTab("forecast")}
                  className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === "forecast" 
                      ? "bg-white/20 text-white shadow-lg" 
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  5-Day Forecast
                </button>
              </div>
            </div>
          )}

          {/* Current Weather Display */}
          {weatherData && activeTab === "current" && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-4 sm:pt-4 space-y-4">
              {/* City and Temperature */}
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FaMapMarkerAlt className="text-white/80" />
                  <h2 className="text-xl sm:text-2xl font-bold text-white">{weatherData.resolvedName || weatherData.name}{weatherData.resolvedState ? `, ${weatherData.resolvedState}` : ""}{weatherData.resolvedCountry ? `, ${weatherData.resolvedCountry}` : ""}</h2>
                </div>
                <div className="text-4xl sm:text-6xl mb-2">{getWeatherIcon(weatherData.weather[0].main)}</div>
                <div className="text-3xl sm:text-5xl font-bold text-white mb-2">
                  {Math.round(weatherData.main.temp)}°C
                </div>
                <p className="text-white/80 text-base sm:text-lg capitalize">
                  {weatherData.weather[0].description}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 justify-center mt-4">
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold shadow"
                  onClick={() => setShowWeatherPopup(true)}
                >
                  Show Weather Details
                </button>
              </div>

              {/* Weather Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FaWind className="text-white/80 text-xl" />
                    <span className="text-white/80 text-sm font-medium">Wind Speed</span>
                  </div>
                  <p className="text-white text-xl font-bold">{weatherData.wind.speed} m/s</p>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FaTint className="text-white/80 text-xl" />
                    <span className="text-white/80 text-sm font-medium">Humidity</span>
                  </div>
                  <p className="text-white text-xl font-bold">{weatherData.main.humidity}%</p>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FaEye className="text-white/80 text-xl" />
                    <span className="text-white/80 text-sm font-medium">Visibility</span>
                  </div>
                  <p className="text-white text-xl font-bold">{(weatherData.visibility / 1000).toFixed(1)} km</p>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FaTemperatureHigh className="text-white/80 text-xl" />
                    <span className="text-white/80 text-sm font-medium">Feels Like</span>
                  </div>
                  <p className="text-white text-xl font-bold">{Math.round(weatherData.main.feels_like)}°C</p>
                </div>
              </div>

              {/* Weather Popup */}
              {showWeatherPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative">
                    <button className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl" onClick={() => setShowWeatherPopup(false)}>&times;</button>
                    <h2 className="text-2xl font-bold mb-4 text-center">Weather Details</h2>
                    <div className="space-y-2 text-gray-800">
                      <div><strong>City:</strong> {weatherData.resolvedName || weatherData.name}{weatherData.resolvedState ? `, ${weatherData.resolvedState}` : ""}{weatherData.resolvedCountry ? `, ${weatherData.resolvedCountry}` : ""}</div>
                      <div><strong>Temperature:</strong> {Math.round(weatherData.main.temp)}°C</div>
                      <div><strong>Condition:</strong> {weatherData.weather[0].description}</div>
                      <div><strong>Feels Like:</strong> {Math.round(weatherData.main.feels_like)}°C</div>
                      <div><strong>Humidity:</strong> {weatherData.main.humidity}%</div>
                      <div><strong>Wind Speed:</strong> {weatherData.wind.speed} m/s</div>
                      <div><strong>Visibility:</strong> {(weatherData.visibility / 1000).toFixed(1)} km</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Music Popup as notification (auto show, top left) */}
              {musicUrl && (
                <div className="fixed top-6 left-6 z-50 flex flex-col items-start">
                  <div className="bg-white rounded-xl shadow-2xl p-4 w-80 max-w-full relative flex flex-col items-center border border-gray-200 animate-fade-in">
                    <button className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl" onClick={() => setMusicUrl("")}>&times;</button>
                    <div className="flex items-center gap-2 mb-2">
                      <FaMusic className="text-pink-600 text-xl" />
                      <h2 className="text-lg font-bold">Mood Music</h2>
                    </div>
                    <audio className="w-full" controls autoPlay src={musicUrl} style={{ borderRadius: '8px' }} />
                    <p className="text-gray-700 text-xs text-center mt-2">Music selected based on current weather conditions</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5-Day Forecast (3-hour intervals, grouped by day) */}
          {forecastData && activeTab === "forecast" && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-4 sm:pt-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6">
                <h3 className="text-white font-bold text-lg sm:text-xl mb-4 flex items-center gap-2">
                  <FaCalendarAlt />
                  5-Day Forecast
                </h3>
                <div className="space-y-3">
                  {(() => {
                    // Group forecast list by day
                    const days = {};
                    forecastData.list.forEach(item => {
                      // Use UTC date for grouping to avoid timezone issues
                      const date = new Date(item.dt * 1000);
                      const dayKey = date.getUTCFullYear() + '-' + (date.getUTCMonth()+1).toString().padStart(2, '0') + '-' + date.getUTCDate().toString().padStart(2, '0');
                      if (!days[dayKey]) days[dayKey] = [];
                      days[dayKey].push(item);
                    });
                    // Get last 5 days in chronological order
                    const dayEntries = Object.entries(days);
                    const last5 = dayEntries.slice(-5);
                    // Get current UTC date for correct "Today" label
                    const nowUTC = new Date();
                    const nowDayKey = nowUTC.getUTCFullYear() + '-' + (nowUTC.getUTCMonth()+1).toString().padStart(2, '0') + '-' + nowUTC.getUTCDate().toString().padStart(2, '0');
                    return last5.map(([dayKey, items]) => {
                      // Format the UTC date for display
                      const [year, month, day] = dayKey.split('-');
                      const displayDate = new Date(Date.UTC(year, month-1, day)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                      const isToday = dayKey === nowDayKey;
                      // For today, only use forecast intervals in the future (UTC)
                      let filteredItems = items;
                      if (isToday) {
                        const now = new Date();
                        filteredItems = items.filter(i => (i.dt * 1000) >= now.getTime());
                        // If all intervals are in the past (late at night), fallback to all items
                        if (filteredItems.length === 0) filteredItems = items;
                      }
                      // Use the first item of the day for icon/desc, and min/max for temps
                      const minTemp = Math.min(...filteredItems.map(i => i.main.temp_min));
                      const maxTemp = Math.max(...filteredItems.map(i => i.main.temp_max));
                      const avgTemp = filteredItems.reduce((sum, i) => sum + i.main.temp, 0) / filteredItems.length;
                      const humidity = Math.round(filteredItems.reduce((sum, i) => sum + i.main.humidity, 0) / filteredItems.length);
                      const weather = filteredItems[0].weather[0];
                      const cardBg = getCardBg(weather.main.toLowerCase(), avgTemp);
                      return (
                        <div key={dayKey} className={`rounded-xl p-4 flex items-center justify-between ${cardBg}`}>
                          <div className="flex items-center gap-4">
                            <div className="text-xl sm:text-2xl">{getWeatherIcon(weather.main)}</div>
                            <div>
                              <p className="text-white font-medium">
                                {isToday ? "Today (Forecast)" : displayDate}
                              </p>
                              <p className="text-white/70 text-sm capitalize">{weather.description}</p>
                              {isToday && <p className="text-white/60 text-xs">Forecast for the rest of today</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold text-base sm:text-lg">
                              {Math.round(maxTemp)}° / {Math.round(minTemp)}°
                            </p>
                            <p className="text-white/70 text-xs sm:text-sm">{humidity}% humidity</p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Music Player */}
          {musicUrl && activeTab === "current" && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <FaMusic className="text-white/80 text-xl" />
                  <h3 className="text-white font-semibold text-lg">Mood Music</h3>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <audio 
                    className="w-full" 
                    controls 
                    src={musicUrl}
                    style={{
                      filter: 'invert(1) hue-rotate(180deg)',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                <p className="text-white/70 text-xs sm:text-sm text-center mt-3">
                  Music selected based on current weather conditions
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-white/60 text-xs sm:text-sm">
            Weather data from OpenWeatherMap • Music from Jamendo
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeatherApp;
