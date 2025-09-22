<template>
  <el-button type="primary" @click="promptFolderSelection">选择文件夹</el-button>
  <input type="file" ref="folderInput" webkitdirectory style="display: none" @change="handleFolderSelect" />

  <div>
    <h3>选择的文件：</h3>
    <ul>
      <li v-for="file in files" :key="file.name">{{ file.name }}</li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElButton } from 'element-plus';

const files = ref([]);

const folderInput = ref(null);

const promptFolderSelection = () => {
  folderInput.value.click();
};

const handleFolderSelect = event => {
  files.value = Array.from(event.target.files);
  console.log(files.value);
};
</script>

<style scoped>
/* 这里可以添加一些自定义样式 */
</style>
