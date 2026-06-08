import Image from '@tiptap/extension-image'
import { mergeAttributes, ResizableNodeView } from '@tiptap/core'
import type { ImageAlign } from '../../utils/imageInsert'

function applyImageAlign(dom: HTMLElement, align: ImageAlign) {
  dom.dataset.align = align
  dom.style.width = '100%'
  dom.style.justifyContent =
    align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
}

function applyImageSize(el: HTMLImageElement, width: number | null, height: number | null) {
  if (width) {
    el.style.width = `${width}px`
  } else {
    el.style.removeProperty('width')
  }

  if (height) {
    el.style.height = `${height}px`
  } else {
    el.style.removeProperty('height')
  }
}

function parseSizeAttr(element: HTMLElement, attr: 'width' | 'height'): number | null {
  const fromAttr = element.getAttribute(attr)
  if (fromAttr) {
    const parsed = parseInt(fromAttr, 10)
    if (!Number.isNaN(parsed)) return parsed
  }

  const fromStyle = element.style[attr]
  if (fromStyle) {
    const parsed = parseInt(fromStyle, 10)
    if (!Number.isNaN(parsed)) return parsed
  }

  return null
}

export const EditorImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'left' as ImageAlign,
        parseHTML: (element) => (element.getAttribute('data-align') as ImageAlign) || 'left',
        renderHTML: (attributes) => ({
          'data-align': attributes.align,
        }),
      },
      width: {
        default: null,
        parseHTML: (element) => parseSizeAttr(element, 'width'),
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          return { width: attributes.width }
        },
      },
      height: {
        default: null,
        parseHTML: (element) => parseSizeAttr(element, 'height'),
        renderHTML: (attributes) => {
          if (!attributes.height) return {}
          return { height: attributes.height }
        },
      },
    }
  },

  addNodeView() {
    const extension = this
    const options = this.options

    if (!options.resize || !options.resize.enabled || typeof document === 'undefined') {
      return null
    }

    const { directions, minWidth, minHeight, alwaysPreserveAspectRatio } = options.resize

    return ({ node, getPos, HTMLAttributes, editor }) => {
      const el = document.createElement('img')
      el.draggable = false

      const mergedAttributes = mergeAttributes(options.HTMLAttributes, HTMLAttributes)

      Object.entries(mergedAttributes).forEach(([key, value]) => {
        if (value != null && key !== 'width' && key !== 'height') {
          el.setAttribute(key, String(value))
        }
      })

      if (mergedAttributes.src) {
        el.src = mergedAttributes.src
      }

      applyImageSize(el, node.attrs.width, node.attrs.height)

      const nodeView = new ResizableNodeView({
        element: el,
        editor,
        node,
        getPos,
        onResize: (width, height) => {
          applyImageSize(el, width, height)
        },
        onCommit: (width, height) => {
          const pos = getPos()
          if (pos === undefined) return

          editor
            .chain()
            .setNodeSelection(pos)
            .updateAttributes(extension.name, { width, height })
            .run()
        },
        onUpdate: (updatedNode) => {
          if (updatedNode.type !== node.type) return false

          applyImageAlign(nodeView.dom as HTMLElement, updatedNode.attrs.align as ImageAlign)
          applyImageSize(el, updatedNode.attrs.width, updatedNode.attrs.height)
          return true
        },
        options: {
          directions,
          min: { width: minWidth, height: minHeight },
          preserveAspectRatio: alwaysPreserveAspectRatio === true,
          className: {
            handle: 'editor-image-handle',
            resizing: 'editor-image-resizing',
          },
        },
      })

      const dom = nodeView.dom as HTMLElement
      applyImageAlign(dom, (node.attrs.align as ImageAlign) || 'left')

      dom.style.visibility = 'hidden'
      dom.style.pointerEvents = 'none'
      el.onload = () => {
        dom.style.visibility = ''
        dom.style.pointerEvents = ''
      }

      return nodeView
    }
  },
}).configure({
  inline: false,
  allowBase64: true,
  HTMLAttributes: {
    class: 'editor-image',
  },
  resize: {
    enabled: true,
    directions: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
    minWidth: 80,
    minHeight: 80,
    alwaysPreserveAspectRatio: true,
  },
})
