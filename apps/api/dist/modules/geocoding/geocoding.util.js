"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGeocoderResponse = parseGeocoderResponse;
function component(components, type, short = false) {
    if (!components)
        return '';
    const match = components.find((c) => c.types.includes(type));
    if (!match)
        return '';
    return short ? match.short_name : match.long_name;
}
function normalizeIndianPincode(raw, formattedAddress) {
    const digits = raw.replace(/\D/g, '');
    if (/^\d{6}$/.test(digits))
        return digits;
    if (formattedAddress) {
        const match = formattedAddress.match(/\b(\d{6})\b/);
        if (match)
            return match[1];
    }
    return '';
}
function parseSingleResult(result, fallbackLat, fallbackLng) {
    const components = result.address_components ?? [];
    const lat = result.geometry?.location?.lat ?? fallbackLat;
    const lng = result.geometry?.location?.lng ?? fallbackLng;
    const streetNumber = component(components, 'street_number');
    const route = component(components, 'route');
    const sublocality = component(components, 'sublocality_level_1') ||
        component(components, 'sublocality') ||
        component(components, 'neighborhood');
    const locality = component(components, 'locality') || component(components, 'administrative_area_level_2');
    const city = component(components, 'locality') || component(components, 'administrative_area_level_2') || locality;
    const state = component(components, 'administrative_area_level_1');
    const pincode = normalizeIndianPincode(component(components, 'postal_code', true) || component(components, 'postal_code'), result.formatted_address);
    const line1 = [streetNumber, route].filter(Boolean).join(' ').trim() || sublocality || locality;
    return {
        formattedAddress: result.formatted_address ?? line1,
        line1,
        line2: sublocality && line1 !== sublocality ? sublocality : undefined,
        locality: sublocality || locality || city,
        city,
        state,
        pincode,
        lat,
        lng,
    };
}
function parseGeocoderResponse(data, fallbackLat, fallbackLng) {
    if (data.status !== 'OK' || !data.results?.length)
        return null;
    const postalTyped = data.results.find((r) => r.types?.includes('postal_code'));
    if (postalTyped) {
        const parsed = parseSingleResult(postalTyped, fallbackLat, fallbackLng);
        if (parsed?.pincode)
            return parsed;
    }
    let fallback = null;
    for (const result of data.results) {
        const parsed = parseSingleResult(result, fallbackLat, fallbackLng);
        if (!parsed)
            continue;
        if (!fallback)
            fallback = parsed;
        if (parsed.pincode)
            return parsed;
    }
    return fallback;
}
//# sourceMappingURL=geocoding.util.js.map