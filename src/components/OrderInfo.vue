<template>
  <el-card shadow="hover" v-if="orderBaseInfo.startTime">
    <template #header><span style="font-weight: bold">订单信息</span></template>
    <el-row>
      <el-col :span="12">
        <el-statistic :title="keyNameMap['mile']" :value="orderBaseInfo.mile" suffix="km" :precision="2" />
      </el-col>
      <el-col :span="12">
        <el-statistic :title="keyNameMap['ridingTime']" :value="orderBaseInfo.ridingTime" :formatter="(value) => dayjs.duration(value, 'milliseconds').format('mm:ss')" />
      </el-col>
    </el-row>
    <el-divider />
    <el-descriptions :column="1" border>
      <el-descriptions-item label="文件名">
        <span class="file-name"><code>{{ currentStore.getCurrentFile }}</code></span>
      </el-descriptions-item>
      <el-descriptions-item v-for="i in showInfoMeta()" :label="i[0]">
        {{ i[1] }}
      </el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script setup>
import { reactive, watch, inject } from "vue";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import useCurrentStore from "@/store/modules/current_data.js";
const currentStore = useCurrentStore()
import { ElMessage } from "element-plus";

dayjs.extend(duration)

let orderBaseInfo = reactive({
  id: null,
  bikeId: null,
  startTime: null,
  endTime: null,
  startStation: null,
  endStation: null,
  payTime: null,
  mile: null,
  ridingTime: null,
  originCost: null,
  actualCost: null
}), keyNameMap = {
  id: '订单号',
  bikeId: '车辆编号',
  startTime: '骑行开始时间',
  startStation: '起始位置',
  endTime: '骑行结束时间',
  endStation: '结束位置',
  payTime: '订单支付时间',
  mile: '骑行里程',
  ridingTime: '骑行时长',
  originCost: '应付款',
  actualCost: '实付款'
}

// 表格中不显示'骑行里程'与'骑行时长'
const showInfoMeta = () => {
  const notShowInfoMeta = ['mile', 'ridingTime']
  return Object.entries(orderBaseInfo).reduce((prev, [key, value]) => {
    if ((!notShowInfoMeta.includes(key)) && (value !== null)) prev.push([keyNameMap[key], value])
    return prev
  }, [])
}

// 计算骑行时长
const calcDuration = (startTime, endTime) => {
  return dayjs.duration(endTime - startTime, 'milliseconds')
}

// 订单信息重置
const resetBaseInfo = () => {
  Object.assign(orderBaseInfo, {
    id: null,
    bikeId: null,
    startTime: null,
    endTime: null,
    payTime: null,
    mile: null,
    ridingTime: null,
    originCost: null,
    actualCost: null
  })
}

// 订单数据解析
let setOrderBaseInfo = (platform, resp) => {
  if (platform === 'xiaoan') {
    let { data: resData } = resp
    Object.assign(orderBaseInfo, {
      id: resData['id'],
      bikeId: resData['carId'],
      startTime: resData['startTime'],
      endTime: resData['endTime'],
      payTime: resData['payTime'],
      mile: resData['mile'] / 1000,
      ridingTime: +resData['ridingTime'],
      originCost: '￥' + (resData['originCost'] / 100).toFixed(2),
      actualCost: null
    })
  }
  else if (platform === 'mtdc' || platform === 'mtddc') {
    if (platform === 'mtdc') {
      ElMessage({
        type: 'warning',
        duration: 10000,
        message: "单车无法追踪实际骑行路线，美团单车路线图基于高德地图最优路径规划计算而得，非实际路线，仅供参考！"
      })
    }
    let { data: resData } = resp
    Object.assign(orderBaseInfo, {
      id: resData['bizData']['orderId'],
      bikeId: resData['bizData']['bikeId'],
      startTime: dayjs(resData['bizData']['orderDetail']['startTime']).format("YYYY-MM-DD HH:mm:ss"),
      endTime: dayjs(resData['bizData']['orderDetail']['endTime']).format("YYYY-MM-DD HH:mm:ss"),
      payTime: resData['uiData']['feeShowPanel']['ridingFeeInfo']['content'].slice(-1)[0]['content'],
      mile: parseFloat(resData['bizData']['mapInfo']['rideMiles']),
      ridingTime: calcDuration(resData['bizData']['orderDetail']['startTime'], resData['bizData']['orderDetail']['endTime']),
      originCost: '￥' + parseFloat(resData['uiData']['feeShowPanel']['ridingFeeInfo']['message']).toFixed(2),
      actualCost: '￥' + (parseFloat(resData['uiData']['feeShowPanel']['ridingFeeInfo']['message']) - resData['bizData']['orderDetail']['deductionFee'] / 100).toFixed(2)
    })
  }
  else if (platform === 'ddqjddc') {
    // 2024-10 滴滴青桔接口数据有变，分为旧API和新API，以下依次判断
    if ('order' in resp) {
      Object.assign(orderBaseInfo, {
        id: resp['order']['data']['orderDetail']['orderId'],
        bikeId: resp['order']['data']['orderDetail']['vehicleId'],
        startTime: resp['order']['data']['orderDetail']['orderStartTime'],
        endTime: resp['order']['data']['orderDetail']['orderEndTime'],
        payTime: resp['payment']['data']['paySuccTime'],
        mile: parseFloat(+resp['trace']['data']['distance'] / 1000),
        ridingTime: +resp['trace']['data']['ridingTime'] * 1000,
        originCost: '￥' + parseFloat(resp['trace']['data']['bhDetail']['cost'] / 100).toFixed(2),
        actualCost: '￥' + (resp['order']['data']['payFee'] / 100).toFixed(2)
      })
    }
    else {
      Object.assign(orderBaseInfo, {
        id: resp['trace']['data']['orderId'],
        bikeId: resp['trace']['data']['deviceId'],
        startTime: dayjs(resp['trace']['data']['begunTime']).format("YYYY-MM-DD HH:mm:ss"),
        endTime: dayjs(resp['trace']['data']['finishedTime']).format("YYYY-MM-DD HH:mm:ss"),
        payTime: dayjs(resp['payment']['data']['paySuccTime']).format("YYYY-MM-DD HH:mm:ss"),
        mile: parseFloat(+resp['trace']['data']['distance'] / 1000),
        ridingTime: +resp['trace']['data']['orderBizExtend']['ridingTime'] * 1000,
        originCost: '￥' + parseFloat(resp['payment']['data']['totalFee'] / 100).toFixed(2),
        actualCost: '￥' + parseFloat(resp['payment']['data']['actualPayFee'] / 100).toFixed(2)
      })
    }
  }
  else if (platform === 'dingda') {
    ElMessage({
      type: 'warning',
      duration: 10000,
      message: "单车无法追踪实际骑行路线，叮达出行路线图及里程数基于高德地图最优路径规划计算而得，非实际路线，仅供参考！"
    })
    Object.assign(orderBaseInfo, {
      id: resp['id'],
      bikeId: resp['bikeId'],
      startTime: dayjs(+resp['hireTime']).format("YYYY-MM-DD HH:mm:ss"),
      startStation: resp['hireStationName'],
      endTime: dayjs(+resp['restoreTime']).format("YYYY-MM-DD HH:mm:ss"),
      endStation: resp['restoreStationName'],
      payTime: null,
      mile: 0,
      ridingTime: calcDuration(resp['hireTime'], resp['restoreTime']),
      originCost: '￥' + parseFloat(resp['money'] / 100).toFixed(2),
      actualCost: null
    })
  }
  else if (platform === 'tongxiang') {
    ElMessage({
      type: 'success',
      duration: 10000,
      message: "已处理GPS坐标系为GCJ02"
    })
    Object.assign(orderBaseInfo, {
      id: resp['order']['data']['id'],
      bikeId: resp['order']['data']['qrcode'],
      startTime: dayjs(resp['order']['data']['stime'] * 1000).format("YYYY-MM-DD HH:mm:ss"),
      endTime: dayjs(resp['order']['data']['etime'] * 1000).format("YYYY-MM-DD HH:mm:ss"),
      payTime: 'Record it manually.',
      mile: parseFloat(+resp['order']['data']['all_mile'] / 1000),
      ridingTime: calcDuration(resp['order']['data']['stime'] * 1000, resp['order']['data']['etime'] * 1000),
      originCost: '￥' + (resp['order']['data']['allprice']).toFixed(2)
    })
  }
  else {
    ElMessage({
      type: 'error',
      duration: 5000,
      message: "类型不支持！"
    })
    resetBaseInfo()
  }
}

watch(() => currentStore.getCurrentData, newV => {
  resetBaseInfo()
  try {
    setOrderBaseInfo(currentStore.getPlatform, newV)
  } catch(e) {
    console.log(e)
    ElMessage({
      type: 'error',
      duration: 5000,
      message: `订单数据解析失败，请检查是否为所属平台的数据！`
    })
  }
})

// 对于需要计算里程的数据，监听，使页面上及时更新数据
watch(() => currentStore.getAmapMiles, newV => {
  orderBaseInfo.mile = newV / 1000
})
</script>

<style scoped>
.file-name {
  background-color: #f2f2f2;
  color: #72767b;
  margin: 0 4px 0;
  padding: 2px 6px 2px;
  border-radius: 4px;
}

.el-col {
  text-align: center;
}
</style>
