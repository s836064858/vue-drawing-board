import { Text, Image, Rect, Ellipse, Polygon } from 'leafer-ui'

// 模式配置
const MODE_CONFIGS = {
  text: {
    cursor: 'text',
    editorVisible: true,
    editorHittable: true,
    hitChildren: true
  },
  rect: {
    cursor: 'crosshair',
    editorVisible: false,
    editorHittable: false,
    hitChildren: true
  },
  ellipse: {
    cursor: 'crosshair',
    editorVisible: false,
    editorHittable: false,
    hitChildren: true
  },
  diamond: {
    cursor: 'crosshair',
    editorVisible: false,
    editorHittable: false,
    hitChildren: true
  },
  select: {
    cursor: 'auto',
    editorVisible: true,
    editorHittable: true,
    hitChildren: true
  }
}

export const toolMixin = {
  setMode(mode) {
    this.mode = mode
    
    const config = MODE_CONFIGS[mode] || MODE_CONFIGS.select
    
    // 应用模式配置
    this.app.cursor = config.cursor
    this.app.editor.visible = config.editorVisible
    this.app.editor.hittable = config.editorHittable
    this.app.tree.hitChildren = config.hitChildren
    
    // 取消当前选中（除了 select 模式）
    if (mode !== 'select') {
      this.app.editor.cancel()
    }

    // 触发模式变更回调
    this.callbacks.onModeChange?.(mode)
  },

  /**
   * 创建形状
   */
  createShape(type, x, y) {
    const shapeConfigs = {
      rect: {
        class: Rect,
        props: {
          fill: '#32cd79',
          cornerRadius: 10,
          name: '矩形'
        }
      },
      ellipse: {
        class: Ellipse,
        props: {
          fill: '#ffff00',
          name: '圆形'
        }
      },
      diamond: {
        class: Polygon,
        props: {
          fill: '#0000ff',
          points: [],
          name: '菱形'
        }
      }
    }

    const config = shapeConfigs[type]
    if (!config) return null

    const shape = new config.class({
      x,
      y,
      width: 0,
      height: 0,
      editable: true,
      draggable: true,
      ...config.props
    })

    this.app.tree.add(shape)
    return shape
  },

  /**
   * 添加图片
   */
  addImage(url, options = {}) {
    const image = new Image({
      url: url,
      x: options.x || 100,
      y: options.y || 100,
      editable: true,
      draggable: true,
      name: '图片'
    })
    this.app.tree.add(image)
    this.app.editor.select(image)
    return image
  },

  /**
   * 添加文字
   */
  addText(x, y) {
    const scale = this.app.tree.scaleX || 1
    const fontSize = 24 / scale

    const text = new Text({
      x,
      y,
      text: '双击编辑文字',
      fill: '#333',
      fontSize,
      editable: true,
      draggable: true
    })
    
    this.app.tree.add(text)
    this.app.editor.select(text)
    return text
  },

  /**
   * 清空画布
   */
  clear() {
    this.app.tree.clear()
  }
}
