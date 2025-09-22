/**
 * 定义基于pinia的store存储
 * 设置相关的store数据
 */
import { defineStore } from 'pinia'

// 创建store，defineStore调用后返回函数，调用该函数获得Store实体
const useCurrentStore = defineStore({
    // 必传的参数，id值，在store中唯一
    id: 'settingStore',
    // 定义数据，返回对象和属性
    state: () => ({
        currentFile: null,
        currentData: null,
        platform: null,
        amapMiles: null
    }),
    // 获取store模块的属性
    getters: {
        getCurrentFile: (state) => state.currentFile,
        getCurrentData: (state) => state.currentData,
        getPlatform: (state) => state.platform,
        getAmapMiles: (state) => state.amapMiles
    },
    // 设置store模块的属性
    actions: {
        setCurrentFile(fileName) { this.currentFile = fileName },
        setCurrentData(data) { this.currentData = data },
        setPlatform(platform) { this.platform = platform },
        setAmapMiles(mile) { this.amapMiles = mile }
    }
})

export default useCurrentStore
