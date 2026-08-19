import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { auth } from '@/auth'
import { getRequiredEnv } from '@/lib/env'

// Configure Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const dynamic = 'force-dynamic'

const baseFolder = getRequiredEnv('CLOUDINARY_BASE_FOLDER')

interface RouteParams {
  params: Promise<{ folder: string[] }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    // 1. Authenticate user
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { folder: folders } = await params
    const folderPath = folders.join('/')

    // 2. Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded in 'file' field" },
        { status: 400 },
      )
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 },
      )
    }

    // Validate mime type (images only)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 },
      )
    }

    // 3. Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 4. Upload buffer stream to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${baseFolder}/${folderPath}`,
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
          transformation: [{ width: 500, height: 500, crop: 'limit' }],
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        },
      )
      uploadStream.end(buffer)
    })

    if (!uploadResult || !uploadResult.secure_url) {
      throw new Error('Failed to retrieve secure URL from Cloudinary upload')
    }

    return NextResponse.json({ url: uploadResult.secure_url })
  } catch (error: any) {
    console.error('Cloudinary upload error:', error)
    return NextResponse.json(
      {
        error:
          error.message ||
          'Failed to upload image. Make sure Cloudinary credentials are configured.',
      },
      { status: 500 },
    )
  }
}
