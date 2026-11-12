import React, { useEffect, useRef, useState } from 'react'
import { exportData, parseBackupFile, type CardfolioBackup } from '../utils/dataTransfer'
import { useCollectionStore } from '../stores/useCollectionStore'
import { useWishlistStore } from '../stores/useWishlistStore'

interface Props {
  onClose: () => void
}

type Step =
  | { type: 'menu' }
  | { type: 'import-confirm'; data: CardfolioBackup }
  | { type: 'import-done'; collectionCount: number; wishlistCount: number }
  | { type: 'export-done' }

export const DataTransferDialog: React.FC<Props> = ({ onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>({ type: 'menu' })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const quantities = useCollectionStore((s) => s.quantities)
  const wishes = useWishlistStore((s) => s.wishes)

  const collectionCount = Object.keys(quantities).length
  const wishlistCount = Object.keys(wishes).length

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  /* ── 내보내기 ─────────────────────────── */
  const handleExport = () => {
    exportData(quantities, wishes)
    setStep({ type: 'export-done' })
  }

  /* ── 파일 선택 → 파싱 → 확인 단계 ───── */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setIsLoading(true)
    const result = await parseBackupFile(file)
    setIsLoading(false)
    // 파일 input 초기화 (같은 파일 재선택 허용)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!result.ok) {
      setError(result.error)
      return
    }
    setStep({ type: 'import-confirm', data: result.data })
  }

  /* ── 불러오기 확정 ───────────────────── */
  const handleImportConfirm = (data: CardfolioBackup) => {
    // collection 덮어쓰기
    useCollectionStore.setState({ quantities: data.collection })
    // wishlist 덮어쓰기
    useWishlistStore.setState({ wishes: data.wishlist })

    setStep({
      type: 'import-done',
      collectionCount: Object.keys(data.collection).length,
      wishlistCount: Object.keys(data.wishlist).length,
    })
  }

  /* ── 오버레이 클릭 닫기 ──────────────── */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="data-transfer-dialog">
        {/* 헤더 */}
        <div className="data-transfer-header">
          <h2 className="data-transfer-title">데이터 관리</h2>
          <button className="data-transfer-close-btn" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        {/* 콘텐츠 */}
        <div className="data-transfer-body">

          {/* ── 메뉴 단계 ── */}
          {step.type === 'menu' && (
            <>
              <p className="data-transfer-desc">
                보유 수량과 위시리스트를 JSON 파일로 백업하거나 복원합니다.<br />
                다른 기기나 브라우저로 데이터를 옮길 때 사용하세요.
              </p>

              <div className="data-transfer-stats">
                <span>보유 카드 종류: <strong>{collectionCount}종</strong></span>
                <span>위시리스트: <strong>{wishlistCount}장</strong></span>
              </div>

              {error && <p className="data-transfer-error">{error}</p>}

              <div className="data-transfer-actions">
                {/* 내보내기 */}
                <div className="data-transfer-card">
                  <div className="data-transfer-card-icon">⬇️</div>
                  <div className="data-transfer-card-info">
                    <strong>데이터 백업 (내보내기)</strong>
                    <span>현재 보유·위시리스트를 JSON 파일로 저장</span>
                  </div>
                  <button
                    className="data-transfer-btn primary"
                    onClick={handleExport}
                    disabled={collectionCount === 0 && wishlistCount === 0}
                  >
                    내보내기
                  </button>
                </div>

                {/* 불러오기 */}
                <div className="data-transfer-card">
                  <div className="data-transfer-card-icon">⬆️</div>
                  <div className="data-transfer-card-info">
                    <strong>데이터 복원 (불러오기)</strong>
                    <span>백업 JSON 파일에서 데이터 복원</span>
                  </div>
                  <button
                    className="data-transfer-btn secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    {isLoading ? '읽는 중…' : '파일 선택'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── 내보내기 완료 ── */}
          {step.type === 'export-done' && (
            <div className="data-transfer-result">
              <div className="data-transfer-result-icon success">✓</div>
              <p className="data-transfer-result-text">백업 파일이 다운로드되었습니다.</p>
              <button className="data-transfer-btn primary full" onClick={onClose}>확인</button>
            </div>
          )}

          {/* ── 불러오기 확인 단계 ── */}
          {step.type === 'import-confirm' && (
            <div className="data-transfer-confirm">
              <p className="data-transfer-warn">
                ⚠️ 현재 브라우저의 보유 및 위시리스트 데이터를 덮어씁니다.<br />
                계속 진행하시겠습니까?
              </p>
              <div className="data-transfer-stats">
                <span>백업 보유 종류: <strong>{Object.keys(step.data.collection).length}종</strong></span>
                <span>백업 위시리스트: <strong>{Object.keys(step.data.wishlist).length}장</strong></span>
              </div>
              <p className="data-transfer-date">
                백업 생성일시: {new Date(step.data.exportedAt).toLocaleString('ko-KR')}
              </p>
              <div className="data-transfer-confirm-btns">
                <button className="data-transfer-btn secondary" onClick={() => setStep({ type: 'menu' })}>취소</button>
                <button className="data-transfer-btn danger" onClick={() => handleImportConfirm(step.data)}>덮어쓰기</button>
              </div>
            </div>
          )}

          {/* ── 불러오기 완료 ── */}
          {step.type === 'import-done' && (
            <div className="data-transfer-result">
              <div className="data-transfer-result-icon success">✓</div>
              <p className="data-transfer-result-text">
                데이터를 성공적으로 불러왔습니다.<br />
                <strong>보유 {step.collectionCount}종 · 위시리스트 {step.wishlistCount}장</strong>
              </p>
              <button className="data-transfer-btn primary full" onClick={onClose}>완료</button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
