// src/osrm/osrm.service.ts
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class OsrmService {
  constructor(private readonly httpService: HttpService) {}

  async getRouteInfo(startCoords: { lat: number; lon: number }, endCoords: { lat: number; lon: number }): Promise<{ distanceKm: number; durationSeconds: number }> {
    const start = `${startCoords.lon},${startCoords.lat}`;
    const end = `${endCoords.lon},${endCoords.lat}`;
    const url = `http://router.project-osrm.org/route/v1/driving/${start};${end}`;

    try {
      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            overview: 'false',
            geometries: 'geojson',
          },
        }),
      );

      if (response.data && response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const distanceKm = route.distance / 1000;
        const durationSeconds = route.duration;
        return {
          distanceKm: distanceKm,
          durationSeconds: durationSeconds,
        };
      }
      throw new Error('Rute tidak dapat ditemukan.');
    } catch (error) {
      console.error('Error during OSRM request:', error.response?.data || error.message);
      throw new Error('Gagal menghitung rute.');
    }
  }
}