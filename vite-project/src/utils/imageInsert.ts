export type ImageAlign = 'left' | 'center' | 'right'

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Файл не является изображением'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Не удалось прочитать файл'))
    reader.readAsDataURL(file)
  })
}

export function getImageFromClipboard(
  clipboardData: DataTransfer | null,
): File | null {
  if (!clipboardData) return null

  for (const item of clipboardData.items) {
    if (item.type.startsWith('image/')) {
      return item.getAsFile()
    }
  }

  return null
}

export function getImageFromDataTransfer(
  dataTransfer: DataTransfer | null,
): File | null {
  if (!dataTransfer?.files.length) return null

  const file = dataTransfer.files[0]
  return file.type.startsWith('image/') ? file : null
}
