/**
 * 治愈金句数据（简化版，仅用于测试）
 * 完整版请参考 frontend/src/data/verses.ts
 */

export interface Verse {
  id: number
  ref: string
  refEn: string
  zh: string
  en: string
  tag?: 'love' | 'faith' | 'hope' | 'peace' | 'wisdom' | 'strength' | 'grace' | 'comfort' | 'joy'
}

export const VERSES: Verse[] = [
  { id: 1, ref: '约翰福音 3:16', refEn: 'John 3:16', tag: 'love',
    zh: '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。',
    en: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.' },
  { id: 2, ref: '约翰一书 4:7-8', refEn: '1 John 4:7-8', tag: 'love',
    zh: '亲爱的弟兄啊，我们应当彼此相爱，因为爱是从神来的。凡有爱心的，都是由神而生，并且认识神。',
    en: 'Beloved, let us love one another, for love is from God, and whoever loves has been born of God and knows God.' },
  { id: 3, ref: '哥林多前书 13:4-7', refEn: '1 Cor 13:4-7', tag: 'love',
    zh: '爱是恒久忍耐，又有恩慈；爱是不嫉妒，爱是不自夸，不张狂。',
    en: 'Love is patient and kind; love does not envy or boast; it is not arrogant or rude.' },
  { id: 4, ref: '腓立比书 4:13', refEn: 'Phil 4:13', tag: 'strength',
    zh: '我靠着那加给我力量的，凡事都能做。',
    en: 'I can do all things through Christ who strengthens me.' },
  { id: 5, ref: '以赛亚书 40:31', refEn: 'Isaiah 40:31', tag: 'hope',
    zh: '但那等候耶和华的，必从新得力。他们必如鹰展翅上腾。',
    en: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles.' },
  { id: 6, ref: '诗篇 23:1', refEn: 'Psalm 23:1', tag: 'comfort',
    zh: '耶和华是我的牧者，我必不致缺乏。',
    en: 'The Lord is my shepherd, I shall not want.' },
  { id: 7, ref: '箴言 3:5-6', refEn: 'Prov 3:5-6', tag: 'wisdom',
    zh: '你要专心仰赖耶和华，不可倚靠自己的聪明。',
    en: 'Trust in the Lord with all your heart and lean not on your own understanding.' },
  { id: 8, ref: '耶利米书 29:11', refEn: 'Jer 29:11', tag: 'hope',
    zh: '耶和华说：我知道我向你们所怀的意念，是赐平安的意念。',
    en: 'For I know the plans I have for you, declares the Lord, plans to prosper you.' },
  { id: 9, ref: '马太福音 11:28', refEn: 'Matt 11:28', tag: 'comfort',
    zh: '凡劳苦担重担的人，可以到我这里来，我就使你们得安息。',
    en: 'Come to me, all who are weary and burdened, and I will give you rest.' },
  { id: 10, ref: '诗篇 46:10', refEn: 'Psalm 46:10', tag: 'peace',
    zh: '你们要休息，要知道我是神！',
    en: 'Be still, and know that I am God!' },
]

export const TAGS_CN: Record<string, { label: string; icon: string }> = {
  all:     { label: '全部', icon: '🌈' },
  love:     { label: '爱',   icon: '❤️' },
  faith:    { label: '信心', icon: '✝️' },
  hope:     { label: '盼望', icon: '🌅' },
  peace:    { label: '平安', icon: '🕊️' },
  wisdom:   { label: '智慧', icon: '💡' },
  strength: { label: '力量', icon: '💪' },
  grace:    { label: '恩典', icon: '🌸' },
  comfort:  { label: '安慰', icon: '🤗' },
  joy:      { label: '喜乐', icon: '😊' },
}
