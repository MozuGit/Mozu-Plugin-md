import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import HomeLinks from './components/HomeLinks.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 首页「生态 / 工具 / 社区」三列区块
    app.component('HomeLinks', HomeLinks)
  }
} satisfies Theme
