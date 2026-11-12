/**
 * 보유 수량 + 위시리스트 데이터를 JSON 파일로 내보내거나 불러오는 유틸리티
 */

export interface CardfolioBackup {
  /** 백업 포맷 버전 (호환성 관리용) */
  version: 1
  /** 백업 생성 일시 (ISO 8601) */
  exportedAt: string
  /** 보유 수량: { [cardId]: number } */
  collection: Record<string, number>
  /** 위시리스트: { [cardId]: number (목표 수량) } */
  wishlist: Record<string, number>
}

/** 백업 데이터를 JSON 파일로 다운로드 */
export function exportData(
  collection: Record<string, number>,
  wishlist: Record<string, number>,
): void {
  const backup: CardfolioBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    collection,
    wishlist,
  }

  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const a = document.createElement('a')
  a.href = url
  a.download = `cardfolio-backup-${dateStr}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export type ImportResult =
  | { ok: true; data: CardfolioBackup }
  | { ok: false; error: string }

/** 파일에서 백업 데이터를 파싱하여 반환 */
export function parseBackupFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    if (!file.name.endsWith('.json')) {
      resolve({ ok: false, error: 'JSON 파일만 불러올 수 있습니다.' })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string)

        // 기본 구조 검증
        if (raw.version !== 1) {
          resolve({ ok: false, error: `지원하지 않는 백업 버전입니다. (version: ${raw.version})` })
          return
        }
        if (typeof raw.collection !== 'object' || typeof raw.wishlist !== 'object') {
          resolve({ ok: false, error: '백업 파일 형식이 올바르지 않습니다.' })
          return
        }

        resolve({ ok: true, data: raw as CardfolioBackup })
      } catch {
        resolve({ ok: false, error: '파일을 읽는 중 오류가 발생했습니다. 올바른 백업 파일인지 확인하세요.' })
      }
    }
    reader.onerror = () => resolve({ ok: false, error: '파일 읽기 실패.' })
    reader.readAsText(file)
  })
}
