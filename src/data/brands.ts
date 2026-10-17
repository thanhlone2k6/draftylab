// Social Production brands. Order is fixed by the spec. Platform links are temporaryFromV1
// (V1 src/data/partners.ts) — only shown where V1 had a real URL.
export interface BrandMeta {
  id: string;
  platform?: { kind: 'instagram' | 'facebook'; url: string; temporaryFromV1: true };
}

export const brandMeta: Record<string, BrandMeta> = {
  dinhhouse: { id: 'dinhhouse', platform: { kind: 'facebook', url: 'https://www.facebook.com/dinh1atangbatho', temporaryFromV1: true } },
  leechloe: { id: 'leechloe', platform: { kind: 'facebook', url: 'https://www.facebook.com/leechloecoffee', temporaryFromV1: true } },
  kazaki: { id: 'kazaki', platform: { kind: 'instagram', url: 'https://www.instagram.com/kazaki.landshut/', temporaryFromV1: true } },
  goodci: { id: 'goodci', platform: { kind: 'instagram', url: 'https://www.instagram.com/goodcicrew/', temporaryFromV1: true } },
  winnie: { id: 'winnie', platform: { kind: 'instagram', url: 'https://www.instagram.com/winnie_wakanda/', temporaryFromV1: true } },
  marie: { id: 'marie' },
  porche: { id: 'porche' },
};
