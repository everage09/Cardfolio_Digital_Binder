import type { Pack } from '../types/card'
import type { FilterMode } from '../features/collection/CollectionFilter'
import type { SortMode } from '../stores/useCollectionStore'
import { groupPacksByCategory } from './packCategories'

export interface CardScope {
  value: string
  type: 'all' | 'category' | 'pack'
  name: string
  categoryName?: string
  packs: Pack[]
}

export function resolveCardScope(packs: Pack[], value: string): CardScope {
  const groups = groupPacksByCategory(packs)
  const category = groups.find((group) => `category:${group.id}` === value)
  if (category) {
    return { value, type: 'category', name: `${category.categoryName} 전체`, categoryName: category.categoryName, packs: category.packs }
  }
  const pack = packs.find((item) => item.id === value)
  if (pack) {
    return { value, type: 'pack', name: pack.name, categoryName: groups.find((group) => group.packs.some((item) => item.id === value))?.categoryName, packs: [pack] }
  }
  return { value: 'all', type: 'all', name: '전체 카드', packs: groups.flatMap((group) => group.packs) }
}

interface CardFilters {
  quantities: Readonly<Record<string, number>>
  filterMode: FilterMode
  selectedRarity: string | null
  sortMode: SortMode
}

/** 원본 카드 배열을 변경하지 않고 각 팩 안에서 필터와 정렬을 적용한다. */
export function filterAndSortPacks(packs: Pack[], filters: CardFilters): Pack[] {
  return packs.flatMap((pack) => {
    const cards = pack.cards.filter((card) => {
      const owned = (filters.quantities[card.id] ?? 0) > 0
      if (filters.filterMode === 'owned' && !owned) return false
      if (filters.filterMode === 'unowned' && owned) return false
      return !filters.selectedRarity || card.rarity === filters.selectedRarity
    })
    cards.sort((a, b) => {
      const rankDiff = (a.rarityRank ?? 0) - (b.rarityRank ?? 0)
      if (rankDiff && filters.sortMode !== 'default') {
        return filters.sortMode === 'rarity-desc' ? -rankDiff : rankDiff
      }
      return a.sortOrder - b.sortOrder
    })
    return cards.length ? [{ ...pack, cards }] : []
  })
}

/** 팩 경계와 순서를 유지하면서 여러 팩의 카드를 한 페이지로 나눈다. */
export function paginatePacks(packs: Pack[], page: number, pageSize: number): Pack[] {
  if (pageSize <= 0 || !Number.isFinite(pageSize)) {
    return packs
  }
  let skip = Math.max(0, page - 1) * pageSize
  let remaining = pageSize
  return packs.flatMap((pack) => {
    const start = Math.min(skip, pack.cards.length)
    skip -= start
    const cards = pack.cards.slice(start, start + remaining)
    remaining -= cards.length
    return cards.length ? [{ ...pack, cards }] : []
  })
}
