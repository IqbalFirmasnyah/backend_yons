import { Injectable} from '@nestjs/common';
import { HttpService } from '@nestjs/axios'; 
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NominatimService {
  constructor(private readonly httpService: HttpService) {}

  async geocodeAddress(address: string): Promise<any> {
    const url = `https://nominatim.openstreetmap.org/search`;
    const params = {
      q: address,
      format: 'json',
      limit: 1, // Ambil hasil terbaik
      'accept-language': 'id' // Preferensikan hasil dalam bahasa Indonesia
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { params })
      );
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: result.lat,
          longitude: result.lon,
          displayName: result.display_name,
        };
      }
      return null; // Alamat tidak ditemukan
    } catch (error) {
      console.error('Error during geocoding:', error);
      throw new Error('Failed to geocode address');
    }
  }
}