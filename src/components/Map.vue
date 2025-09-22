<template>
  <div id="map-dom">
    <div class="empty">路线图可视化面板</div>
  </div>
</template>

<script setup>
import AMapLoader from '@amap/amap-jsapi-loader';
import { onUnmounted, watch } from "vue";
import useCurrentStore from "@/store/modules/current_data.js";
import { ElMessage } from "element-plus";
import gcoord from 'gcoord';
import Marker_b from '@/assets/icons/mark_b.png';
import Marker_r from '@/assets/icons/mark_r.png';
const currentStore = useCurrentStore()
let AMap = null, map = null, lineArr = [], start_pos, end_pos, center

let initMap = async (center) => {
  AMap = await AMapLoader.load({
    key: "a7414b85a61625579d7c9ae6d452a5b9", //申请好的Web端开发者 Key，调用 load 时必填
    version: "2.0",
    plugins: ["AMap.Scale", "AMap.Walking"],
  })
  map = new AMap.Map("map-dom", {
    zoom: 16, // 初始化地图级别
    center: center, // 初始化地图中心点位置
    // mapStyle: 'amap://styles/whitesmoke' // 地图样式，whitesmoke代表灰度地图
  })
}

let initData = async (platform, raw_data) => {
  lineArr = []
  if (platform === 'xiaoan') {
    raw_data['data']['deviceTrajectory'].forEach(curr => lineArr.push([curr['lng'], curr['lat']]))
    start_pos = [raw_data['data']['startLng'], raw_data['data']['startLat']]
    end_pos = [raw_data['data']['endLng'], raw_data['data']['endLat']]
    center = [(start_pos[0] + end_pos[0]) / 2, (start_pos[1] + end_pos[1]) / 2]
    await initMap(center)
    setPoint(map, start_pos, end_pos)
    drawRoute(lineArr)
  }
  else if (platform === 'mtdc') {
    start_pos = raw_data['data']['bizData']['mapInfo']['startLonlat'].split(",").map(curr => parseFloat(curr))
    lineArr.push(start_pos)
    end_pos = raw_data['data']['bizData']['mapInfo']['endLonlat'].split(",").map(curr => parseFloat(curr))
    center = [(start_pos[0] + end_pos[0]) / 2, (start_pos[1] + end_pos[1]) / 2]
    await initMap(center)
    let ridingRoute = new AMap.Walking()
    ridingRoute.search(start_pos, end_pos, function (status, result) {
      result['routes'][0]['steps'].forEach(curr => {
        lineArr.push(
          [curr['start_location']['lng'], curr['start_location']['lat']],
          [curr['end_location']['lng'], curr['end_location']['lat']],
        )
      })
      lineArr.push(end_pos)
      setPoint(map, start_pos, end_pos)
      drawRoute(lineArr)
      currentStore.setAmapMiles(parseInt(AMap.GeometryUtil.distanceOfLine(lineArr)))
    })
  }
  else if (platform === 'mtddc') {
    raw_data['data']['bizData']['mapInfo']['trackPoints'].split("#").forEach(curr => {
      let [ lng, lat ] = curr.split(",").map(singleP => parseFloat(singleP))
      lineArr.push([lng, lat])
    })
    start_pos = raw_data['data']['bizData']['mapInfo']['startLonlat'].split(",").map(curr => parseFloat(curr))
    end_pos = raw_data['data']['bizData']['mapInfo']['endLonlat'].split(",").map(curr => parseFloat(curr))
    center = [(start_pos[0] + end_pos[0]) / 2, (start_pos[1] + end_pos[1]) / 2]
    await initMap(center)
    setPoint(map, start_pos, end_pos)
    drawRoute(lineArr)
    currentStore.setAmapMiles(parseInt(AMap.GeometryUtil.distanceOfLine(lineArr)))
  }
  else if (platform === 'ddqjddc') {
    // 滴滴青桔的起始位置精度足够，但具体路线精度不够，将首尾位置也添加进lineArr以保证路线图是不间断的
    // 2024-10 滴滴青桔接口数据有变，分为旧API和新API，以下依次判断
    if ('order' in raw_data) {
      start_pos = [ raw_data['order']['data']['orderDetail']['startLng'], raw_data['order']['data']['orderDetail']['startLat'] ]
      lineArr.push(start_pos)
      raw_data['trace']['data']['bhDetail']['coordinates'].forEach(curr => lineArr.push([curr['lng'], curr['lat']]))
      end_pos = [ raw_data['order']['data']['orderDetail']['endLng'], raw_data['order']['data']['orderDetail']['endLat'] ]
      lineArr.push(end_pos)
    } else {
      start_pos = [ raw_data['trace']['data']['startLng'], raw_data['trace']['data']['startLat'] ]
      raw_data['trace']['data']['orderBizExtend']['coordinateList'].forEach(curr => lineArr.push([curr['lng'], curr['lat']]))
      end_pos = [ raw_data['trace']['data']['endLng'], raw_data['trace']['data']['endLat'] ]
    }
    center = [(start_pos[0] + end_pos[0]) / 2, (start_pos[1] + end_pos[1]) / 2]
    await initMap(center)
    setPoint(map, start_pos, end_pos)
    drawRoute(lineArr)
  }
  else if (platform === 'dingda') {
    start_pos = raw_data['hireCoord'].split(",").map(curr => parseFloat(curr))
    end_pos = raw_data['restoreCoord'].split(",").map(curr => parseFloat(curr))
    center = [(start_pos[0] + end_pos[0]) / 2, (start_pos[1] + end_pos[1]) / 2]
    // 骑行路线--高德地图
    await initMap(center)
    let ridingRoute = new AMap.Walking()
    ridingRoute.search(start_pos, end_pos, function (status, result) {
      lineArr.push(start_pos)
      result['routes'][0]['steps'].forEach(curr => {
        lineArr.push(
          [curr['start_location']['lng'], curr['start_location']['lat']],
          [curr['end_location']['lng'], curr['end_location']['lat']],
        )
      })
      lineArr.push(end_pos)
      setPoint(map, start_pos, end_pos)
      drawRoute(lineArr)
      // 高德地图计算路线里程，借助Pinia传给OrderInfo组件
      currentStore.setAmapMiles(parseInt(AMap.GeometryUtil.distanceOfLine(lineArr)))
    })
  }
  else if (platform === 'tongxiang') {
    // 高德地图坐标系使用GCJ-02标准(火星坐标系)，桐享同行后台接口的坐标系为WGS84标准(GPS坐标系)
    // 将WGS84转GCJ-02，使用gcoord第三方库
    lineArr = raw_data['trace']['data'].map(curr => {
      return gcoord.transform([curr['lng'], curr['lat']], gcoord.WGS84, gcoord.GCJ02)
    })
    start_pos = lineArr[0]
    end_pos = lineArr.slice(-1)[0]
    center = [(start_pos[0] + end_pos[0]) / 2, (start_pos[1] + end_pos[1]) / 2]
    await initMap(center)
    setPoint(map, start_pos, end_pos)
    drawRoute(lineArr)
  }
}

let drawRoute = (pathList) => {
  // 路线样式配置
  let Curve = new AMap.BezierCurve({
    path: pathList,
    isOutline: true,
    outlineColor: '#ffeeff',
    borderWeight: 3,
    strokeColor: "#3366FF",
    strokeOpacity: 1,
    strokeWeight: 6,
    strokeStyle: (() => (pathList.length > 2) ? "solid" : "dashed")(),
    strokeDasharray: [10, 10],
    lineJoin: 'round',
    lineCap: 'round',
    zIndex: 50,
  })
  map.add(Curve);
}

let setPoint = (map, start_pos, end_pos) => {
  // 起终点样式
  const marker_start = new AMap.Marker({
    position: start_pos,
    label: { content: '起点' },
    icon: Marker_b,
    offset: new AMap.Pixel(-9.5, -31)
  });
  const marker_end = new AMap.Marker({
    position: end_pos,
    label: { content: '终点' },
    icon: Marker_r,
    offset: new AMap.Pixel(-9.5, -31)
  });
  map.add(marker_start);
  map.add(marker_end);
  map.setFitView()
}

onUnmounted(() => {
  map?.destroy();
});

watch(() => currentStore.getCurrentData, async newValue => {
  try {
    await initData(currentStore.getPlatform, newValue)
  } catch(e) {
    console.log(e)
    ElMessage({
      type: 'error',
      duration: 10000
    }, `地图数据渲染失败，请检查上传接口的经纬度信息！`)
    map?.destroy();
  }
})
</script>

<style scoped>
#map-dom {
  height: 100%;
  background-color: #f2f2f2;
}

.empty {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 48px;
  color: #909399;
}
</style>
