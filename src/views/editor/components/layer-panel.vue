<template>
  <div class="layer-panel">
    <div class="panel-header">
      <i class="ri-layers-line icon"></i>
      <h3>图层管理</h3>
    </div>
    <div class="panel-content custom-scrollbar" @dragover.prevent @drop="onPanelDrop">
      <div v-if="layers.length > 0" class="layer-list">
        <LayerItem
          v-for="layer in layers"
          :key="layer.id"
          :layer="layer"
          :selected-ids="selectedLayerIds"
          :dragging-id="draggingId"
          :drag-over-id="dragOverId"
          :drop-position="dropPosition"
          @select="handleSelect"
          @toggle-visible="handleToggleVisible"
          @toggle-lock="handleToggleLock"
          @remove="handleRemove"
          @drag-start="onDragStart"
          @drag-over="onDragOver"
          @drag-leave="onDragLeave"
          @drop="onDrop"
          @drag-end="onDragEnd"
        />
      </div>
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-empty description="暂无图层" :image-size="80" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { useStore } from 'vuex'
import LayerItem from './layer-item.vue'

const store = useStore()

// 拖拽状态
const draggingId = ref(null)
const dragOverId = ref(null)
const dropPosition = ref(null) // 'before' | 'after'

// 从 Store 获取图层数据
const layers = computed(() => store.state.layers)
const selectedLayerIds = computed(() => store.state.selectedLayerIds)

const getCanvasCore = inject('getCanvasCore')

const getCore = () => {
  if (getCanvasCore) return getCanvasCore()
  return null
}

// 拖拽事件处理
const onDragStart = (e, layer) => {
  draggingId.value = layer.id
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', layer.id)
  e.target.style.opacity = '0.5'
}

const onDragOver = (e, layer) => {
  if (draggingId.value === layer.id) {
    dragOverId.value = null
    dropPosition.value = null
    return
  }

  dragOverId.value = layer.id

  const rect = e.currentTarget.getBoundingClientRect()
  const offsetY = e.clientY - rect.top

  if (offsetY < rect.height / 2) {
    dropPosition.value = 'before'
  } else {
    dropPosition.value = 'after'
  }
}

const onDragLeave = (e) => {
  // 简单处理
}

const onDrop = (e, targetLayer) => {
  e.preventDefault()

  if (draggingId.value && draggingId.value !== targetLayer.id) {
    const core = getCore()
    if (core) {
      core.reorderLayer(draggingId.value, targetLayer.id, dropPosition.value)
    }
  }

  clearDragState()
}

const onPanelDrop = (e) => {
  clearDragState()
}

const onDragEnd = (e) => {
  e.target.style.opacity = ''
  clearDragState()
}

const clearDragState = () => {
  draggingId.value = null
  dragOverId.value = null
  dropPosition.value = null
}

const handleSelect = (layer) => {
  const core = getCore()
  if (core) {
    core.selectLayer(layer.id)
  }
}

const handleToggleVisible = (layer) => {
  const core = getCore()
  if (core) {
    core.toggleVisible(layer.id)
  }
}

const handleToggleLock = (layer) => {
  const core = getCore()
  if (core) {
    core.toggleLock(layer.id)
  }
}

const handleRemove = (layer) => {
  const core = getCore()
  if (core) {
    core.removeLayer(layer.id)
  }
}
</script>

<style scoped>
.layer-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-right: 1px solid #e5e7eb;
  user-select: none;
}

.panel-header {
  height: 50px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  background-color: #fff;
}

.panel-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.icon {
  margin-right: 10px;
  font-size: 18px;
  color: #4b5563;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.layer-list {
  display: flex;
  flex-direction: column;
}

/* 滚动条样式 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.empty-state {
  display: flex;
  justify-content: center;
  padding-top: 40px;
}
</style>
