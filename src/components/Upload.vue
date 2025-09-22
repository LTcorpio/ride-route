<template>
  <!--  选择服务商  -->
  <el-select
      v-model="currentServer"
      placeholder="请选择服务商"
      size="large"
      @change="handleServerChange"
  >
    <el-option-group
        v-for="group in serverList"
        :key="group.label"
        :label="group.label"
    >
      <el-option
          v-for="item in group.options"
          :key="item.value"
          :label="item.label"
          :value="{ value: item.value, label: item.label }"
      />
    </el-option-group>
  </el-select>
  <el-upload
      action=""
      drag
      multiple
      v-if="currentServer"
      :auto-upload="false"
      :on-change="handleFileChange"
      :on-preview="handleFileChange"
  >
    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
    <div class="el-upload__text">
      将文件拖到此处，或<em>点击上传</em>
    </div>
    <template #tip>
      <div class="el-upload__tip">
        {{ desc }}
      </div>
    </template>
  </el-upload>
</template>

<script setup>
import { UploadFilled } from '@element-plus/icons-vue'
import useCurrentStore from "@/store/modules/current_data.js";
const currentStore = useCurrentStore()
import { ElMessage } from "element-plus";
import { ref } from "vue";

let fileContent = ref(), currentServer = ref(), desc = ref('')
let serverList = [
  {
    label: '单车',
    options: [
      { value: 'mtdc', label: '美团单车' },
      { value: 'dingda', label: '叮达系列单车 (城市公共自行车)' },
    ]
  },
  {
    label: '电单车',
    options: [
      { value: 'mtddc', label: '美团电单车' },
      { value: 'ddqjddc', label: '滴滴青桔电单车' },
      { value: 'xiaoan', label: '小安系列电单车 (绍兴马亚骑行、浙大毛豆出行等)' },
      { value: 'tongxiang', label: '桐享同行电单车 (嘉兴桐乡共享电单车)' },
    ]
  }
]

let handleServerChange = (server) => {
  currentStore.setPlatform(server.value)
  desc.value = `请上传${currentServer.value.label}的接口数据`
}

let handleFileChange = (file) => {
  let reader = new FileReader();
  reader.onload = (e) => {
    try {
      currentStore.setCurrentFile(file.name)
      fileContent.value = JSON.parse(e.target.result);
      currentStore.setCurrentData(fileContent.value);
    } catch (e) {
      ElMessage.error(`“${currentStore.getCurrentFile}”不是合法的 JSON 文件！`)
    }
  };
  reader.readAsText(file.raw);
}
</script>
