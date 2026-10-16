export interface City { id: number; name: string; country: string; region: string; latitude: number; longitude: number }
export interface Day { date: string; high: number | null; low: number | null; code: number | null }
export interface Weather { timezone: string; updated: Date; observed: number | null; temperature: number | null; apparent: number | null; humidity: number | null; wind: number | null; code: number | null; night: boolean; days: Day[] }
export const ISTANBUL: City = { id: 745044, name: 'Istanbul', country: 'Türkiye', region: 'Istanbul', latitude: 41.0138, longitude: 28.9497 };
const record = (value: unknown): Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
const numeric = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;
const string = (value: unknown): string => typeof value === 'string' ? value : '';
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
async function request(url: URL, signal: AbortSignal): Promise<Record<string, unknown>> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(response.status === 429 ? 'Too many requests. Please wait a moment and try again.' : 'The weather service is unavailable. Please try again.');
  const data = record(await response.json());
  if (data.error) throw new Error('The weather service could not complete this request.');
  return data;
}
export async function searchCities(query: string, signal: AbortSignal): Promise<City[]> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search = new URLSearchParams({ name: query, count: '8', language: 'en', format: 'json' }).toString();
  const data = await request(url, signal);
  return array(data.results).flatMap(value => {
    const item = record(value); const latitude = numeric(item.latitude); const longitude = numeric(item.longitude); const id = numeric(item.id);
    return latitude === null || longitude === null || id === null || !string(item.name) ? [] : [{ id, name: string(item.name), country: string(item.country) || string(item.country_code) || 'Country unavailable', region: string(item.admin1), latitude, longitude }];
  });
}
export async function fetchWeather(city: City, signal: AbortSignal): Promise<Weather> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({ latitude: String(city.latitude), longitude: String(city.longitude), current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m', daily: 'weather_code,temperature_2m_max,temperature_2m_min', timezone: 'auto', timeformat: 'unixtime', temperature_unit: 'celsius', wind_speed_unit: 'kmh', forecast_days: '6' }).toString();
  const data = await request(url, signal); const current = record(data.current); const daily = record(data.daily);
  const timezone = string(data.timezone);
  try { new Intl.DateTimeFormat('en', { timeZone: timezone }).format(); } catch { throw new Error('The service returned an invalid location timezone. Please retry.'); }
  if (!timezone) throw new Error('The service did not return a location timezone.');
  const updated = new Date();
  const today = dateKey(updated, timezone);
  const days = array(daily.time).flatMap((time, index) => {
    const seconds = numeric(time); if (seconds === null) return [];
    const date = dateKey(new Date(seconds * 1000), timezone);
    return date <= today ? [] : [{ date, high: numeric(array(daily.temperature_2m_max)[index]), low: numeric(array(daily.temperature_2m_min)[index]), code: numeric(array(daily.weather_code)[index]) }];
  }).slice(0, 5);
  return { timezone, updated, observed: numeric(current.time), temperature: numeric(current.temperature_2m), apparent: numeric(current.apparent_temperature), humidity: bounded(current.relative_humidity_2m, 0, 100), wind: bounded(current.wind_speed_10m, 0, Infinity), code: numeric(current.weather_code), night: current.is_day === 0, days };
}
function bounded(value: unknown, min: number, max: number) { const n = numeric(value); return n !== null && n >= min && n <= max ? n : null; }
function dateKey(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-');
}
export function temperature(value: number | null, unit: 'C' | 'F'): string { return value === null ? '—' : `${Math.round(unit === 'F' ? value * 9 / 5 + 32 : value)}°`; }
export function localTime(date: Date, timezone: string): string { return new Intl.DateTimeFormat('en', { timeZone: timezone, hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(date); }
