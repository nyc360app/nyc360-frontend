import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private http = inject(HttpClient);

  getWeather(lat?: number, lon?: number): Observable<any> {
    // Default to NYC coordinates if none provided
    const latitude = lat ?? 40.7128;
    const longitude = lon ?? -74.0060;

    // Open-Meteo Free API
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,is_day&timezone=auto`;

    return this.http.get(url).pipe(
      map((response: any) => {
        const current = response.current;
        const weatherInfo = this.getWeatherInfo(current.weather_code, current.is_day === 1);

        return {
          tempC: current.temperature_2m, // Return Celsius by default
          humidity: current.relative_humidity_2m,
          desc: weatherInfo.description,
          icon: weatherInfo.icon
        };
      }),
      catchError(err => {
        console.error('Weather API Error:', err);
        return of({
          tempC: 20,
          humidity: 50,
          desc: 'Unavailable',
          icon: 'https://openweathermap.org/img/wn/02d@2x.png'
        });
      })
    );
  }

  private getWeatherInfo(code: number, isDay: boolean): { description: string, icon: string } {
    const suffix = isDay ? 'd' : 'n';

    // WMO Weather interpretation codes (WW)
    const codes: any = {
      0: { desc: 'Clear sky', icon: '01' },
      1: { desc: 'Mainly clear', icon: '02' },
      2: { desc: 'Partly cloudy', icon: '02' },
      3: { desc: 'Overcast', icon: '03' },
      45: { desc: 'Fog', icon: '50' },
      48: { desc: 'Depositing rime fog', icon: '50' },
      51: { desc: 'Light drizzle', icon: '09' },
      53: { desc: 'Moderate drizzle', icon: '09' },
      55: { desc: 'Dense drizzle', icon: '09' },
      61: { desc: 'Slight rain', icon: '10' },
      63: { desc: 'Moderate rain', icon: '10' },
      65: { desc: 'Heavy rain', icon: '10' },
      71: { desc: 'Slight snow', icon: '13' },
      73: { desc: 'Moderate snow', icon: '13' },
      75: { desc: 'Heavy snow', icon: '13' },
      77: { desc: 'Snow grains', icon: '13' },
      80: { desc: 'Slight rain showers', icon: '09' },
      81: { desc: 'Moderate rain showers', icon: '09' },
      82: { desc: 'Violent rain showers', icon: '09' },
      85: { desc: 'Slight snow showers', icon: '13' },
      86: { desc: 'Heavy snow showers', icon: '13' },
      95: { desc: 'Thunderstorm', icon: '11' },
      96: { desc: 'Thunderstorm with hail', icon: '11' },
      99: { desc: 'Thunderstorm with heavy hail', icon: '11' }
    };

    const info = codes[code] || { desc: 'Unknown', icon: '02' };
    return {
      description: info.desc,
      icon: `https://openweathermap.org/img/wn/${info.icon}${suffix}@2x.png`
    };
  }
}