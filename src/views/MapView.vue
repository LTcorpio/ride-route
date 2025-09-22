<template>
  <el-container>
    <el-aside width="30%">
      <OrderInfo />
      <Upload />
    </el-aside>
    <el-main><Map /></el-main>
  </el-container>
</template>

<script setup>
import Upload from "@/components/Upload.vue";
import Map from "@/components/Map.vue";
import OrderInfo from "@/components/OrderInfo.vue";
</script>

<style scoped>
.el-container {
  height: 100%;
}

.el-aside {
  padding: 20px;
}
</style>
