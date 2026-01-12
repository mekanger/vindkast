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
  seaCurrentSpeed?: number;  // cm/s
  seaCurrentDirection?: number;
}

export interface DayForecast {
  date: string;
  forecasts: WindForecast[];
}

export interface LocationWeather {
  location: Location;
  days: DayForecast[];
}
