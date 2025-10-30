import { supabaseAdmin } from './supabase'
import { v4 as uuidv4 } from 'uuid'

const BUCKET_NAME = 'prototypes'

/**
 * 初始化 Supabase Storage Bucket
 * 注意：这个函数只需要在首次设置时运行一次
 */
export async function initializeStorageBucket() {
  try {
    // 检查 bucket 是否已存在
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME)

    if (!bucketExists) {
      // 创建 bucket
      const { data, error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
      })

      if (error) throw error
      console.log('✅ Supabase Storage bucket created:', BUCKET_NAME)
      return data
    } else {
      console.log('✅ Supabase Storage bucket already exists:', BUCKET_NAME)
      return null
    }
  } catch (error) {
    console.error('❌ Failed to initialize storage bucket:', error)
    throw error
  }
}

/**
 * 上传图片到 Supabase Storage
 * @param file - 图片文件 (Buffer 或 File)
 * @param filename - 文件名（可选，如果不提供会自动生成）
 * @returns 上传后的文件信息
 */
export async function uploadPrototypeImage(
  file: Buffer | File,
  filename?: string
): Promise<{
  path: string
  url: string
  size: number
}> {
  try {
    // 生成唯一文件名
    const fileExtension = filename?.split('.').pop() || 'png'
    const uniqueFilename = filename || `prototype-${uuidv4()}.${fileExtension}`
    const filePath = `${new Date().getFullYear()}/${new Date().getMonth() + 1}/${uniqueFilename}`

    // 上传文件
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: `image/${fileExtension}`,
        upsert: false
      })

    if (error) throw error

    // 获取公开 URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    // 获取文件大小
    let fileSize = 0
    if (file instanceof Buffer) {
      fileSize = file.length
    } else if (file instanceof File) {
      fileSize = file.size
    }

    return {
      path: filePath,
      url: publicUrl,
      size: fileSize
    }
  } catch (error) {
    console.error('❌ Failed to upload image:', error)
    throw error
  }
}

/**
 * 从 Supabase Storage 删除图片
 * @param filePath - 文件路径
 */
export async function deletePrototypeImage(filePath: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) throw error
    console.log('✅ Image deleted:', filePath)
  } catch (error) {
    console.error('❌ Failed to delete image:', error)
    throw error
  }
}

/**
 * 获取指定路径下的所有图片
 * @param path - 文件夹路径（可选）
 */
export async function listPrototypeImages(path?: string) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(path)

    if (error) throw error
    return data
  } catch (error) {
    console.error('❌ Failed to list images:', error)
    throw error
  }
}

/**
 * 从 URL 下载图片并转换为 Buffer
 * @param imageUrl - 图片 URL
 */
export async function downloadImageAsBuffer(imageUrl: string): Promise<Buffer> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('❌ Failed to download image:', error)
    throw error
  }
}

/**
 * 将 Base64 字符串转换为 Buffer
 * @param base64String - Base64 字符串（可能包含 data URI 前缀）
 */
export function base64ToBuffer(base64String: string): Buffer {
  // 移除 data URI 前缀（如果存在）
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

/**
 * 将 Buffer 转换为 Base64 字符串
 * @param buffer - Buffer 对象
 * @param mimeType - MIME 类型（例如 'image/png'）
 */
export function bufferToBase64(buffer: Buffer, mimeType: string = 'image/png'): string {
  const base64 = buffer.toString('base64')
  return `data:${mimeType};base64,${base64}`
}
