export interface Location {
  id: string;
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export interface WindForecast {
  time: string;
  speed: number;
  direction: number;
  gust?: number;
}

export interface DayForecast {
  date: string;
  dayName: string;
  hours: WindForecast[];
}

export interface LocationWeather {
  location: Location;
  forecasts: DayForecast[];
}
