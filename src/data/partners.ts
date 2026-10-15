// Trusted-by partners. `logo` may be line-art (tinted for the gold band) or a
// square photo tile. Clicking a partner opens `url`.
export interface Partner {
  id: string;
  name: string;
  logo: string;
  url: string;
  kind: 'logo' | 'photo';
}

export const partners: Partner[] = [
  {
    id: 'kazaki',
    name: 'Kazaki Ramen',
    logo: '/media/partners/kazaki.webp',
    url: 'https://www.instagram.com/kazaki.landshut/',
    kind: 'logo',
  },
  {
    id: 'leechloe',
    name: 'Lee Chloe Coffee',
    logo: '/media/partners/leechloe.webp',
    url: 'https://www.facebook.com/leechloecoffee',
    kind: 'logo',
  },
  {
    id: 'goodci',
    name: 'Good Ci',
    logo: '/media/partners/goodci.webp',
    url: 'https://www.instagram.com/goodcicrew/',
    kind: 'logo',
  },
  {
    id: 'maison',
    name: 'Maison',
    logo: '/media/partners/maison.webp',
    url: 'https://www.instagram.com/maison.deggendorf/',
    kind: 'logo',
  },
  {
    id: 'dinhhouse',
    name: 'Dinh House',
    logo: '/media/partners/dinhhouse.webp',
    url: 'https://www.facebook.com/dinh1atangbatho',
    kind: 'photo',
  },
  {
    id: 'saraya',
    name: 'Saraya St. Laurent',
    logo: '/media/partners/saraya.webp',
    url: 'https://www.instagram.com/sarayaabdoul.stlaurent/reels/',
    kind: 'photo',
  },
  {
    id: 'winnie',
    name: 'Winnie',
    logo: '/media/partners/winnie.webp',
    url: 'https://www.instagram.com/winnie_wakanda/',
    kind: 'photo',
  },
];
