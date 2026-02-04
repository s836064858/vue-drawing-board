import { ChildEvent, PropertyEvent, PointerEvent } from 'leafer-ui'
import { EditorEvent } from '@leafer-in/editor'

export const eventMixin = {
  initEvents() {
    const { tree, editor } = this.app

    // 绑定并存储事件处理器引用
    this.eventHandlers.keydown = this.handleKeydown.bind(this)
    this.eventHandlers.paste = this.handlePaste.bind(this)
    this.eventHandlers.dragover = this.handleDragOver.bind(this)
    this.eventHandlers.drop = this.handleDrop.bind(this)

    // 全局事件监听
    window.addEventListener('keydown', this.eventHandlers.keydown)
    window.addEventListener('paste', this.eventHandlers.paste)

    // 画布拖拽事件
    if (this.app.view) {
      this.app.view.addEventListener('dragover', this.eventHandlers.dragover)
      this.app.view.addEventListener('drop', this.eventHandlers.drop)
    }

    // Leafer 内部事件
    this.initLeaferEvents(tree, editor)
  },

  initLeaferEvents(tree, editor) {
    // 监听元素添加/移除
    tree.on([ChildEvent.ADD, ChildEvent.REMOVE], () => {
      this.syncLayers()
    })

    // 监听属性变化（仅监听影响图层列表的属性）
    const relevantProps = new Set(['visible', 'locked', 'name', 'tag', 'zIndex', 'text'])
    tree.on(PropertyEvent.CHANGE, (e) => {
      if (relevantProps.has(e.attrName)) {
        this.syncLayers()
      }
    })

    // 监听选中变化
    editor.on(EditorEvent.SELECT, () => {
      this.syncSelection()
    })

    // 画布交互事件
    this.app.on(PointerEvent.TAP, this.handleTap.bind(this))
    this.app.on(PointerEvent.DOWN, this.handlePointerDown.bind(this))
    this.app.on(PointerEvent.MOVE, this.handlePointerMove.bind(this))
    this.app.on(PointerEvent.UP, this.handlePointerUp.bind(this))
  },

  /**
   * 检查是否在可编辑元素中
   */
  isEditableElement(target) {
    return target.tagName === 'INPUT' || 
           target.tagName === 'TEXTAREA' || 
           target.isContentEditable
  },

  handlePaste(e) {
    if (this.isEditableElement(e.target)) return

    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile()
        if (blob) {
          const url = URL.createObjectURL(blob)
          this.addImage(url)
          e.preventDefault()
          break
        }
      }
    }
  },

  handleDragOver(e) {
    e.preventDefault()
  },

  handleDrop(e) {
    e.preventDefault()
    
    const items = e.dataTransfer?.items
    if (!items) return

    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          const url = URL.createObjectURL(file)
          // 转换屏幕坐标到世界坐标
          const point = this.app.tree.getInnerPoint({ x: e.offsetX, y: e.offsetY })
          this.addImage(url, { x: point.x, y: point.y })
        }
      }
    }
  },

  handleTap(e) {
    if (this.mode !== 'text') return

    const { x, y } = this.app.tree.getInnerPoint(e)
    this.addText(x, y)
    this.setMode('select')
  },

  handlePointerDown(e) {
    const drawingModes = ['rect', 'ellipse', 'diamond']
    if (!drawingModes.includes(this.mode)) return

    this.app.editor.cancel()
    this.isDrawing = true
    
    const { x, y } = this.app.tree.getInnerPoint(e)
    this.startPoint = { x, y }
    this.currentDrawingShape = this.createShape(this.mode, x, y)
  },

  handlePointerMove(e) {
    if (!this.isDrawing || !this.currentDrawingShape) return

    const { x: currentX, y: currentY } = this.app.tree.getInnerPoint(e)
    const { x: startX, y: startY } = this.startPoint

    const width = Math.abs(currentX - startX)
    const height = Math.abs(currentY - startY)
    const x = Math.min(currentX, startX)
    const y = Math.min(currentY, startY)

    if (this.mode === 'diamond') {
      // 菱形的四个顶点：上、右、下、左
      this.currentDrawingShape.set({
        x, y, width, height,
        points: [width / 2, 0, width, height / 2, width / 2, height, 0, height / 2]
      })
    } else {
      this.currentDrawingShape.set({ x, y, width, height })
    }
  },

  handlePointerUp(e) {
    if (!this.isDrawing) return

    this.isDrawing = false
    const minSize = 5

    if (this.currentDrawingShape) {
      const { width, height } = this.currentDrawingShape
      
      if (width < minSize || height < minSize) {
        // 图形太小，移除
        this.currentDrawingShape.remove()
      } else {
        // 选中新绘制的图形
        this.app.editor.select(this.currentDrawingShape)
      }
    }

    this.currentDrawingShape = null
    this.startPoint = null
    this.setMode('select')
  },

  handleKeydown(e) {
    if (this.isEditableElement(e.target)) return

    if (e.key === 'Backspace' || e.key === 'Delete') {
      this.removeSelectedLayers()
      e.preventDefault()
    }
  }
}
