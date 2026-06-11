import { create } from 'zustand';
import type { CartItem, OrderAddress } from '../types';

interface CheckoutState {
  checkoutItems: CartItem[];
  selectedAddress: OrderAddress | null;
  setCheckoutItems: (items: CartItem[]) => void;
  setAddress: (address: OrderAddress) => void;
  clearCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  checkoutItems: [],
  selectedAddress: null,
  setCheckoutItems: (items) => set({ checkoutItems: items }),
  setAddress: (address) => set({ selectedAddress: address }),
  clearCheckout: () => set({ checkoutItems: [], selectedAddress: null }),
}));
