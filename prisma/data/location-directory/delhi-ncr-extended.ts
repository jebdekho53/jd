/**
 * Supplemental Delhi NCR pincodes for Pincode Master (LocationPincode).
 * Merged during location directory seed to reach 500+ serviceable pincodes.
 */
import type { DirectoryPincode } from './delhi-ncr';

function po(pincode: string, postOffice: string, lat: number, lng: number, subArea?: string): DirectoryPincode {
  return { pincode, postOffice, lat, lng, subArea };
}

/** Generate pincode range with shared coordinates (city-center approximation). */
function range(
  from: number,
  to: number,
  prefix: string,
  postOffice: string,
  lat: number,
  lng: number,
): DirectoryPincode[] {
  const out: DirectoryPincode[] = [];
  for (let i = from; i <= to; i++) {
    const pincode = `${prefix}${String(i).padStart(3, '0')}`;
    out.push(po(pincode, postOffice, lat, lng));
  }
  return out;
}

export const EXTENDED_NCR_PINCODES: DirectoryPincode[] = [
  ...range(1, 96, '110', 'New Delhi', 28.6139, 77.209),
  ...range(1, 18, '122', 'Gurgaon', 28.4595, 77.0266),
  ...range(1, 10, '121', 'Faridabad', 28.4089, 77.3178),
  ...range(301, 318, '201', 'Noida', 28.5355, 77.391),
  ...range(1, 20, '201', 'Ghaziabad', 28.6692, 77.4538),
  ...range(206, 210, '201', 'Muradnagar', 28.782, 77.499),
  ...range(1, 8, '245', 'Hapur', 28.7306, 77.7759),
  ...range(1, 5, '131', 'Sonipat', 28.9931, 77.0151),
  ...range(1, 5, '124', 'Bahadurgarh', 28.6928, 76.9378),
  po('201009', 'Indirapuram', 28.6415, 77.3714),
  po('201014', 'Vaishali', 28.6506, 77.3412),
  po('201016', 'Vasundhara', 28.6602, 77.3698),
  po('201017', 'Crossings Republik', 28.6271, 77.4399),
  po('201002', 'Raj Nagar', 28.6729, 77.4333),
  po('201013', 'Wave City', 28.6891, 77.4562),
  po('201010', 'Siddharth Vihar', 28.6589, 77.4123),
  po('201003', 'Govindpuram', 28.6751, 77.4481),
  po('201001', 'Kaushambi', 28.6395, 77.3256),
  po('110032', 'Shahdara', 28.6733, 77.288),
  po('110095', 'Dilshad Garden', 28.6758, 77.3125),
  po('110091', 'Mayur Vihar', 28.6092, 77.2952),
  po('110096', 'Vasundhara Enclave', 28.5908, 77.3189),
  po('203207', 'Jewar', 28.1219, 77.5567),
  po('203207', 'Yamuna Expressway', 28.2034, 77.5123),
];
