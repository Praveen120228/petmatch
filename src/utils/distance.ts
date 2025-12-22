export function getDistance(
    lat1: number | undefined | null,
    lon1: number | undefined | null,
    lat2: number | undefined | null,
    lon2: number | undefined | null
): string | null {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km

    if (d < 1) return '< 1 km';
    return `${Math.round(d)} km`;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}
