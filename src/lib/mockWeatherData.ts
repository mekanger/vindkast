import type { Location, DayForecast, LocationWeather } from "@/types/weather";

const HOURS = ["10:00", "12:00", "14:00", "16:00"];

const getDayName = (date: Date): string => {
  const days = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
  return days[date.getDay()];
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
};

const generateRandomWind = (): { speed: number; direction: number; gust: number } => {
  const baseSpeed = Math.random() * 12 + 2;
  return {
    speed: Math.round(baseSpeed * 10) / 10,
    direction: Math.floor(Math.random() * 360),
    gust: Math.round((baseSpeed + Math.random() * 5) * 10) / 10,
  };
};

export const generateMockWeatherData = (location: Location): LocationWeather => {
  const forecasts: DayForecast[] = [];
  const today = new Date();
  
  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    forecasts.push({
      date: formatDate(date),
      dayName: i === 0 ? "I dag" : i === 1 ? "I morgen" : getDayName(date),
      hours: HOURS.map(time => ({
        time,
        ...generateRandomWind(),
      })),
    });
  }
  
  return {
    location,
    forecasts,
  };
};
