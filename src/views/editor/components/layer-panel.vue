<template>
  <div class="layer-panel">
    <div class="panel-header">
      <i class="ri-layers-line icon"></i>
      <h3>图层管理</h3>
    </div>
    <div class="panel-content custom-scrollbar" @dragover.prevent @drop="onPanelDrop">
      <div v-if="layers.length > 0" class="layer-list">
        <div
          v-for="layer in layers"
          :key="layer.id"
          class="layer-item"
          :class="{
            active: isSelected(layer.id),
            'is-dragging': draggingId === layer.id,
            'drag-over-top': dragOverId === layer.id && dropPosition === 'before',
            'drag-over-bottom': dragOverId === layer.id && dropPosition === 'after'
          }"
          draggable="true"
          @click="handleSelect(layer)"
          @dragstart="onDragStart($event, layer)"
          @dragover.prevent="onDragOver($event, layer)"
          @dragleave="onDragLeave($event)"
          @drop.stop="onDrop($event, layer)"
          @dragend="onDragEnd"
        >
          <!-- 选中指示条 -->
          <div class="active-bar" v-show="isSelected(layer.id)"></div>

          <!-- 图层名称 -->
          <div class="layer-info">
            <i class="type-icon" :class="getTypeIcon(layer.type)"></i>
            <span class="name-text">{{ layer.name }}</span>
          </div>

          <div class="layer-actions">
            <!-- 锁定切换 -->
            <div class="layer-action lock-btn" @click.stop="handleToggleLock(layer)" :class="{ 'is-locked': layer.locked }">
              <i v-if="layer.locked" class="ri-lock-2-line"></i>
              <i v-else class="ri-lock-unlock-line"></i>
            </div>

            <!-- 显隐切换 -->
            <div class="layer-action visible-btn" @click.stop="handleToggleVisible(layer)" :class="{ 'is-hidden': !layer.visible }">
              <i :class="layer.visible ? 'ri-eye-line' : 'ri-eye-off-line'"></i>
            </div>

            <!-- 删除按钮 -->
            <div class="layer-action delete-btn" @click.stop="handleRemove(layer)">
              <i class="ri-delete-bin-line"></i>
            </div>
          </div>
        </div>
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
  // 设置拖拽数据，以便调试或跨应用拖拽（可选）
  e.dataTransfer.setData('text/plain', layer.id)

  // 添加透明度效果
  e.target.style.opacity = '0.5'
}

const onDragOver = (e, layer) => {
  // 不允许拖拽到自己身上
  if (draggingId.value === layer.id) {
    dragOverId.value = null
    dropPosition.value = null
    return
  }

  dragOverId.value = layer.id

  // 计算鼠标在元素内的位置，决定是上方还是下方
  const rect = e.currentTarget.getBoundingClientRect()
  const offsetY = e.clientY - rect.top

  if (offsetY < rect.height / 2) {
    dropPosition.value = 'before'
  } else {
    dropPosition.value = 'after'
  }
}

const onDragLeave = (e) => {
  // 这里需要小心，dragleave 会在进入子元素时触发
  // 简单处理：不清除 dragOverId，只在 drop 或 end 时清除
  // 或者通过判断 relatedTarget
}

const onDrop = (e, targetLayer) => {
  e.preventDefault()

  if (draggingId.value && draggingId.value !== targetLayer.id) {
    const core = getCore()
    if (core) {
      core.reorderLayer(draggingId.value, targetLayer.id, dropPosition.value)
    }
  }

  // 清理状态
  clearDragState()
}

const onPanelDrop = (e) => {
  // 处理拖拽到面板空白处的情况（如果需要）
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

// 修复高亮：使用类型安全的比较
const isSelected = (id) => {
  if (!selectedLayerIds.value) return false
  return selectedLayerIds.value.some((selId) => String(selId) === String(id))
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

const getTypeIcon = (type) => {
  switch (type) {
    case 'Rect':
      return 'ri-rectangle-line'
    case 'Ellipse':
      return 'ri-circle-line'
    case 'Polygon':
      return 'ri-vip-diamond-line'
    case 'Text':
      return 'ri-text'
    case 'Group':
      return 'ri-group-line'
    case 'Image':
      return 'ri-image-line'
    default:
      return 'ri-file-line'
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

.layer-item {
  position: relative;
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 12px;
  cursor: pointer;
  margin: 0 8px 2px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  color: #374151;
}

.layer-item:hover {
  background-color: #f3f4f6;
}

.layer-item.active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.layer-item.drag-over-top::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--el-color-primary);
  z-index: 10;
  pointer-events: none;
}

.layer-item.drag-over-bottom::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--el-color-primary);
  z-index: 10;
  pointer-events: none;
}

.active-bar {
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background-color: var(--el-color-primary);
  border-top-right-radius: 2px;
  border-bottom-right-radius: 2px;
}

.layer-info {
  flex: 1;
  display: flex;
  align-items: center;
  margin: 0 8px;
  overflow: hidden;
}

.name-text {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-icon {
  margin-right: 8px;
  font-size: 15px;
  opacity: 0.7;
}

.layer-actions {
  display: flex;
  align-items: center;
}

.layer-action {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 15px;
  opacity: 0; /* 默认隐藏 */
  transition: all 0.2s;
  margin-left: 2px;
}

.layer-item:hover .layer-action {
  opacity: 1;
}

.layer-action:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #4b5563;
}

.delete-btn:hover {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

.layer-action.is-hidden,
.layer-action.is-locked {
  opacity: 1; /* 状态激活时始终显示 */
}

.visible-btn.is-hidden {
  color: #9ca3af;
}

.lock-btn.is-locked {
  color: #ef4444; /* 锁定状态显示红色 */
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
