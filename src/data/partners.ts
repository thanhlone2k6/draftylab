// Trusted-by partners — TEMPORARY, copied from V1 (src/data/partners.ts + public/media/partners/*.webp).
// `kind: 'logo'` = dark line-art on transparent (inverted for the dark theme); `kind: 'photo'` = square tile.
// NEEDS_USER_DECISION: confirm these are approved to be shown publicly, and supply V2 logos.
export interface Partner {
  id: string;
  name: string;
  logo: string;
  url?: string;
  kind: 'logo' | 'photo';
  width: number;
  height: number;
  temporaryFromV1: true;
}

export const partners: Partner[] = [
  { id: 'kazaki', name: 'Kazaki Ramen', logo: '/media/v1-temp/partners/kazaki.webp', url: 'https://www.instagram.com/kazaki.landshut/', kind: 'logo', width: 435, height: 220, temporaryFromV1: true },
  { id: 'leechloe', name: 'Lee Chloe Coffee', logo: '/media/v1-temp/partners/leechloe.webp', url: 'https://www.facebook.com/leechloecoffee', kind: 'logo', width: 700, height: 184, temporaryFromV1: true },
  { id: 'goodci', name: 'Good Ci', logo: '/media/v1-temp/partners/goodci.webp', url: 'https://www.instagram.com/goodcicrew/', kind: 'logo', width: 220, height: 220, temporaryFromV1: true },
  { id: 'maison', name: 'Maison', logo: '/media/v1-temp/partners/maison.webp', url: 'https://www.instagram.com/maison.deggendorf/', kind: 'logo', width: 194, height: 220, temporaryFromV1: true },
  { id: 'dinhhouse', name: 'Dinh House', logo: '/media/v1-temp/partners/dinhhouse.webp', url: 'https://www.facebook.com/dinh1atangbatho', kind: 'photo', width: 240, height: 240, temporaryFromV1: true },
  { id: 'winnie', name: 'Winnie', logo: '/media/v1-temp/partners/winnie.webp', url: 'https://www.instagram.com/winnie_wakanda/', kind: 'photo', width: 240, height: 240, temporaryFromV1: true },
];
