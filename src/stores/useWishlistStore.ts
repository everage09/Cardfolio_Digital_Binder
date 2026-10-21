import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type WishlistSortMode = 'pack' | 'rarity-desc' | 'rarity-asc' | 'idol-ko' | 'idol-ja'

export interface WishlistState {
  // cardId -> 목표 수량 (1 이상 정수). 위시리스트에 없는 카드는 키가 없음.
  wishes: Record<string, number>
  sortMode: WishlistSortMode
  setSortMode: (mode: WishlistSortMode) => void

  isWished: (cardId: string) => boolean
  getWishQuantity: (cardId: string) => number
  addToWishlist: (cardId: string, targetQty?: number) => void
  removeFromWishlist: (cardId: string) => void
  toggleWishlist: (cardId: string) => void
  setWishQuantity: (cardId: string, qty: number) => void
  clearWishlist: () => void
  lastBulkAddition: string[] | null
  addManyToWishlist: (cardIds: string[]) => number
  undoBulkAddition: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishes: {},
      sortMode: 'pack',
      lastBulkAddition: null,

      setSortMode: (sortMode: WishlistSortMode) => {
        set({ sortMode })
      },

      isWished: (cardId: string) => {
        return cardId in get().wishes
      },

      getWishQuantity: (cardId: string) => {
        return get().wishes[cardId] ?? 1
      },

      addToWishlist: (cardId: string, targetQty = 1) => {
        const safeQty = Math.max(1, Math.floor(isNaN(targetQty) ? 1 : targetQty))
        set((state) => {
          if (state.wishes[cardId] === safeQty) return state
          return {
            wishes: { ...state.wishes, [cardId]: safeQty },
            lastBulkAddition: state.lastBulkAddition?.includes(cardId) ? null : state.lastBulkAddition,
          }
        })
      },

      removeFromWishlist: (cardId: string) => {
        set((state) => {
          const next = { ...state.wishes }
          delete next[cardId]
          return {
            wishes: next,
            lastBulkAddition: state.lastBulkAddition?.includes(cardId) ? null : state.lastBulkAddition,
          }
        })
      },

      toggleWishlist: (cardId: string) => {
        if (get().isWished(cardId)) {
          get().removeFromWishlist(cardId)
        } else {
          get().addToWishlist(cardId)
        }
      },

      setWishQuantity: (cardId: string, qty: number) => {
        const safeQty = Math.max(1, Math.floor(isNaN(qty) ? 1 : qty))
        if (!get().isWished(cardId)) return
        get().addToWishlist(cardId, safeQty)
      },

      clearWishlist: () => {
        set({ wishes: {}, lastBulkAddition: null })
      },

      addManyToWishlist: (cardIds: string[]) => {
        const addedIds = [...new Set(cardIds)].filter((id) => !(id in get().wishes))
        if (addedIds.length === 0) return 0
        set((state) => {
          const wishes = { ...state.wishes }
          for (const id of addedIds) wishes[id] = 1
          return { wishes, lastBulkAddition: addedIds }
        })
        return addedIds.length
      },

      undoBulkAddition: () => {
        set((state) => {
          if (!state.lastBulkAddition) return state
          const wishes = { ...state.wishes }
          for (const id of state.lastBulkAddition) delete wishes[id]
          return { wishes, lastBulkAddition: null }
        })
      },
    }),
    {
      name: 'cardfolio-wishlist-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ wishes, sortMode }) => ({ wishes, sortMode }),
    }
  )
)
