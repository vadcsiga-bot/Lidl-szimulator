import { randomProducts, PRODUCTS } from './products.js';

const SAVE_KEY = 'lidl-vasarlo-szimulator-save-v2';

// A ruhadarabok két márkaszínben érhetők el, kb. fele-fele arányban.
export const ROYAL_BLUE = 0x2b4fd9;
export const LEMON_YELLOW = 0xf5e216;

export const WARDROBE_SLOTS = [
  { key: 'scarf', label: 'Sál' },
  { key: 'cap', label: 'Fejfedő' },
  { key: 'top', label: 'Felső' },
  { key: 'bottom', label: 'Nadrág' },
  { key: 'socks', label: 'Zokni' },
  { key: 'shoes', label: 'Cipő' },
  { key: 'backpack', label: 'Hátizsák' },
  { key: 'cart', label: 'Kosár' },
];

// meta.style határozza meg a character.js-ben a geometria variánsát
export const WARDROBE_ITEMS = [
  { id: 'sal_sarga', slot: 'scarf', name: 'Sárga sál', cost: 0, color: LEMON_YELLOW, unlockedByDefault: true },
  { id: 'sal_kek', slot: 'scarf', name: 'Kék sál', cost: 40, color: ROYAL_BLUE },

  { id: 'sapka_kek', slot: 'cap', name: 'Kék sapka', cost: 50, color: ROYAL_BLUE },

  { id: 'polo_kek', slot: 'top', name: 'Kék póló', cost: 70, color: ROYAL_BLUE, meta: { style: 'tshirt' } },
  { id: 'pulcsi_sarga', slot: 'top', name: 'Sárga pulóver', cost: 90, color: LEMON_YELLOW, meta: { style: 'sweater' } },
  { id: 'kabat_sarga', slot: 'top', name: 'Sárga kabát', cost: 150, color: LEMON_YELLOW, meta: { style: 'coat' } },

  { id: 'nadrag_rovid_sarga', slot: 'bottom', name: 'Sárga rövidnadrág', cost: 70, color: LEMON_YELLOW, meta: { style: 'shorts' } },

  { id: 'zokni_sarga', slot: 'socks', name: 'Sárga zokni', cost: 30, color: LEMON_YELLOW },

  { id: 'cipo_kek', slot: 'shoes', name: 'Kék cipő', cost: 40, color: ROYAL_BLUE },

  { id: 'hatizsak_kek', slot: 'backpack', name: 'Kék hátizsák', cost: 100, color: ROYAL_BLUE },

  { id: 'kocsi_arany', slot: 'cart', name: 'Arany kosár', cost: 200, color: 0xe8c547 },
];

export function getWardrobeItem(id) {
  return WARDROBE_ITEMS.find((w) => w.id === id) || null;
}

function defaultEquipped() {
  return { scarf: 'sal_sarga', cap: null, top: null, bottom: null, socks: null, shoes: null, backpack: null, cart: null };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) throw new Error('no save');
    const parsed = JSON.parse(raw);
    if (!parsed.equipped) parsed.equipped = defaultEquipped();
    if (!parsed.unlockedWardrobe) parsed.unlockedWardrobe = ['sal_sarga'];
    return parsed;
  } catch {
    return {
      loyaltyPoints: 0,
      bestScore: 0,
      unlockedWardrobe: ['sal_sarga'],
      equipped: defaultEquipped(),
    };
  }
}

// Az aktuálisan felszerelt ruhadarabok teljes, feloldott adatai character.js számára
export function resolveEquippedOutfit(save) {
  const outfit = {};
  WARDROBE_SLOTS.forEach(({ key }) => {
    const id = save.equipped[key];
    outfit[key] = id ? getWardrobeItem(id) : null;
  });
  return outfit;
}

export class GameState {
  constructor() {
    this.save = loadSave();
    this.reset();
  }

  reset() {
    this.shoppingList = randomProducts(4).map((p) => ({ ...p, collected: false }));
    this.cartValue = 0;
    this.cartItems = [];
    this.cartCapacity = 8;
    this.elapsedSeconds = 0;
    this.activeEvent = null; // { type, expiresAt, product }
  }

  persist() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.save));
  }

  addLoyaltyPoints(points) {
    this.save.loyaltyPoints += points;
    this.persist();
  }

  updateBestScore(score) {
    if (score > this.save.bestScore) {
      this.save.bestScore = score;
      this.persist();
    }
  }

  unlockWardrobeItem(id) {
    const item = getWardrobeItem(id);
    if (!item) return false;
    if (this.save.unlockedWardrobe.includes(id)) return false;
    if (this.save.loyaltyPoints < item.cost) return false;
    this.save.loyaltyPoints -= item.cost;
    this.save.unlockedWardrobe.push(id);
    this.persist();
    return true;
  }

  // Ha az adott elem már fel van szerelve, levesszük (toggle); egyébként felvesszük
  // - ez automatikusan lecseréli az adott réteg (slot) korábbi darabját.
  toggleEquipWardrobeItem(id) {
    const item = getWardrobeItem(id);
    if (!item) return false;
    if (!this.save.unlockedWardrobe.includes(id)) return false;

    if (this.save.equipped[item.slot] === id) {
      this.save.equipped[item.slot] = null;
    } else {
      this.save.equipped[item.slot] = id;
    }
    this.persist();
    return true;
  }

  getOutfit() {
    return resolveEquippedOutfit(this.save);
  }

  isOnList(productId) {
    return this.shoppingList.some((item) => item.id === productId && !item.collected);
  }

  collectProduct(product) {
    if (this.cartItems.length >= this.cartCapacity) {
      return { success: false, reason: 'full' };
    }
    this.cartItems.push(product);
    this.cartValue += product.price;

    const listEntry = this.shoppingList.find((item) => item.id === product.id && !item.collected);
    let listCompleted = false;
    if (listEntry) {
      listEntry.collected = true;
      listCompleted = this.shoppingList.every((item) => item.collected);
    }

    return { success: true, listEntry: !!listEntry, listCompleted };
  }

  get listProgress() {
    const done = this.shoppingList.filter((i) => i.collected).length;
    return { done, total: this.shoppingList.length };
  }

  formatCartValue() {
    return `${this.cartValue.toLocaleString('hu-HU')} Ft`;
  }
}

export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
