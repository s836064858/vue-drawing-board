<template>
  <el-container class="editor-layout">
    <el-aside width="250px" class="left-aside">
      <div class="app-brand">
        <div class="logo-wrapper">
          <img :src="logoUrl" alt="Logo" class="logo-img" />
        </div>
        <span class="app-title">Sung Drawing</span>
      </div>
      <div class="layer-panel-container">
        <layer-panel />
      </div>
    </el-aside>
    <el-main class="main-content">
      <canvas-area ref="canvasAreaRef" @mode-change="handleModeChange" />
      <div class="toolbar-container">
        <toolbar-panel :active-tool="activeTool" :can-undo="canUndo" :can-redo="canRedo" @tool-change="handleToolChange" />
      </div>
      <size-info />
    </el-main>
    <el-aside width="300px">
      <property-panel />
    </el-aside>
  </el-container>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import LayerPanel from './components/layer-panel.vue'
import CanvasArea from './components/canvas-area.vue'
import PropertyPanel from './components/property-panel.vue'
import ToolbarPanel from './components/toolbar-panel.vue'
import SizeInfo from './components/size-info.vue'
import logoUrl from '@/assets/image/logo.png'

const canvasAreaRef = ref(null)
const activeTool = ref('select')
const canUndo = ref(false)
const canRedo = ref(false)

// 提供 getCanvasCore 方法给子组件 (LayerPanel) 使用
provide('getCanvasCore', () => canvasAreaRef.value?.getCanvasCore())

const handleModeChange = (mode) => {
  activeTool.value = mode
}

const handleHistoryChange = (state) => {
  canUndo.value = state.canUndo
  canRedo.value = state.canRedo
}

onMounted(() => {
  // 监听历史记录变化
  const checkCore = setInterval(() => {
    const core = canvasAreaRef.value?.getCanvasCore()
    if (core) {
      clearInterval(checkCore)
      // 注入回调
      core.callbacks.onHistoryChange = handleHistoryChange
    }
  }, 100)
})

const handleToolChange = (event) => {
  const canvasCore = canvasAreaRef.value?.getCanvasCore()
  if (!canvasCore) return

  if (event.type === 'mode') {
    activeTool.value = event.value
    canvasCore.setMode(event.value)
  } else if (event.type === 'action') {
    if (event.value === 'add-image') {
      canvasCore.addImage(event.data)
    } else if (event.value === 'undo') {
      canvasCore.undo()
    } else if (event.value === 'redo') {
      canvasCore.redo()
    }
  }
}
</script>

<style scoped>
.editor-layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.left-aside {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;
  background-color: #fff;
  z-index: 10;
}

.app-brand {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.logo-wrapper {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.app-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: -0.5px;
}

.layer-panel-container {
  flex: 1;
  overflow: hidden;
}

/* 覆盖 layer-panel 的边框，因为已经移到 aside 上了 */
:deep(.layer-panel) {
  border-right: none !important;
}

.main-content {
  padding: 0;
  position: relative;
}

.toolbar-container {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}
</style>
