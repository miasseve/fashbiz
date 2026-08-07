// Maps a real store User doc to the flat shape Discover expects (matches
// the single-store detail route's existing response shape, so both the
// list and detail endpoints stay identical).
export function serializePublicStore(store) {
  return {
    id: String(store._id),
    name: store.storename,
    address: store.address || null,
    city: store.city || null,
    state: store.state || null,
    zipcode: store.zipcode || null,
    country: store.country || null,
    lat: store.latitude ?? null,
    lng: store.longitude ?? null,
    businessNumber: store.businessNumber || null,
    verified: store.isVerified !== false,
    logo: store.branding?.logoUrl || null,
  };
}

export const PUBLIC_STORE_FIELDS =
  "storename address city state zipcode country latitude longitude businessNumber isVerified branding";
