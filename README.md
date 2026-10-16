# weather-forecast-app

A responsive weather portfolio project built with Vite, React, strict TypeScript, Tailwind CSS, and lucide-react. No backend, keys, maps, browser geolocation, authentication, or database.

## Run locally

Use Node.js 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` checks TypeScript and creates `dist/`; `npm run preview` serves the production build. `npm run typecheck` checks types separately. The lockfile supports reproducible installs with `npm ci`. Deploy `dist/` to any static host; configure Vite's `base` if hosting under a subdirectory.

## Features

- Clearly labelled predefined Istanbul sample location; conditions always come from the API, never mock data.
- Submit a city name, then select a match distinguished by region and country. Native buttons support keyboard navigation with Tab and Enter.
- Current and apparent temperature, WMO condition icon/description, humidity, and wind speed in km/h.
- Next five calendar days, **excluding today**, with daily high/low and conditions.
- Celsius/Fahrenheit switching converts all temperatures locally with `F = C × 9/5 + 32`.
- Loading, timeout, retry, no-results, missing-field, and partial-forecast states; manual refresh and last-successful-fetch time.
- Responsive layout, labelled form, live status announcements, visible focus, reduced-motion support.

## API endpoints

Geocoding: `https://geocoding-api.open-meteo.com/v1/search`

Parameters: `name=<query>&count=8&language=en&format=json`.

Forecast: `https://api.open-meteo.com/v1/forecast`

Parameters: `latitude=<lat>&longitude=<lon>&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&timeformat=unixtime&temperature_unit=celsius&wind_speed_unit=kmh&forecast_days=6`.

`src/lib/weather.ts` owns fetching, runtime validation, transformation, and formatting. Unix timestamps are interpreted using the returned IANA `timezone`; daily date keys retain the location's calendar date regardless of the browser timezone. `src/lib/conditions.ts` maps all documented WMO codes; unknown codes have an explicit fallback. `src/App.tsx` owns UI and request lifecycle. Both searches and forecast requests use AbortController, ignore cancelled responses, and time out after 15 seconds. Changing the city clears previous readings. Missing numeric fields display an em dash; no readings are fabricated or cached as live data.

## Data, terms, and limitations

Data from [Open-Meteo](https://open-meteo.com/), under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See [forecast documentation](https://open-meteo.com/en/docs), [geocoding documentation](https://open-meteo.com/en/docs/geocoding-api), and [current terms](https://open-meteo.com/en/terms).

Terms checked October 16, 2026: the free API is for non-commercial use, with fewer than 10,000 requests/day, 5,000/hour, and 600/minute. Recheck terms before publishing, particularly for promotional/commercial portfolio use. No paid services are integrated.

Weather values are model estimates, not guaranteed station observations. Accuracy and availability are not guaranteed. Requests go directly from the browser to Open-Meteo and need network access and provider CORS support. Rate limiting, offline operation, or provider failures show errors without fallback conditions. Search is explicitly submitted to reduce requests. There is no auto-polling or offline cache. Wind remains in km/h for both temperature units. Updated time denotes successful retrieval; the current card separately shows the API's weather timestamp. Forecast data may be partial. React development StrictMode may start and cancel an extra initial request. No automated tests are included, as requested.

## Screenshot

<!-- Screenshot placeholder: add a desktop/mobile capture at docs/screenshot.png after running the app. -->

<img width="1899" height="906" alt="image" src="https://github.com/user-attachments/assets/f60b2fe1-8596-4cd2-8b74-45b6c332b6e9" />

