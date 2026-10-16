import { Sun, Moon, CloudSun, CloudMoon, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, CircleHelp } from 'lucide-react';
export function condition(code: number | null, night = false) {
  if (code === 0) return { label: 'Clear sky', Icon: night ? Moon : Sun };
  if (code === 1) return { label: 'Mainly clear', Icon: night ? CloudMoon : CloudSun };
  if (code === 2) return { label: 'Partly cloudy', Icon: night ? CloudMoon : CloudSun };
  if (code === 3) return { label: 'Overcast', Icon: Cloud };
  if (code === 45 || code === 48) return { label: code === 48 ? 'Rime fog' : 'Foggy', Icon: CloudFog };
  if (code !== null && [51, 53, 55, 56, 57].includes(code)) return { label: [56, 57].includes(code) ? 'Freezing drizzle' : 'Drizzle', Icon: CloudDrizzle };
  if (code !== null && [61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: [66, 67].includes(code) ? 'Freezing rain' : code >= 80 ? 'Rain showers' : 'Rainy', Icon: CloudRain };
  if (code !== null && [71, 73, 75, 77, 85, 86].includes(code)) return { label: code >= 85 ? 'Snow showers' : 'Snowy', Icon: CloudSnow };
  if (code !== null && [95, 96, 99].includes(code)) return { label: code === 95 ? 'Thunderstorm' : 'Thunderstorm with hail', Icon: CloudLightning };
  return { label: 'Conditions unavailable', Icon: CircleHelp };
}
