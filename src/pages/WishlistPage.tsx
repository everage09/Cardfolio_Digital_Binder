import React, { useState, useMemo, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { toPng } from 'html-to-image'
import { CardsData, Card } from '../types/card'
import { CardModal } from '../components/CardModal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useWishlistStore, WishlistSortMode } from '../stores/useWishlistStore'
import { WishlistGrid } from '../features/wishlist/WishlistGrid'
import { ExportViewForCapture } from '../features/wishlist/WishlistExportView'
import { getSortedPacks } from '../utils/packCategories'
import { sortWishedCards, WishedCardItem } from '../utils/wishlistSort'

interface WishlistPageProps {
  data: CardsData
}

/** 캡처 대상 div 내의 모든 <img>가 로드될 때까지 대기 */
async function waitForImages(el: HTMLElement): Promise<void> {
  const imgs = Array.from(el.querySelectorAll<HTMLImageElement>('img'))
  await Promise.all(
    imgs.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((res) => {
              img.onload = () => res()
              img.onerror = () => res() // 에러 이미지도 건너뛰기
            }),
    ),
  )
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ data }) => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const clearButtonRef = useRef<HTMLButtonElement>(null)
  const wishes = useWishlistStore((state) => state.wishes)
  const sortMode = useWishlistStore((state) => state.sortMode)
  const setSortMode = useWishlistStore((state) => state.setSortMode)
  const clearWishlist = useWishlistStore((state) => state.clearWishlist)

  // 7대 시리즈 공식 순서로 정렬된 팩 목록
  const sortedPacks = useMemo(() => getSortedPacks(data.packs), [data.packs])

  // 위시리스트에 있는 카드를 정렬된 팩 목록에서 수집 (팩 순서 유지)
  const wishedCards = useMemo(() => {
    const result: WishedCardItem[] = []
    sortedPacks.forEach((pack, packIndex) => {
      for (const card of pack.cards) {
        if (card.id in wishes) {
          result.push({ card, packName: pack.name, packIndex })
        }
      }
    })
    return result
  }, [sortedPacks, wishes])

  // 사용자가 선택한 정렬 기준에 따라 화면 표시용 목록 정렬
  const displayedCards = useMemo(() => {
    return sortWishedCards(wishedCards, sortMode)
  }, [wishedCards, sortMode])

  const wishCount = wishedCards.length

  /**
   * PNG 내보내기 — 동적 마운트 패턴
   * (이미지 내보내기는 정렬 모드와 무관하게 항상 부스터 팩 순서인 wishedCards 사용)
   */
  const handleExport = useCallback(async () => {
    if (wishCount === 0) return
    setIsExporting(true)

    // 임시 컨테이너: 화면에는 보이지 않지만 렌더링은 정상 수행
    const tempContainer = document.createElement('div')
    tempContainer.style.cssText =
      'position:fixed;top:0;left:0;opacity:0;pointer-events:none;z-index:-1;'
    document.body.appendChild(tempContainer)

    const root = ReactDOM.createRoot(tempContainer)

    try {
      // 캡처 대상 div를 콜백으로 받아옴
      const captureEl = await new Promise<HTMLDivElement>((resolve) => {
        root.render(
          <ExportViewForCapture
            wishedCards={wishedCards}
            wishes={wishes}
            onMount={resolve}
          />,
        )
      })

      // 모든 이미지 로드 완료까지 대기
      await waitForImages(captureEl)

      // 추가 렌더 안정화 대기 (글꼴·레이아웃 확정)
      await new Promise((res) => setTimeout(res, 120))

      const dataUrl = await toPng(captureEl, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      })

      const link = document.createElement('a')
      link.download = `wishlist_${new Date().toISOString().slice(0, 10)}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('PNG 내보내기 실패:', err)
      alert('이미지 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      root.unmount()
      tempContainer.remove()
      setIsExporting(false)
    }
  }, [wishCount, wishedCards, wishes])

  return (
    <div className="wishlist-page">
      <section className="wishlist-dashboard">
        <div className="wishlist-header-bar">
          <div className="wishlist-title-area">
            <h2 ref={titleRef} tabIndex={-1} className="wishlist-title">위시 리스트</h2>
            <span className="wishlist-count-badge">{wishCount}장</span>
          </div>
          <div className="wishlist-header-actions">
            {wishCount > 0 && (
              <>
                {/* 정렬 드롭다운: [이미지로 저장] 왼쪽에 배치 */}
                <div className="sort-control-group wishlist-sort-control">
                  <label htmlFor="wishlist-sort-select" className="sort-label">
                    정렬
                  </label>
                  <div className="sort-select-wrapper">
                    <select
                      id="wishlist-sort-select"
                      className="sort-select"
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as WishlistSortMode)}
                    >
                      <option value="pack">부스터 팩 순</option>
                      <option value="rarity-desc">등급 높은 순</option>
                      <option value="rarity-asc">등급 낮은 순</option>
                      <option value="idol-ko">아이돌 이름순 (가나다)</option>
                      <option value="idol-ja">아이돌 이름순 (가나순)</option>
                    </select>
                  </div>
                </div>

                <button
                  className="wishlist-export-btn"
                  onClick={handleExport}
                  disabled={isExporting}
                  title="위시 리스트를 PNG 이미지로 저장"
                >
                  {isExporting ? '저장 중…' : '🖼 이미지로 저장'}
                </button>
                <button
                  ref={clearButtonRef}
                  className="wishlist-clear-btn"
                  onClick={() => setIsClearDialogOpen(true)}
                >
                  전체 삭제
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {wishCount === 0 ? (
        <div className="wishlist-empty-state">
          <div className="wishlist-empty-icon">♡</div>
          <p className="wishlist-empty-text">위시 리스트가 비어 있어요.</p>
          <p className="wishlist-empty-hint">
            카드 목록 화면에서 카드를 클릭한 뒤 ♡ 버튼을 눌러 추가해 보세요.
          </p>
        </div>
      ) : (
        <WishlistGrid
          wishedCards={displayedCards}
          onSelectCard={(card) => setSelectedCard(card)}
        />
      )}

      <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      {isClearDialogOpen && <ConfirmDialog
        title="위시 리스트를 모두 비울까요?"
        description={`등록된 ${Object.keys(wishes).length.toLocaleString('ko-KR')}종의 카드와 목표 수량이 삭제됩니다. 삭제한 위시 리스트는 복구할 수 없습니다.`}
        confirmLabel="전체 삭제"
        onCancel={() => {
          setIsClearDialogOpen(false)
          requestAnimationFrame(() => clearButtonRef.current?.focus({ preventScroll: true }))
        }}
        onConfirm={() => {
          clearWishlist()
          setIsClearDialogOpen(false)
          requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }))
        }}
      />}
    </div>
  )
}
