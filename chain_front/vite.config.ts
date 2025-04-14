import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vitePluginsAutoI18n, { 
  BaiduTranslator 
} from 'vite-auto-i18n-plugin'

const i18nPlugin = vitePluginsAutoI18n({
  globalPath: './lang', // 存放翻译文件的目录
  namespace: 'lang', // 命名空间
  distPath: './dist/assets',
  distKey: 'index',
  targetLangList: ['en', 'ko', 'ja'], // 目标语言列表，英文，韩文，日文
  originLang: 'zh-cn',
  // 选择翻译器，有道、谷歌或百度
  // 百度翻译
  translator: new BaiduTranslator({
    appId: '20250414002332588',
    appKey: 'eLXJG_amVDe1YDPSDmm7'
  })
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    i18nPlugin
  ],
})
