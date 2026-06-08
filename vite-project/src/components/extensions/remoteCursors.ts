import { Extension } from '@tiptap/core'
import type { EditorView } from '@tiptap/pm/view'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface RemoteCursorData {
  clientId: string
  userName: string
  from: number
  to: number
  imagePos: number
  color: string
}

export const remoteCursorsPluginKey = new PluginKey('remoteCursors')

interface RemoteCursorsState {
  decorations: DecorationSet
  cursors: RemoteCursorData[]
}

function mapCursors(cursors: RemoteCursorData[], mapping: { map: (pos: number) => number }) {
  return cursors.map((cursor) => ({
    ...cursor,
    from: cursor.from >= 0 ? mapping.map(cursor.from) : cursor.from,
    to: cursor.to >= 0 ? mapping.map(cursor.to) : cursor.to,
    imagePos: cursor.imagePos >= 0 ? mapping.map(cursor.imagePos) : cursor.imagePos,
  }))
}

function buildDecorations(doc: Parameters<typeof DecorationSet.create>[0], cursors: RemoteCursorData[]) {
  const decorations: Decoration[] = []
  const docSize = doc.content.size

  for (const cursor of cursors) {
    if (cursor.imagePos >= 0) {
      const pos = Math.max(0, Math.min(cursor.imagePos, docSize))
      const node = doc.nodeAt(pos)

      if (node?.type.name === 'image') {
        decorations.push(
          Decoration.node(pos, pos + node.nodeSize, {
            class: 'remote-image-selection',
            style: `--selection-color: ${cursor.color}`,
            'data-remote-client-id': cursor.clientId,
          }),
        )

        continue
      }
    }

    if (cursor.from < 0) continue

    const from = Math.max(0, Math.min(cursor.from, docSize))
    const to = Math.max(from, Math.min(cursor.to, docSize))

    if (to > from) {
      decorations.push(
        Decoration.inline(from, to, {
          style: `background-color: ${cursor.color}40`,
        }),
      )
    }

    decorations.push(
      Decoration.widget(
        from,
        () => {
          const caret = document.createElement('span')
          caret.className = 'remote-cursor'
          caret.style.setProperty('--cursor-color', cursor.color)

          const label = document.createElement('span')
          label.className = 'remote-cursor-label'
          label.textContent = cursor.userName
          caret.appendChild(label)

          return caret
        },
        { side: -1, key: `remote-cursor-${cursor.clientId}` },
      ),
    )
  }

  return DecorationSet.create(doc, decorations)
}

function updateImageBadges(view: EditorView, layer: HTMLElement, cursors: RemoteCursorData[]) {
  layer.replaceChildren()

  for (const cursor of cursors) {
    if (cursor.imagePos < 0) continue

    const node = view.state.doc.nodeAt(cursor.imagePos)
    if (node?.type.name !== 'image') continue

    const nodeDom = view.nodeDOM(cursor.imagePos)
    if (!(nodeDom instanceof HTMLElement)) continue

    const wrapper =
      nodeDom.querySelector<HTMLElement>('[data-resize-wrapper]') ??
      nodeDom.querySelector('img') ??
      nodeDom

    const rect = wrapper.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) continue

    const badge = document.createElement('span')
    badge.className = 'remote-image-selection-badge'
    badge.textContent = cursor.userName
    badge.dataset.clientId = cursor.clientId
    badge.style.setProperty('--selection-color', cursor.color)
    badge.style.left = `${rect.left}px`
    badge.style.top = `${rect.top}px`

    layer.appendChild(badge)
  }
}

function bindImageBadgeHover(view: EditorView, layer: HTMLElement) {
  const showFor = (clientId: string | null) => {
    layer.querySelectorAll<HTMLElement>('.remote-image-selection-badge').forEach((badge) => {
      badge.classList.toggle('is-visible', clientId !== null && badge.dataset.clientId === clientId)
    })
  }

  const onPointer = (event: Event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return

    const badge = target.closest<HTMLElement>('.remote-image-selection-badge')
    if (badge) {
      showFor(badge.dataset.clientId ?? null)
      return
    }

    const selection = target.closest<HTMLElement>('[data-remote-client-id]')
    showFor(selection?.getAttribute('data-remote-client-id') ?? null)
  }

  const onLeave = () => showFor(null)

  view.dom.addEventListener('mouseover', onPointer)
  view.dom.addEventListener('mouseleave', onLeave)

  return () => {
    view.dom.removeEventListener('mouseover', onPointer)
    view.dom.removeEventListener('mouseleave', onLeave)
  }
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    remoteCursors: {
      setRemoteCursors: (cursors: RemoteCursorData[]) => ReturnType
    }
  }
}

export const RemoteCursors = Extension.create({
  name: 'remoteCursors',

  addCommands() {
    return {
      setRemoteCursors:
        (cursors: RemoteCursorData[]) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(remoteCursorsPluginKey, cursors)
            dispatch(tr)
          }
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: remoteCursorsPluginKey,
        state: {
          init: (): RemoteCursorsState => ({
            decorations: DecorationSet.empty,
            cursors: [],
          }),
          apply(tr, pluginState, _oldState, newState): RemoteCursorsState {
            const incoming = tr.getMeta(remoteCursorsPluginKey) as RemoteCursorData[] | undefined

            if (incoming !== undefined) {
              return {
                decorations: buildDecorations(newState.doc, incoming),
                cursors: incoming,
              }
            }

            if (tr.docChanged) {
              const cursors = mapCursors(pluginState.cursors, tr.mapping)
              return {
                decorations: pluginState.decorations.map(tr.mapping, newState.doc),
                cursors,
              }
            }

            return pluginState
          },
        },
        props: {
          decorations(state) {
            return remoteCursorsPluginKey.getState(state)?.decorations ?? DecorationSet.empty
          },
        },
        view(view) {
          const layer = document.createElement('div')
          layer.className = 'remote-image-badge-layer'
          document.body.appendChild(layer)

          let frame = 0
          const scheduleUpdate = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(() => {
              const state = remoteCursorsPluginKey.getState(view.state) as RemoteCursorsState | undefined
              updateImageBadges(view, layer, state?.cursors ?? [])
            })
          }

          const unbindHover = bindImageBadgeHover(view, layer)
          const onLayoutChange = () => scheduleUpdate()

          document.addEventListener('scroll', onLayoutChange, true)
          window.addEventListener('resize', onLayoutChange)

          scheduleUpdate()

          return {
            update() {
              scheduleUpdate()
            },
            destroy() {
              cancelAnimationFrame(frame)
              unbindHover()
              document.removeEventListener('scroll', onLayoutChange, true)
              window.removeEventListener('resize', onLayoutChange)
              layer.remove()
            },
          }
        },
      }),
    ]
  },
})
