import React, { useState, useMemo, useRef } from 'react'
import { CardsData, Card } from '../types/card'
import { PackSelector } from '../components/PackSelector'
import { CardGrid } from '../components/CardGrid'
import { CardModal } from '../components/CardModal'
import { getSortedPacks, groupPacksByCategory } from '../utils/packCategories'
import { useCollectionStore, SortMode } from '../stores/useCollectionStore'
import { CollectionFilter } from '../features/collection/CollectionFilter'
import { useCardBrowseStore, PageSizeOption } from '../stores/useCardBrowseStore'
import { RaritySummary } from '../features/collection/RaritySummary'
import { BulkCollectionControls } from '../features/collection/BulkCollectionControls'
import { IdolSearch } from '../components/IdolSearch'
import idolData from '../data/idol.json'
import { findMatchingIdolIds, splitIdolSearchQuery } from '../utils/idolSearch'
import { resolveCardScope, filterAndSortPacks, paginatePacks } from '../utils/cardBrowse'

interface CardListPageProps {
  data: CardsData
}

const PAGE_SIZE_OPTIONS: { label: string; value: PageSizeOption }[] = [
  { label: '30장씩', value: 30 },
  { label: '60장씩', value: 60 },
  { label: '120장씩', value: 120 },
  { label: '전체 보기', value: 'all' },
]

const formatCount = (count: number) => count.toLocaleString('ko-KR')

export const CardListPage: React.FC<CardListPageProps> = ({ data }) => {
  const sortedPacks = useMemo(() => getSortedPacks(data.packs), [data.packs])
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const {
    filterMode, setFilterMode, selectedRarity, setSelectedRarity,
    searchQuery, setSearchQuery, includeGroupCards, setIncludeGroupCards,
    page, setPage, pageSize, setPageSize, resetFilters,
  } = useCardBrowseStore()
  const resultsRef = useRef<HTMLDivElement>(null)
  const isSearching = splitIdolSearchQuery(searchQuery).length > 0
  const quantities = useCollectionStore((state) => state.quantities)
  const selectedScope = useCollectionStore((state) => state.selectedCardScope)
  const setSelectedScope = useCollectionStore((state) => state.setSelectedCardScope)
  const sortMode = useCollectionStore((state) => state.sortMode)
  const setSortMode = useCollectionStore((state) => state.setSortMode)

  const scope = useMemo(() => resolveCardScope(sortedPacks, selectedScope), [sortedPacks, selectedScope])
  const scopeCards = useMemo(() => scope.packs.flatMap((pack) => pack.cards), [scope.packs])
  const mappedCardCount = useMemo(() => scopeCards.filter((card) => card.idolIds?.length).length, [scopeCards])
  const hasSearchableCards = useMemo(() => sortedPacks.some((pack) => pack.cards.some((card) => card.idolIds?.length)), [sortedPacks])
  const matchingIdolIds = useMemo(() => findMatchingIdolIds(idolData.idols, searchQuery), [searchQuery])

  const searchedPacks = useMemo(() => {
    if (!isSearching) return scope.packs
    return scope.packs.flatMap((pack) => {
      const cards = pack.cards.filter((card) =>
        card.idolIds?.some((id) => matchingIdolIds.has(id)) &&
        (includeGroupCards || card.idolIds.length < 2),
      )
      return cards.length ? [{ ...pack, cards }] : []
    })
  }, [scope.packs, isSearching, matchingIdolIds, includeGroupCards])
  const searchedCards = useMemo(() => searchedPacks.flatMap((pack) => pack.cards), [searchedPacks])

  // 검색 중에는 검색된 카드 종류를 기준으로 수집 통계와 필터 개수를 계산한다.
  const { ownedUniqueCount, totalOwnedCount } = useMemo(() => {
    let ownedUniqueCount = 0
    let totalOwnedCount = 0
    for (const card of searchedCards) {
      const quantity = quantities[card.id] ?? 0
      if (quantity > 0) {
        ownedUniqueCount++
        totalOwnedCount += quantity
      }
    }
    return { ownedUniqueCount, totalOwnedCount }
  }, [searchedCards, quantities])

  const filteredPacks = useMemo(() => filterAndSortPacks(searchedPacks, {
    quantities, filterMode, selectedRarity, sortMode,
  }), [searchedPacks, quantities, filterMode, selectedRarity, sortMode])
  const resultCount = filteredPacks.reduce((sum, pack) => sum + pack.cards.length, 0)

  const isAllPages = pageSize === 'all'
  const numericPageSize = isAllPages ? resultCount || 1 : pageSize
  const pageCount = isAllPages ? 1 : Math.max(1, Math.ceil(resultCount / numericPageSize))
  const currentPage = Math.min(page, pageCount)
  const visiblePacks = useMemo(() => isAllPages
    ? filteredPacks
    : paginatePacks(filteredPacks, currentPage, numericPageSize), [isAllPages, filteredPacks, currentPage, numericPageSize])
  const categoryNames = useMemo(() => new Map(groupPacksByCategory(sortedPacks)
    .flatMap((group) => group.packs.map((pack) => [pack.id, group.categoryName] as const))), [sortedPacks])
  const collectionPercentage = searchedCards.length > 0
    ? Math.round((ownedUniqueCount / searchedCards.length) * 1000) / 10 : 0
  const hasFilters = filterMode !== 'all' || selectedRarity !== null || (isSearching && !includeGroupCards)

  const changeScope = (value: string) => {
    setSelectedScope(value)
    setSelectedRarity(null)
    setPage(1)
  }
  const searchAll = () => {
    resetFilters()
    changeScope('all')
  }
  const changePage = (nextPage: number) => {
    setPage(nextPage)
    resultsRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  return (
    <div className="card-list-page">
      <header className="page-header sticky-pack-header">
        <div className="header-content">
          {sortedPacks.length > 0 && (
            <>
              <div className="header-pack-row">
                <PackSelector packs={sortedPacks} selectedScope={scope.value} onSelectScope={changeScope} />
                <IdolSearch
                  idols={idolData.idols}
                  value={searchQuery}
                  onChange={setSearchQuery}
                  hasIdolData={mappedCardCount > 0}
                  scopeName={scope.name}
                />
              </div>
              <div className="header-summary-row">
                <span className="pack-category-badge header-category-badge">
                  {scope.type === 'all' ? '전체 시리즈' : scope.type === 'category' ? '시리즈 전체' : scope.categoryName}
                </span>
                <div className="header-progress-stats">
                  <span className="header-progress-label">{isSearching ? '검색 카드 수집 진척도' : '수집 진척도'}</span>
                  <span className="header-progress-counts">
                    <strong>{formatCount(ownedUniqueCount)}</strong> / {formatCount(searchedCards.length)}종
                    <span className="header-progress-percent"> ({collectionPercentage}%)</span>
                  </span>
                  {totalOwnedCount > 0 && <span className="header-progress-total-owned" title="중복 포함 총 보유 카드 수">총 {formatCount(totalOwnedCount)}장 소장</span>}
                </div>
              </div>
              <div className="header-progress-bar-track" role="progressbar"
                aria-label={isSearching ? '검색 카드 수집 진척도' : '수집 진척도'}
                aria-valuenow={collectionPercentage} aria-valuemin={0} aria-valuemax={100}>
                <div className="header-progress-bar-fill" style={{ width: `${Math.min(100, collectionPercentage)}%` }} />
              </div>
            </>
          )}
        </div>
      </header>

      <main className="page-body">
        {sortedPacks.length > 0 ? (
          <>
            <section className="pack-dashboard">
              <div className="pack-header-bar">
                <div className="pack-info">
                  <span className="pack-category-badge">
                    {scope.type === 'all' ? '전체 시리즈' : scope.type === 'category' ? '시리즈 전체' : scope.categoryName}
                  </span>
                  <h2 className="current-pack-name">{scope.name}</h2>
                  <span className="pack-card-count-badge">전체 {formatCount(scopeCards.length)}장</span>
                  {scope.type !== 'pack' && <span className="scope-pack-count">{scope.packs.length}개 팩</span>}
                </div>
              </div>

              <RaritySummary cards={searchedCards} selectedRarity={selectedRarity} onSelectRarity={setSelectedRarity} />

              <div className="collection-controls-bar">
                <CollectionFilter
                  currentFilter={filterMode}
                  onFilterChange={setFilterMode}
                  totalCount={searchedCards.length}
                  ownedCount={ownedUniqueCount}
                  unownedCount={searchedCards.length - ownedUniqueCount}
                />
                <div className="collection-controls-right">
                  <div className="sort-control-group">
                    <label htmlFor="card-sort-select" className="sort-label">정렬</label>
                    <div className="sort-select-wrapper">
                      <select id="card-sort-select" className="sort-select" value={sortMode} onChange={(event) => {
                        setSortMode(event.target.value as SortMode)
                        setPage(1)
                      }}>
                        <option value="default">기본 순서 (번호순)</option>
                        <option value="rarity-desc">등급 높은 순</option>
                        <option value="rarity-asc">등급 낮은 순</option>
                      </select>
                    </div>
                  </div>
                  <div className="sort-control-group page-size-control-group">
                    <label htmlFor="page-size-select" className="sort-label">표시</label>
                    <div className="sort-select-wrapper">
                      <select
                        id="page-size-select"
                        className="sort-select"
                        value={pageSize}
                        onChange={(event) => {
                          const val = event.target.value
                          setPageSize(val === 'all' ? 'all' : (Number(val) as PageSizeOption))
                        }}
                      >
                        {PAGE_SIZE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="card-results" ref={resultsRef}>
              <div className="idol-search-results" role="status" aria-live="polite" aria-atomic="true">
                <span>
                  {isSearching && <><strong>“{searchQuery.trim()}”</strong>{' '}</>}
                  {isSearching && mappedCardCount === 0
                    ? '아이돌 정보 준비 중'
                    : <>{isSearching ? '검색 결과' : '표시 결과'} <strong>{formatCount(resultCount)}장</strong> · {filteredPacks.length}개 팩</>}
                  {hasFilters && <span className="idol-search-results-scope"> · 선택한 필터 적용</span>}
                </span>
                <div className="result-actions">
                  {hasFilters && <button type="button" onClick={resetFilters}>필터 초기화</button>}
                  {isSearching && <button type="button" onClick={() => setSearchQuery('')}>검색 해제</button>}
                </div>
              </div>

              {isSearching && (
                <div className="idol-search-options">
                  <label>
                    <input type="checkbox" checked={includeGroupCards}
                      onChange={(event) => setIncludeGroupCards(event.target.checked)} />
                    <span>단체 카드 포함</span>
                  </label>
                  <span className="idol-search-options-hint">2명 이상 등장하는 카드</span>
                </div>
              )}

              {isSearching && mappedCardCount < scopeCards.length && (
                <p className="idol-search-coverage">
                  전체 {formatCount(scopeCards.length)}장 중 아이돌 정보가 등록된 {formatCount(mappedCardCount)}장에서 검색합니다. 정보 준비 중인 카드는 검색 결과에서 제외됩니다.
                </p>
              )}

              <BulkCollectionControls
                key={JSON.stringify([scope.value, searchQuery, filterMode, selectedRarity, sortMode, includeGroupCards, pageSize])}
                visibleCards={visiblePacks.flatMap((pack) => pack.cards)}>
                {({ selectionMode, selectedIds, onToggleSelection }) => <>
                  {isSearching && mappedCardCount === 0 ? (
                    <div className="empty-state idol-search-empty">
                      <p>선택한 범위에는 아직 아이돌 정보가 등록되지 않았습니다.</p>
                      {scope.value !== 'all' && hasSearchableCards && (
                        <button type="button" onClick={searchAll}>전체 카드에서 검색</button>
                      )}
                    </div>
                  ) : resultCount === 0 ? (
                    <div className="empty-state idol-search-empty">
                      <p>{isSearching ? '이름과 선택한 필터에 맞는 카드가 없습니다.' : '선택한 필터에 맞는 카드가 없습니다.'}</p>
                      <p>이름을 확인하거나 검색 범위와 필터를 변경해 보세요.</p>
                      {isSearching && scope.value !== 'all' && <button type="button" onClick={searchAll}>전체 카드에서 검색</button>}
                    </div>
                  ) : (
                    <>
                      {visiblePacks.map((pack) => (
                        <section key={pack.id} className="pack-results-section" aria-label={pack.name}>
                          {scope.type !== 'pack' && (
                            <div className="pack-results-heading">
                              <span className="pack-category-badge">{categoryNames.get(pack.id)}</span>
                              <h3>{pack.name}</h3>
                              <span className="pack-card-count-badge">
                                {pack.cards.length === filteredPacks.find((item) => item.id === pack.id)?.cards.length
                                   ? `${pack.cards.length}장`
                                  : `${pack.cards.length} / ${filteredPacks.find((item) => item.id === pack.id)?.cards.length}장`}
                              </span>
                              <button type="button" onClick={() => changeScope(pack.id)}>이 팩만 보기</button>
                            </div>
                          )}
                          <CardGrid cards={pack.cards} onSelectCard={setSelectedCard}
                            selectionMode={selectionMode} selectedIds={selectedIds} onToggleSelection={onToggleSelection} />
                        </section>
                      ))}
                      {!isAllPages && pageCount > 1 && (
                        <nav className="card-pagination" aria-label="카드 목록 페이지">
                          <button type="button" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>이전</button>
                          <div>
                            <span aria-live="polite">{currentPage} / {pageCount} 페이지</span>
                            <small>{formatCount((currentPage - 1) * numericPageSize + 1)}–{formatCount(Math.min(currentPage * numericPageSize, resultCount))} / {formatCount(resultCount)}장</small>
                          </div>
                          <button type="button" disabled={currentPage === pageCount} onClick={() => changePage(currentPage + 1)}>다음</button>
                        </nav>
                      )}
                    </>
                  )}
                </>}
              </BulkCollectionControls>
            </div>
          </>
        ) : <div className="empty-state"><p>등록된 부스터팩이 없습니다.</p></div>}
      </main>
      <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  )
}
