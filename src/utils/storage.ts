import Taro from '@tarojs/taro'

/** 小程序存储简易封装（JSON 序列化），签名与网页版一致 */
export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = Taro.getStorageSync(key) as string
      if (raw == null || raw === '') return fallback
      return JSON.parse(raw) as T
    } catch (e) {
      console.warn('[storage.get]', key, e)
      return fallback
    }
  },
  set<T>(key: string, value: T) {
    try {
      Taro.setStorageSync(key, JSON.stringify(value))
    } catch (e) {
      console.warn('[storage.set]', key, e)
    }
  },
  remove(key: string) {
    try {
      Taro.removeStorageSync(key)
    } catch (e) {
      console.warn('[storage.remove]', key, e)
    }
  },
}
