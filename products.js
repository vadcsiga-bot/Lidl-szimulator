// Termékkatalógus. Minden termékhez tartozik egy kategória (polc-szín),
// egy megjelenítési szín (a dobozka/termék színe a polcon) és egy ár Ft-ban.

export const CATEGORIES = {
  ZOLDSEG: { label: 'Friss zöldség-gyümölcs', color: 0x4caf50 },
  PEKARU: { label: 'Friss pékáru', color: 0xd9a441 },
  TEJTERMEK: { label: 'Tejtermék', color: 0xf2f2f2 },
  AKCIO: { label: 'Akciók', color: 0xdd0741 },
  ITAL: { label: 'Italok', color: 0x2196f3 },
  EDESSEG: { label: 'Édesség', color: 0xaa66cc },
};

export const PRODUCTS = [
  { id: 'alma', name: 'Alma (1kg)', category: 'ZOLDSEG', price: 399, color: 0xd42a2a },
  { id: 'banan', name: 'Banán (1kg)', category: 'ZOLDSEG', price: 549, color: 0xffe135 },
  { id: 'paradicsom', name: 'Paradicsom (1kg)', category: 'ZOLDSEG', price: 799, color: 0xe0432b },
  { id: 'uborka', name: 'Uborka (1kg)', category: 'ZOLDSEG', price: 449, color: 0x5fa84c },

  { id: 'kenyer', name: 'Vekni kenyér', category: 'PEKARU', price: 599, color: 0xc98a3c },
  { id: 'zsemle', name: 'Zsemle (6db)', category: 'PEKARU', price: 349, color: 0xe8c07d },
  { id: 'croissant', name: 'Vajas croissant', category: 'PEKARU', price: 299, color: 0xf0c98a },

  { id: 'tej', name: 'Tej (1L)', category: 'TEJTERMEK', price: 429, color: 0xffffff },
  { id: 'sajt', name: 'Trappista sajt', category: 'TEJTERMEK', price: 899, color: 0xffdd66 },
  { id: 'joghurt', name: 'Natúr joghurt', category: 'TEJTERMEK', price: 349, color: 0xfafafa },
  { id: 'vaj', name: 'Vaj (200g)', category: 'TEJTERMEK', price: 649, color: 0xffe98a },

  { id: 'kola', name: 'Kóla (1.5L)', category: 'ITAL', price: 549, color: 0x8b0000 },
  { id: 'asvanyviz', name: 'Ásványvíz (1.5L)', category: 'ITAL', price: 199, color: 0x9fd8ff },
  { id: 'narancsle', name: 'Narancslé (1L)', category: 'ITAL', price: 599, color: 0xff9800 },

  { id: 'csoki', name: 'Tejcsokoládé', category: 'EDESSEG', price: 449, color: 0x5a3220 },
  { id: 'keksz', name: 'Keksz csomag', category: 'EDESSEG', price: 399, color: 0xd2a679 },
  { id: 'chips', name: 'Chips zacskó', category: 'EDESSEG', price: 549, color: 0xffb300 },

  { id: 'akcio_kave', name: 'AKCIÓS Kávé', category: 'AKCIO', price: 1299, color: 0xdd0741, isDeal: true },
  { id: 'akcio_mosogel', name: 'AKCIÓS Mosógél', category: 'AKCIO', price: 1899, color: 0xdd0741, isDeal: true },
  { id: 'akcio_sonka', name: 'AKCIÓS Sonka', category: 'AKCIO', price: 999, color: 0xdd0741, isDeal: true },
];

export function getProductById(id) {
  return PRODUCTS.find((p) => p.id === id);
}

export function randomProducts(count, excludeIds = []) {
  const pool = PRODUCTS.filter((p) => !p.isDeal && !excludeIds.includes(p.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
