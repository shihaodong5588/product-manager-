import { toPng, toJpeg } from 'html-to-image'

/**
 * 将画布导出为 base64 图片
 */
export async function exportCanvasToBase64(
  element: HTMLElement,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 0.95
): Promise<string> {
  try {
    const dataUrl =
      format === 'png'
        ? await toPng(element, {
            quality,
            pixelRatio: 1,
          })
        : await toJpeg(element, {
            quality,
            pixelRatio: 1,
          })

    return dataUrl
  } catch (error) {
    console.error('Failed to export canvas:', error)
    throw error
  }
}

/**
 * 将文件转换为 base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 将 URL 图片转换为 base64
 */
export async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Failed to convert URL to base64:', error)
    throw error
  }
}

/**
 * 下载 base64 图片
 */
export function downloadBase64Image(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}
