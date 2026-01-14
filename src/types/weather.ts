export interface Location {
  id: string;
  name: string;
  region?: string;
  country?: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

export interface WindForecast {
  hour: number;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  temperature?: number;  // Celsius
  symbolCode?: string;   // Yr weather symbol code (e.g. "clearsky_day", "cloudy")
  seaCurrentSpeed?: number;  // cm/s
  seaCurrentDirection?: number;
  waveHeight?: number;  // meters
  waveDirection?: number;
  tidalHeight?: number;  // cm relative to chart datum
}

export interface TidalExtreme {
  time: string;  // HH:mm format
  type: 'high' | 'low';
  height: number;  // cm
}

export interface DayForecast {
  date: string;
  forecasts: WindForecast[];
  sunrise?: string;  // ISO time string
  sunset?: string;   // ISO time string
  tidalExtremes?: TidalExtreme[];  // High/low tide times between 08:00-20:00
}

export interface LocationWeather {
  location: Location;
  days: DayForecast[];
}
