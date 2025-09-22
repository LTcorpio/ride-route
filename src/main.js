import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import store from './store'
import axios from 'axios'

// 高德地图安全密钥配置
window._AMapSecurityConfig = {
    securityJsCode: '0c4c16113009f8e74bf39bbb4894034e' //*  安全密钥
}

const app = createApp(App)

// Axios全局配置
app.provide('$axios', axios)

app.use(store)
app.use(ElementPlus)
app.mount('#app')
