import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vitePluginsAutoI18n, { BaiduTranslator } from "vite-auto-i18n-plugin";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

const i18nPlugin = vitePluginsAutoI18n({
  globalPath: "./lang", // 存放翻译文件的目录
  namespace: "lang", // 命名空间
  distPath: "./dist/assets",
  distKey: "index",
  targetLangList: ["en", "ko", "ja"], // 目标语言列表，英文，韩文，日文
  originLang: "zh-cn",
  // 选择翻译器，有道、谷歌或百度
  // 百度翻译
  translator: new BaiduTranslator({
    appId: "20250414002332588",
    appKey: "eLXJG_amVDe1YDPSDmm7",
  }),
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), i18nPlugin, tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // 假设你的后端服务运行在3001端口
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // 如果后端路径不包含/api前缀则取消注释
      }
    }
  }
});
