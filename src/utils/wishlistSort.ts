import { Card } from '../types/card'
import { Idol } from '../types/idol'
import idolData from '../data/idol.json'
import { WishlistSortMode } from '../stores/useWishlistStore'

export interface WishedCardItem {
  card: Card
  packName: string
  packIndex: number
}

// 빠른 조회를 위한 아이돌 맵 생성
const idolMap = new Map<string, Idol>(
  idolData.idols.map((idol) => [idol.id, idol])
)

// 히라가나 읽기(alias 중 히라가나 패턴) 또는 nameJa 추출
const HIRAGANA_REGEX = /^[\u3040-\u309F]+$/
function getIdolKana(idol: Idol): string {
  const kanaAlias = idol.aliases.find((a) => HIRAGANA_REGEX.test(a))
  return kanaAlias ?? idol.nameJa
}

/**
 * 위시리스트 카드 목록을 사용자가 선택한 정렬 기준에 따라 정렬합니다.
 *
 * 1. 'pack': 기존 7대 시리즈 공식 순서 및 팩 내 번호(sortOrder) 순서
 * 2. 'rarity-desc': 레어도 높은 순 (SEC/SSR/MR/MR+ -> N/R), 동일 등급 내 팩 순서 및 카드 번호 순
 * 3. 'rarity-asc': 레어도 낮은 순 (N/R -> SEC/SSR/MR/MR+), 동일 등급 내 팩 순서 및 카드 번호 순
 * 4. 'idol-ko':
 *    - 1인 카드: 아이돌 한글 이름(nameKo) 가나다 오름차순
 *    - 단체 카드(2인 이상): 이름순 정렬 맨 뒤에 팩 순서대로 배치
 *    - 인물 정보 없는 카드: 가장 맨 뒤에 팩 순서대로 배치
 * 5. 'idol-ja':
 *    - 1인 카드: 아이돌 일본 가나(五十音/히라가나) 오름차순
 *    - 단체 카드(2인 이상): 이름순 정렬 맨 뒤에 팩 순서대로 배치
 *    - 인물 정보 없는 카드: 가장 맨 뒤에 팩 순서대로 배치
 */
export function sortWishedCards(
  items: WishedCardItem[],
  sortMode: WishlistSortMode
): WishedCardItem[] {
  const list = [...items]

  if (sortMode === 'pack') {
    // 팩 순서(packIndex) -> 팩 내 카드 번호(sortOrder)
    return list.sort((a, b) => {
      if (a.packIndex !== b.packIndex) {
        return a.packIndex - b.packIndex
      }
      return a.card.sortOrder - b.card.sortOrder
    })
  }

  if (sortMode === 'rarity-desc' || sortMode === 'rarity-asc') {
    return list.sort((a, b) => {
      const aRank = a.card.rarityRank ?? 0
      const bRank = b.card.rarityRank ?? 0
      const rankDiff = aRank - bRank

      if (rankDiff !== 0) {
        return sortMode === 'rarity-desc' ? -rankDiff : rankDiff
      }

      // 동일 등급 내에서는 팩 순서 -> 카드 번호 순
      if (a.packIndex !== b.packIndex) {
        return a.packIndex - b.packIndex
      }
      return a.card.sortOrder - b.card.sortOrder
    })
  }

  // 아이돌 이름순 정렬 ('idol-ko' 또는 'idol-ja')
  return list.sort((a, b) => {
    const aIdols = a.card.idolIds ?? []
    const bIdols = b.card.idolIds ?? []

    // 1: 솔로(1명), 2: 단체(2명 이상), 3: 미등록(0명)
    const getGroupType = (ids: string[]) => {
      if (ids.length === 1) return 1
      if (ids.length > 1) return 2
      return 3
    }

    const aGroup = getGroupType(aIdols)
    const bGroup = getGroupType(bIdols)

    // 서로 그룹이 다르면 솔로(1) -> 단체(2) -> 미등록(3) 순
    if (aGroup !== bGroup) {
      return aGroup - bGroup
    }

    // 둘 다 단체 카드이거나 둘 다 미등록 카드인 경우: 팩 순서 -> 카드 번호 순
    if (aGroup === 2 || aGroup === 3) {
      if (a.packIndex !== b.packIndex) {
        return a.packIndex - b.packIndex
      }
      return a.card.sortOrder - b.card.sortOrder
    }

    // 둘 다 1인 개인 카드인 경우: 이름순 비교
    const aIdol = idolMap.get(aIdols[0])
    const bIdol = idolMap.get(bIdols[0])

    if (sortMode === 'idol-ko') {
      const aName = aIdol?.nameKo ?? ''
      const bName = bIdol?.nameKo ?? ''
      const comp = aName.localeCompare(bName, 'ko')
      if (comp !== 0) return comp
    } else {
      // idol-ja: 히라가나 읽기 우선, 없으면 nameJa
      const aKana = aIdol ? getIdolKana(aIdol) : ''
      const bKana = bIdol ? getIdolKana(bIdol) : ''
      const comp = aKana.localeCompare(bKana, 'ja')
      if (comp !== 0) return comp
    }

    // 동일 인물인 경우 팩 순서 -> 카드 번호 순
    if (a.packIndex !== b.packIndex) {
      return a.packIndex - b.packIndex
    }
    return a.card.sortOrder - b.card.sortOrder
  })
}
