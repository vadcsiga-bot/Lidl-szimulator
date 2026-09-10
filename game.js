import { randomProducts, PRODUCTS } from './products.js';

const SAVE_KEY = 'lidl-vasarlo-szimulator-save-v1';

export const WARDROBE_ITEMS = [
  { id: 'sal_sarga', name: 'Sárga sál', cost: 0, unlockedByDefault: true, scarfColor: 0xffd100, jacketColor: 0x0050aa, cartColor: 0xcfd4da },
  { id: 'sapka_kek', name: 'Kék sapka + sál', cost: 50, scarfColor: 0xffd100, jacketColor: 0x0050aa, cartColor: 0xcfd4da, hasCap: true },
  { id: 'kabat_piros', name: 'Piros kabát', cost: 120, scarfColor: 0xffd100, jacketColor: 0xdd0741, cartColor: 0xcfd4da },
  { id: 'kocsi_arany', name: 'Arany kosár', cost: 200, scarfColor: 0xffd100, jacketColor: 0x0050aa, cartColor: 0xe8c547 },
];

export function getWardrobeItem(id) {
  return WARDROBE_ITEMS.find((w) => w.id === id) || WARDROBE_ITEMS[0];
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) throw new Error('no save');
    return JSON.parse(raw);
  } catch {
    return {
      loyaltyPoints: 0,
      bestScore: 0,
      unlockedWardrobe: ['sal_sarga'],
      equippedWardrobe: 'sal_sarga',
    };
  }
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
    const item = WARDROBE_ITEMS.find((w) => w.id === id);
    if (!item) return false;
    if (this.save.unlockedWardrobe.includes(id)) return false;
    if (this.save.loyaltyPoints < item.cost) return false;
    this.save.loyaltyPoints -= item.cost;
    this.save.unlockedWardrobe.push(id);
    this.persist();
    return true;
  }

  equipWardrobeItem(id) {
    if (!this.save.unlockedWardrobe.includes(id)) return false;
    this.save.equippedWardrobe = id;
    this.persist();
    return true;
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
