import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CounterCartItem, CustomerProfile, BranchId } from "@/components/Counter/types";
import { DEFAULT_WALKIN_CUSTOMER } from "@/components/Counter/types";

interface PosState {
  // Active branch context
  activeBranchId: BranchId;
  setActiveBranchId: (branchId: BranchId) => void;

  // Active Customer selected at counter
  selectedCustomer: CustomerProfile;
  setSelectedCustomer: (customer: CustomerProfile) => void;

  // POS Cart Line Items
  cart: CounterCartItem[];
  addToCart: (item: CounterCartItem) => void;
  updateQuantity: (id: string, delta: number) => void;
  setQuantity: (id: string, qty: number) => void;
  updateItemModel: (id: string, bikeModel: string) => void;
  toggleNetScheme: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

export const usePosStore = create<PosState>()(
  persist(
    (set) => ({
      activeBranchId: "main",
      setActiveBranchId: (branchId) => set({ activeBranchId: branchId }),

      selectedCustomer: DEFAULT_WALKIN_CUSTOMER,
      setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),

      cart: [],
      addToCart: (newItem) =>
        set((state) => {
          const existingIndex = state.cart.findIndex(
            (item) => item.productId === newItem.productId && item.bikeModel === newItem.bikeModel
          );
          if (existingIndex > -1) {
            const updated = [...state.cart];
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: updated[existingIndex].quantity + newItem.quantity,
            };
            return { cart: updated };
          }
          return { cart: [newItem, ...state.cart] };
        }),

      updateQuantity: (id, delta) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
          ),
        })),

      setQuantity: (id, qty) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(1, qty) } : item
          ),
        })),

      updateItemModel: (id, bikeModel) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === id ? { ...item, bikeModel } : item
          ),
        })),

      toggleNetScheme: (id) =>
        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.id !== id) return item;
            const newActive = !item.isSchemeActive;
            const newRate = newActive ? item.schemeRate || item.wholesaleRate : item.wholesaleRate;
            return {
              ...item,
              isSchemeActive: newActive,
              rate: newRate,
            };
          }),
        })),

      removeFromCart: (id) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
        })),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "sarfraz_pos_terminal_storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeBranchId: state.activeBranchId,
        selectedCustomer: state.selectedCustomer,
        cart: state.cart,
      }),
    }
  )
);
