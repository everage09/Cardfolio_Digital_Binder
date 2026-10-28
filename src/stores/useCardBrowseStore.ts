import { create } from 'zustand'
import type { FilterMode } from '../features/collection/CollectionFilter'

export type PageSizeOption = 30 | 60 | 120 | 'all'

interface CardBrowseState {
  searchQuery: string
  filterMode: FilterMode
  selectedRarity: string | null
  includeGroupCards: boolean
  page: number
  pageSize: PageSizeOption
  setSearchQuery: (query: string) => void
  setFilterMode: (mode: FilterMode) => void
  setSelectedRarity: (rarity: string | null) => void
  setIncludeGroupCards: (include: boolean) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: PageSizeOption) => void
  resetFilters: () => void
  resetBrowse: () => void
}

const initialState = {
  searchQuery: '',
  filterMode: 'all' as FilterMode,
  selectedRarity: null as string | null,
  includeGroupCards: true,
  page: 1,
  pageSize: 60 as PageSizeOption,
}

// 화면을 오갈 때 검색 조건을 유지한다. 보유·위시 데이터와 별개인 세션 상태다.
export const useCardBrowseStore = create<CardBrowseState>()((set) => ({
  ...initialState,
  setSearchQuery: (searchQuery) => set({ searchQuery, page: 1 }),
  setFilterMode: (filterMode) => set({ filterMode, page: 1 }),
  setSelectedRarity: (selectedRarity) => set({ selectedRarity, page: 1 }),
  setIncludeGroupCards: (includeGroupCards) => set({ includeGroupCards, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  resetFilters: () => set({ filterMode: 'all', selectedRarity: null, includeGroupCards: true, page: 1 }),
  resetBrowse: () => set(initialState),
}))
