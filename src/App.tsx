import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, CloudSun, Droplets, MapPin, RefreshCw, Search, Wind, Thermometer, AlertCircle, LoaderCircle } from 'lucide-react';
import { fetchWeather, ISTANBUL, localTime, searchCities, temperature } from './lib/weather';
import type { City, Weather } from './lib/weather';
import { condition } from './lib/conditions';

export default function App() {
  const [city, setCity] = useState<City>(ISTANBUL);
  const [sample, setSample] = useState(true);
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<City[]>([]);
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [searchError, setSearchError] = useState('');
  const searchController = useRef<AbortController | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => () => searchController.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    setWeather(null); setLoading(true); setError('');
    const timeout = window.setTimeout(() => { controller.abort(); setLoading(false); setError('The request took too long. Please try again.'); }, 15000);
    fetchWeather(city, controller.signal).then(data => { if (!controller.signal.aborted) setWeather(data); }).catch((err: unknown) => {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Could not load weather. Please try again.');
    }).finally(() => { clearTimeout(timeout); if (!controller.signal.aborted) setLoading(false); });
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [city, refresh]);
  async function search(event: FormEvent) {
    event.preventDefault(); searchController.current?.abort();
    if (query.trim().length < 2) { setSearchError('Enter at least two characters to search.'); setSearchState('error'); return; }
    const controller = new AbortController(); searchController.current = controller;
    setSearchState('loading'); setMatches([]);
    const timeout = window.setTimeout(() => { controller.abort(); setSearchError('Search timed out. Please try again.'); setSearchState('error'); }, 15000);
    try { const results = await searchCities(query.trim(), controller.signal); if (!controller.signal.aborted) { setMatches(results); setSearchState('done'); } }
    catch (err: unknown) { if (!controller.signal.aborted) { setSearchError(err instanceof Error ? err.message : 'City search is unavailable.'); setSearchState('error'); } }
    finally { clearTimeout(timeout); }
  }
  function choose(match: City) {
    searchController.current?.abort(); setCity(match); setSample(false); setSearchState('idle'); setQuery(''); setWeather(null); setLoading(true); setError(''); heading.current?.focus();
  }
  const current = condition(weather?.code ?? null, weather?.night);
  const hasCurrent = weather && [weather.temperature, weather.apparent, weather.humidity, weather.wind, weather.code].some(value => value !== null);
  return <div className="app-shell">
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6">
      <a href="./" className="brand flex items-center gap-2.5" aria-label="Weatherly home"><span className="brand-icon"><CloudSun size={23} /></span>weatherly<span className="text-blue-600">.</span></a>
      <span className="text-xs text-slate-500 sm:text-sm">A little clarity for your day.</span>
    </header>
    <main>
      <section className="intro"><p className="eyebrow">YOUR EVERYDAY WEATHER COMPANION</p><h1>A world of weather.<br /><span>A clearer outlook.</span></h1><p className="intro-copy">From your morning plans to your next escape.<br className="sm:hidden" /> Find the forecast that follows you.</p></section>
      <section className="search-section" aria-label="Find a city">
        <form onSubmit={search} className="search-form">
          <Search aria-hidden="true" size={21} className="text-slate-400 shrink-0" />
          <label htmlFor="city-search" className="sr-only">Search city by name</label>
          <input id="city-search" value={query} onChange={event => { searchController.current?.abort(); setQuery(event.target.value); setSearchState('idle'); }} placeholder="Search for a city…" autoComplete="off" aria-describedby="search-hint" maxLength={120} />
          <button className="search-button" type="submit">Search <ArrowRight size={17} aria-hidden="true" /></button>
        </form>
        <p id="search-hint" className="mt-2.5 text-xs text-slate-500">Search by city name, then choose a location below.</p>
        <div aria-live="polite" className="search-feedback">
          {searchState === 'loading' && <p className="flex items-center gap-2"><LoaderCircle className="animate-spin" size={16} /> Finding cities…</p>}
          {searchState === 'error' && <p role="alert">{searchError}</p>}
          {searchState === 'done' && (matches.length ? <><p className="mb-2 text-xs">{matches.length} locations found. Choose your city:</p><ul className="results">{matches.map(match => <li key={match.id}><button onClick={() => choose(match)}><MapPin size={18} aria-hidden="true" /><span><strong>{match.name}</strong><small>{[match.region, match.country].filter(Boolean).join(', ')}</small></span><ArrowUpRight size={17} aria-hidden="true" /></button></li>)}</ul></> : <p>No cities found. Try a different spelling or a nearby city.</p>)}
        </div>
      </section>
      <section aria-labelledby="location-heading" className="weather-section">
        <div className="location-row"><div><div className="flex flex-wrap items-center gap-2.5"><MapPin size={20} className="text-blue-600" aria-hidden="true" /><h2 id="location-heading" ref={heading} tabIndex={-1}>{city.name}, <span>{city.country}</span></h2>{sample && <span className="sample-badge">Sample city</span>}</div><p className="mt-2 text-xs text-slate-500">{sample ? 'Predefined location · Live API data when available' : city.region || 'Selected location'}</p></div>
          <div className="unit-toggle" role="group" aria-label="Temperature unit">{(['C', 'F'] as const).map(value => <button key={value} aria-pressed={unit === value} aria-label={value === 'C' ? 'Celsius' : 'Fahrenheit'} className={unit === value ? 'selected' : ''} onClick={() => setUnit(value)}>°{value}</button>)}</div>
        </div>
        {loading && <div className="status-panel" role="status"><LoaderCircle size={30} className="animate-spin text-blue-600" /><h3>Looking at the skies…</h3><p>Getting the latest forecast for {city.name}.</p></div>}
        {error && <div className="status-panel" role="alert"><AlertCircle size={30} className="text-blue-600" /><h3>Weather is taking a rain check.</h3><p>{error}</p><button className="retry-button" onClick={() => setRefresh(value => value + 1)}><RefreshCw size={16} /> Try again</button></div>}
        {!loading && !error && weather && <>
          <div className="current-grid">
            <article className="current-card"><div className="flex items-center justify-between"><p className="eyebrow">CURRENT WEATHER</p><span className="current-label">{weather.observed === null ? 'Time unavailable' : localTime(new Date(weather.observed * 1000), weather.timezone)}</span></div>
              <div className="current-body"><div><p className="hero-temp">{temperature(weather.temperature, unit)}<span>{unit}</span></p><p className="condition">{hasCurrent ? current.label : 'Current weather unavailable'}</p></div><current.Icon className="hero-icon" strokeWidth={1.25} aria-hidden="true" /></div>
              <p className="current-bottom">{weather.night ? 'The evening outlook' : 'Your day, at a glance'}<span>Feels like {temperature(weather.apparent, unit)}</span></p>
            </article>
            <div className="details-grid">
              <article className="detail-card"><span className="metric-icon"><Thermometer size={21} /></span><p>Feels like</p><strong>{temperature(weather.apparent, unit)}<small>{unit}</small></strong><span>Apparent temperature</span></article>
              <article className="detail-card"><span className="metric-icon"><Droplets size={21} /></span><p>Humidity</p><strong>{weather.humidity ?? '—'}<small>%</small></strong><span>Relative humidity</span></article>
              <article className="detail-card wind-card"><span className="metric-icon"><Wind size={21} /></span><div><p>Wind speed</p><strong>{weather.wind === null ? '—' : Math.round(weather.wind)}<small>km/h</small></strong></div><span>At 10 m above ground</span></article>
            </div>
          </div>
          <div className="forecast-heading"><h3>The next 5 days</h3><span>Make a little room for the weather.</span></div>
          {weather.days.length ? <div className="forecast-grid">{weather.days.map(day => { const detail = condition(day.code); const date = new Date(`${day.date}T12:00:00Z`); return <article key={day.date} className="forecast-card"><h4>{new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'UTC' }).format(date)}</h4><time dateTime={day.date}>{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date)}</time><detail.Icon size={39} strokeWidth={1.5} aria-hidden="true" /><p className="daily-condition">{detail.label}</p><p className="daily-temperatures"><strong aria-label={`High ${temperature(day.high, unit)} ${unit}`}>{temperature(day.high, unit)}</strong><span aria-label={`Low ${temperature(day.low, unit)} ${unit}`}>{temperature(day.low, unit)}</span></p><p className="high-low">HIGH <span>LOW</span></p></article>; })}</div> : <p className="empty-forecast">The daily forecast is currently unavailable.</p>}
          {weather.days.length > 0 && weather.days.length < 5 && <p className="mt-3 text-sm text-slate-500">Only {weather.days.length} forecast days were returned by the service.</p>}
          <div className="update-row"><p>Updated {localTime(weather.updated, weather.timezone)} <span>· {weather.timezone}</span></p><button onClick={() => setRefresh(value => value + 1)}><RefreshCw size={13} aria-hidden="true" /> Refresh</button></div>
        </>}
      </section>
    </main>
    <footer><span className="flex items-center gap-2"><CloudSun size={17} aria-hidden="true" /> Wherever you go, go prepared.</span><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Data from Open-Meteo <ArrowUpRight size={13} aria-hidden="true" /></a></footer>
  </div>;
}
