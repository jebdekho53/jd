import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RedisService } from '../../redis/redis.service';
import { parseGeocoderResponse, parseSingleResult } from './geocoding.util';

export interface GeocodedAddress {
  formattedAddress: string;
  line1: string;
  line2?: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
}

export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

const CACHE_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

@Injectable()
export class GeocodingCacheService {
  private readonly logger = new Logger(GeocodingCacheService.name);
  private readonly apiKey: string;

  constructor(
    private readonly redis: RedisService,
    config: ConfigService,
  ) {
    this.apiKey =
      config.get<string>('GOOGLE_MAPS_API_KEY', '') ||
      config.get<string>('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', '') ||
      '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey.trim());
  }

  private roundCoord(n: number): string {
    return n.toFixed(5);
  }

  private reverseKey(lat: number, lng: number): string {
    return `geocode:rev:${this.roundCoord(lat)}:${this.roundCoord(lng)}`;
  }

  private pincodeKey(pincode: string): string {
    return `geocode:pin:${pincode}`;
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress | null> {
    const key = this.reverseKey(lat, lng);
    const cached = await this.redis.get(key);
    if (cached) {
      try {
        return JSON.parse(cached) as GeocodedAddress;
      } catch {
        /* ignore corrupt cache */
      }
    }

    if (!this.isConfigured()) return null;

    try {
      const { data } = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: { latlng: `${lat},${lng}`, key: this.apiKey, region: 'in' },
        timeout: 8000,
      });
      const parsed = parseGeocoderResponse(data, lat, lng);
      if (!parsed) return null;

      await this.redis.set(key, JSON.stringify(parsed), CACHE_TTL_SEC);
      if (parsed.pincode) {
        await this.redis.set(this.pincodeKey(parsed.pincode), JSON.stringify(parsed), CACHE_TTL_SEC);
      }
      return parsed;
    } catch (err) {
      this.logger.warn({ lat, lng, err }, 'Reverse geocode failed');
      return null;
    }
  }

  async getByPincode(pincode: string): Promise<GeocodedAddress | null> {
    if (!/^\d{6}$/.test(pincode)) return null;
    const cached = await this.redis.get(this.pincodeKey(pincode));
    if (cached) {
      try {
        return JSON.parse(cached) as GeocodedAddress;
      } catch {
        /* ignore corrupt cache */
      }
    }

    if (!this.isConfigured()) return null;

    try {
      const { data } = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: `${pincode}, India`,
          components: `postal_code:${pincode}|country:IN`,
          key: this.apiKey,
          region: 'in',
        },
        timeout: 8000,
      });
      const parsed = parseGeocoderResponse(data, 0, 0);
      if (!parsed?.pincode) return null;

      await this.redis.set(this.pincodeKey(parsed.pincode), JSON.stringify(parsed), CACHE_TTL_SEC);
      return parsed;
    } catch (err) {
      this.logger.warn({ pincode, err }, 'Pincode geocode failed');
      return null;
    }
  }

  /**
   * Address search-as-you-type. Only mobile clients hit this — buyer-web/
   * merchant-web/admin-web load the Google Maps JS SDK directly in the
   * browser (see @jebdekho/google-maps) and call google.maps.places from
   * there. React Native has no DOM for that SDK, and the browser key
   * (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) is HTTP-referrer restricted so it
   * wouldn't work from a device anyway — this proxies through the server
   * key instead of ever shipping a Maps key inside the app bundle.
   */
  async autocomplete(input: string, sessionToken?: string): Promise<PlaceSuggestion[]> {
    if (!this.isConfigured() || !input.trim()) return [];

    try {
      const { data } = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
        params: {
          input,
          key: this.apiKey,
          components: 'country:in',
          sessiontoken: sessionToken,
        },
        timeout: 8000,
      });
      if (data.status !== 'OK' || !Array.isArray(data.predictions)) return [];
      return data.predictions.map(
        (p: {
          place_id: string;
          description: string;
          structured_formatting?: { main_text?: string; secondary_text?: string };
        }) => ({
          placeId: p.place_id,
          mainText: p.structured_formatting?.main_text ?? p.description,
          secondaryText: p.structured_formatting?.secondary_text ?? '',
          description: p.description,
        }),
      );
    } catch (err) {
      this.logger.warn({ input, err }, 'Places autocomplete failed');
      return [];
    }
  }

  async placeDetails(placeId: string, sessionToken?: string): Promise<GeocodedAddress | null> {
    if (!this.isConfigured() || !placeId.trim()) return null;

    try {
      const { data } = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: {
          place_id: placeId,
          key: this.apiKey,
          fields: 'formatted_address,address_component,geometry',
          sessiontoken: sessionToken,
        },
        timeout: 8000,
      });
      if (data.status !== 'OK' || !data.result) return null;
      return parseSingleResult(data.result, 0, 0);
    } catch (err) {
      this.logger.warn({ placeId, err }, 'Place details failed');
      return null;
    }
  }
}
