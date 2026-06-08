import { useEditor, EditorContent } from '@tiptap/react'
import { NodeSelection } from '@tiptap/pm/state'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef, type ChangeEvent } from 'react'
import { EditorImage } from './extensions/editorImage'
import { RemoteCursors, type RemoteCursorData } from './extensions/remoteCursors'
import {
  getImageFromClipboard,
  getImageFromDataTransfer,
  readImageAsDataUrl,
  type ImageAlign,
} from '../utils/imageInsert'
import { transactionAffectsImages } from '../utils/imageTransaction'
import './WysiwygEditor.css'

interface WysiwygEditorProps {
  content: string
  onChange: (html: string, text: string, immediate?: boolean) => void
  onSelectionChange?: (from: number, to: number, imagePos: number) => void
  remoteCursors?: RemoteCursorData[]
  placeholder?: string
}

export function WysiwygEditor({
  content,
  onChange,
  onSelectionChange,
  remoteCursors = [],
  placeholder,
}: WysiwygEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const insertImageRef = useRef<(file: File) => void>(() => {})
  const onSelectionChangeRef = useRef(onSelectionChange)
  const onChangeRef = useRef(onChange)
  const isApplyingRemoteRef = useRef(false)

  onSelectionChangeRef.current = onSelectionChange
  onChangeRef.current = onChange

  const editor = useEditor({
    extensions: [StarterKit, EditorImage, RemoteCursors],
    content,
    editorProps: {
      attributes: {
        class: 'wysiwyg-content',
        'data-placeholder': placeholder ?? 'Начните писать…',
      },
      handlePaste: (_view, event) => {
        const file = getImageFromClipboard(event.clipboardData)
        if (!file) return false

        event.preventDefault()
        insertImageRef.current(file)
        return true
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved) return false

        const file = getImageFromDataTransfer(event.dataTransfer)
        if (!file) return false

        event.preventDefault()
        insertImageRef.current(file)
        return true
      },
    },
    onTransaction: ({ editor: currentEditor, transaction }) => {
      if (!transaction.docChanged || isApplyingRemoteRef.current) return
      if (transaction.getMeta('preventUpdate')) return

      const html = currentEditor.getHTML()
      const text = currentEditor.getText()
      const immediate = transactionAffectsImages(transaction)
      onChangeRef.current(html, text, immediate)
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      const { from, to } = currentEditor.state.selection
      const selection = currentEditor.state.selection
      const imagePos =
        selection instanceof NodeSelection && selection.node.type.name === 'image' ? from : -1
      onSelectionChangeRef.current?.(from, to, imagePos)
    },
  })

  useEffect(() => {
    if (!editor) return

    insertImageRef.current = async (file: File) => {
      try {
        const src = await readImageAsDataUrl(file)
        editor.chain().focus().setImage({ src, alt: file.name }).run()
      } catch {
        // ignore invalid files
      }
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    const currentHtml = editor.getHTML()
    if (content === currentHtml) return

    isApplyingRemoteRef.current = true
    editor.commands.setContent(content, { emitUpdate: false })
    requestAnimationFrame(() => {
      isApplyingRemoteRef.current = false
    })
  }, [content, editor])

  useEffect(() => {
    if (!editor) return
    editor.commands.setRemoteCursors(remoteCursors)
  }, [editor, remoteCursors])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) insertImageRef.current(file)
    event.target.value = ''
  }

  const setImageAlign = (align: ImageAlign) => {
    editor?.chain().focus().updateAttributes('image', { align }).run()
  }

  if (!editor) return null

  const isImageActive = editor.isActive('image')

  return (
    <div className="wysiwyg-editor">
      <div className="wysiwyg-toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'active' : ''}
          title="Жирный"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'active' : ''}
          title="Курсив"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'active' : ''}
          title="Зачёркнутый"
        >
          S
        </button>
        <span className="toolbar-divider" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
          title="Заголовок"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'active' : ''}
          title="Список"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'active' : ''}
          title="Нумерованный список"
        >
          1.
        </button>
        <span className="toolbar-divider" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Вставить изображение"
        >
          🖼
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={handleFileChange}
        />
        {isImageActive && (
          <>
            <span className="toolbar-divider" />
            <button
              type="button"
              onClick={() => setImageAlign('left')}
              className={editor.getAttributes('image').align === 'left' ? 'active' : ''}
              title="Выровнять по левому краю"
            >
              ⬅
            </button>
            <button
              type="button"
              onClick={() => setImageAlign('center')}
              className={editor.getAttributes('image').align === 'center' ? 'active' : ''}
              title="Выровнять по центру"
            >
              ↔
            </button>
            <button
              type="button"
              onClick={() => setImageAlign('right')}
              className={editor.getAttributes('image').align === 'right' ? 'active' : ''}
              title="Выровнять по правому краю"
            >
              ➡
            </button>
          </>
        )}
        <span className="toolbar-divider" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Отменить"
        >
          ↩
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Повторить"
        >
          ↪
        </button>
      </div>
      <EditorContent editor={editor} className="wysiwyg-body" />
    </div>
  )
}
