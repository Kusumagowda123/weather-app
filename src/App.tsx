import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function App() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [weather, setWeather] = useState(null);
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Weather code → emoji + text
  const weatherCodeToIcon = (code) => {
    if (code === 0) return { icon: "☀️", text: "Clear" };
    if ([1, 2, 3].includes(code)) return { icon: "⛅", text: "Partly Cloudy" };
    if ([45, 48].includes(code)) return { icon: "🌫️", text: "Fog" };
    if (code >= 51 && code <= 67) return { icon: "🌧️", text: "Rain" };
    if (code >= 71 && code <= 77) return { icon: "❄️", text: "Snow" };
    if (code >= 80 && code <= 82) return { icon: "🌦️", text: "Showers" };
    if (code >= 95) return { icon: "⛈️", text: "Storm" };
    return { icon: "❓", text: "Unknown" };
  };

  // Fetch city suggestions
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          query
        )}&count=5&language=en&format=json`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("Geocoding failed");
        const data = await res.json();
        setSuggestions(data.results || []);
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  // Fetch weather for a place
  const fetchWeatherFor = async (place) => {
    try {
      setLoading(true);
      setError("");
      setWeather(null);
      setDaily(null);

      const lat = place.latitude;
      const lon = place.longitude;

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather API failed");
      const data = await res.json();

      setWeather(data.current);
      setDaily(data.daily);
      setSelectedPlace(place);
    } catch (err) {
      console.error(err);
      setError("Could not fetch weather");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <motion.div
        className="card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          WeatherNow 🌍
        </motion.h1>

        {/* Search */}
        <div className="searchRow">
          <motion.input
            placeholder="Search city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              suggestions[0] &&
              fetchWeatherFor(suggestions[0])
            }
            whileFocus={{ scale: 1.02 }}
          />
          <motion.button
            onClick={() => suggestions[0] && fetchWeatherFor(suggestions[0])}
            whileHover={{ scale: 1.05 }}
            disabled={loading}
          >
            {loading ? "Loading..." : "Get Weather"}
          </motion.button>
        </div>

        {/* Suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              className="suggestions"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {suggestions.map((s) => (
                <motion.div
                  key={`${s.latitude}-${s.longitude}`}
                  onClick={() => {
                    setQuery(`${s.name}, ${s.country || ""}`);
                    setSuggestions([]);
                    fetchWeatherFor(s);
                  }}
                  whileHover={{ backgroundColor: "#f0f4ff" }}
                >
                  {s.name} {s.country && `(${s.country})`}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            className="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        {/* Weather card */}
        {weather && selectedPlace && (
          <motion.div
            className="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2>
              {selectedPlace.name}, {selectedPlace.country}
            </h2>
            <motion.div
              className="currentBox"
              animate={{ rotate: [0, 2, -2, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <div style={{ fontSize: 50 }}>
                {weatherCodeToIcon(weather.weathercode).icon}
              </div>
              <div style={{ fontSize: 26 }}>
                {Math.round(weather.temperature_2m)}°C
              </div>
              <div>{weatherCodeToIcon(weather.weathercode).text}</div>
              <div style={{ fontSize: 14, color: "#555" }}>
                Wind: {weather.windspeed_10m} m/s
              </div>
            </motion.div>

            {/* 7-day forecast */}
            {daily && (
              <div className="forecast">
                {daily.time.map((d, i) => (
                  <motion.div
                    key={d}
                    className="dayCard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div>
                      {new Date(d).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </div>
                    <div style={{ fontSize: 24 }}>
                      {weatherCodeToIcon(daily.weathercode[i]).icon}
                    </div>
                    <div>
                      {Math.round(daily.temperature_2m_min[i])}° /{" "}
                      {Math.round(daily.temperature_2m_max[i])}°
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      <style>{`
        body, html { margin: 0; font-family: Inter, sans-serif; background: linear-gradient(180deg,#89f7fe,#66a6ff); }
        .app { display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
        .card { background: rgba(255,255,255,0.9); border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); padding: 24px; width: 100%; max-width: 720px; }
        .searchRow { display: flex; gap: 8px; margin: 12px 0; }
        input { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #e6e9ef; font-size: 14px; outline: none; }
        button { padding: 10px 14px; border-radius: 8px; border: none; background: #2563eb; color: #fff; cursor: pointer; }
        .suggestions { border: 1px solid #eef2ff; border-radius: 8px; overflow: hidden; margin-top: 4px; }
        .suggestions div { padding: 10px; cursor: pointer; }
        .error { color: #b91c1c; background: #ffe5e5; padding: 10px; border-radius: 8px; margin-top: 8px; }
        .result { margin-top: 16px; text-align: center; }
        .currentBox { margin: 16px auto; padding: 16px; background: #f0f4ff; border-radius: 12px; max-width: 200px; }
        .forecast { margin-top: 16px; display: flex; justify-content: space-around; gap: 12px; flex-wrap: wrap; }
        .dayCard { background: #fff; padding: 10px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); width: 90px; }
      `}</style>
    </div>
  );
}
