// src/geo/geo.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    osm_id?: string | number;
    osm_key?: string;
    osm_value?: string;
  };
};

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  private cache = new Map<string, { t: number; data: any }>();
  private PHOTON_URL = process.env.PHOTON_BASE_URL ?? 'https://photon.komoot.io/api';

  constructor(private readonly http: HttpService) {}

  async suggest(q: string, limit = 5) {
    const query = (q ?? '').trim();
    if (!query) return [];
    const L = Math.min(Math.max(limit, 1), 10);

    const key = `photon:${query}:${L}`;
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.t < 60_000) return hit.data;

    
    const bbox = '95,-11,141,6';
    
    const url = `${this.PHOTON_URL}?q=${encodeURIComponent(query)}&limit=${L}&bbox=${bbox}`;

    try {
      const { data } = await firstValueFrom(
        this.http.get(url, { timeout: 5000 })
      );

      const items = (data?.features ?? []).map((f: PhotonFeature) => {
        const [lon, lat] = f.geometry.coordinates;
        const p = f.properties ?? {};
        const label =
          [p.name, p.street, p.city, p.state, p.postcode, p.country]
            .filter(Boolean)
            .join(', ') || p.name || 'Lokasi';
        return {
          label,
          lat,
          lon,
          osm_id: p.osm_id,
          osm_key: p.osm_key,
          osm_value: p.osm_value,
        };
      });

      this.cache.set(key, { t: Date.now(), data: items });
      return items;
    } catch (err: any) {
      const status = err?.response?.status;
      const body = err?.response?.data;
      this.logger.warn(`Photon suggest failed (${status}): ${JSON.stringify(body)}`);
      return [];
    }
  }
}
