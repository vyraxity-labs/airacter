'use client'

import React, { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Fingerprint,
  Brain,
  Eye,
  Save,
  X,
  Trash2,
  Send,
  Smile,
  Type,
  Image as ImageIcon,
  Check,
  AlertCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/client'

const COLOR_PALETTE = [
  { id: 'sky', label: 'Sky Blue', value: '#0ea5e9' },
  { id: 'violet', label: 'Violet', value: '#7c3aed' },
  { id: 'pink', label: 'Pink', value: '#f472b6' },
  { id: 'emerald', label: 'Emerald', value: '#10b981' },
  { id: 'amber', label: 'Amber', value: '#f59e0b' },
  { id: 'crimson', label: 'Crimson', value: '#ef4444' },
]

const TONE_OPTIONS = [
  'Casual',
  'Formal',
  'Humorous',
  'Stoic',
  'Empathetic',
  'Dramatic',
]
const CATEGORIES = [
  'education',
  'productivity',
  'entertainment',
  'wellness',
  'creative',
  'technical',
  'fun',
  'other',
]

const POPULAR_EMOJIS = [
  '🎭',
  '🛡️',
  '🌌',
  '🌿',
  '🧠',
  '💻',
  '🚀',
  '🦉',
  '🧘',
  '🎨',
  '⚔️',
  '🧬',
]

function isEmojiString(str: string): boolean {
  // Matches pure emoji sequences (including ZWJ and variations)
  const emojiRegex =
    /^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\u200d)+$/u
  return emojiRegex.test(str)
}

function getInitials(name: string): string {
  if (!name.trim()) return 'AI'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }
  return words
    .map((w) => w[0])
    .join('')
    .substring(0, 3)
    .toUpperCase()
}

interface CharacterData {
  id?: string
  name: string
  description: string
  systemPrompt: string
  avatarType: 'emoji' | 'initials' | 'image'
  avatarValue: string
  avatarColor: string
  category: string
  tone: string[]
  visibility: 'public' | 'private'
}

interface CharacterFormProps {
  initialData?: CharacterData
  cooldownRemainingHours?: number
  rejectionReason?: string
}

export function CharacterForm({
  initialData,
  cooldownRemainingHours = 0,
  rejectionReason = '',
}: CharacterFormProps) {
  const router = useRouter()
  const { t } = useTranslation('character')
  const [isPending, startTransition] = useTransition()

  // Form states
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [systemPrompt, setSystemPrompt] = useState(
    initialData?.systemPrompt || '',
  )
  const [avatarType, setAvatarType] = useState<'emoji' | 'initials' | 'image'>(
    initialData?.avatarType || 'emoji',
  )
  const [avatarValue, setAvatarValue] = useState(
    initialData?.avatarValue || '🎭',
  )
  const [avatarColor, setAvatarColor] = useState(
    initialData?.avatarColor || '#ffafd3',
  )
  const [category, setCategory] = useState(initialData?.category || 'other')
  const [tones, setTones] = useState<string[]>(initialData?.tone || ['Casual'])
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    initialData?.visibility || 'private',
  )

  // UI States
  const [errorMsg, setErrorMsg] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')

  // Cloudinary Upload & Fallback States
  const [imageError, setImageError] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Reset image error state when avatar changes
  useEffect(() => {
    setImageError(false)
  }, [avatarValue, avatarType])

  // Sandbox States
  const [sandboxMessages, setSandboxMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([
    {
      role: 'assistant',
      content:
        t('main.character_edit.sandbox_initial_msg') ||
        "Hey there! I'm your new character. Start typing in the form to shape how I respond to you here!",
    },
  ])
  const [sandboxInput, setSandboxInput] = useState('')
  const [isSandboxThinking, setIsSandboxThinking] = useState(false)
  const sandboxBottomRef = useRef<HTMLDivElement>(null)

  // Sync avatar defaults when switching tabs
  const handleAvatarTypeChange = (type: 'emoji' | 'initials' | 'image') => {
    setAvatarType(type)
    setImageError(false)
    setUploadError('')
    if (type === 'emoji') {
      setAvatarValue(
        initialData?.avatarType === 'emoji' ? initialData.avatarValue : '🎭',
      )
      setAvatarColor(initialData?.avatarColor || '#ffafd3')
    } else if (type === 'initials') {
      setAvatarValue(
        initialData?.avatarType === 'initials'
          ? initialData.avatarValue
          : getInitials(name),
      )
      setAvatarColor(initialData?.avatarColor || '#d2bbff')
    } else {
      setAvatarValue(
        initialData?.avatarType === 'image' ? initialData.avatarValue : '',
      )
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setUploadError(t('main.character_edit.errors.image_size'))
      e.target.value = ''
      return
    }
    if (!file.type.startsWith('image/')) {
      setUploadError(t('main.character_edit.errors.image_type'))
      e.target.value = ''
      return
    }

    setIsUploading(true)
    setUploadError('')
    setImageError(false)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/characters/avatars', {
        method: 'POST',
        body: formData,
      })

      const resData = await response.json()

      if (!response.ok) {
        throw new Error(
          resData.error || t('main.character_edit.errors.upload_failed'),
        )
      }

      setAvatarValue(resData.url)
    } catch (err: any) {
      console.error(err)
      setUploadError(
        err.message || t('main.character_edit.errors.upload_generic'),
      )
    } finally {
      setIsUploading(false)
    }
  }

  // Toggle tone chips selection
  const handleToneToggle = (tone: string) => {
    if (tones.includes(tone)) {
      if (tones.length > 1) {
        setTones(tones.filter((t) => t !== tone))
      }
    } else {
      if (tones.length < 4) {
        setTones([...tones, tone])
      }
    }
  }

  // Autoscroll sandbox chat feed
  useEffect(() => {
    sandboxBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sandboxMessages, isSandboxThinking])

  // Handle Sandbox Send message
  const handleSandboxSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sandboxInput.trim() || isSandboxThinking) return

    const userMsg = sandboxInput.trim()
    setSandboxMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setSandboxInput('')
    setIsSandboxThinking(true)

    // Dynamic mock response generation
    setTimeout(() => {
      let reply = ''
      const lowerMsg = userMsg.toLowerCase()
      const charName =
        name.trim() || t('main.character_edit.sandbox_draft_name')
      const charDesc =
        description.trim() || t('main.character_edit.sandbox_draft_desc')
      const activeTones = tones
        .map((toneKey) =>
          t(`main.character_edit.tones.${toneKey}`, { defaultValue: toneKey }),
        )
        .join(', ')

      if (
        lowerMsg.includes('who are you') ||
        lowerMsg.includes('your name') ||
        lowerMsg.includes('personality')
      ) {
        reply = t('main.character_edit.sandbox_reply_identity', {
          name: charName,
          desc: charDesc,
          tones: activeTones,
        })
      } else if (
        lowerMsg.includes('prompt') ||
        lowerMsg.includes('instruction') ||
        lowerMsg.includes('system')
      ) {
        reply = t('main.character_edit.sandbox_reply_prompt', {
          prompt: `${systemPrompt.substring(0, 80)}${systemPrompt.length > 80 ? '...' : ''}`,
        })
      } else {
        // Mock responses based on tone
        const responses: Record<string, string[]> = {
          Casual: [
            t('main.character_edit.sandbox_responses.casual_1'),
            t('main.character_edit.sandbox_responses.casual_2'),
          ],
          Formal: [
            t('main.character_edit.sandbox_responses.formal_1'),
            t('main.character_edit.sandbox_responses.formal_2'),
          ],
          Humorous: [
            t('main.character_edit.sandbox_responses.humorous_1'),
            t('main.character_edit.sandbox_responses.humorous_2'),
          ],
          Stoic: [
            t('main.character_edit.sandbox_responses.stoic_1'),
            t('main.character_edit.sandbox_responses.stoic_2'),
          ],
          Empathetic: [
            t('main.character_edit.sandbox_responses.empathetic_1'),
            t('main.character_edit.sandbox_responses.empathetic_2'),
          ],
          Dramatic: [
            t('main.character_edit.sandbox_responses.dramatic_1'),
            t('main.character_edit.sandbox_responses.dramatic_2'),
          ],
        }

        // Select response matching first active tone
        const preferredTone = tones[0] || 'Casual'
        const toneReplies = responses[preferredTone] || responses['Casual']
        const randomIndex = Math.floor(Math.random() * toneReplies.length)
        reply = `${t('main.character_edit.sandbox_prefix')} ${toneReplies[randomIndex]}`
      }

      setSandboxMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply },
      ])
      setIsSandboxThinking(false)
    }, 1000)
  }

  // Validate inputs
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (name.trim().length < 3)
      errors.name = t('main.character_edit.errors.name_min')
    if (name.trim().length > 60)
      errors.name = t('main.character_edit.errors.name_max')
    if (description.trim().length === 0)
      errors.description = t('main.character_edit.errors.desc_required')
    if (description.trim().length > 200)
      errors.description = t('main.character_edit.errors.desc_max')
    if (systemPrompt.trim().length < 20)
      errors.systemPrompt = t('main.character_edit.errors.prompt_min')
    if (systemPrompt.trim().length > 2000)
      errors.systemPrompt = t('main.character_edit.errors.prompt_max')
    if (tones.length === 0)
      errors.tones = t('main.character_edit.errors.tones_required')

    const val = avatarValue.trim()
    if (avatarType === 'image' && !val) {
      errors.avatarValue = t('main.character_edit.errors.image_url_required')
    } else if (avatarType === 'emoji') {
      if (!val) {
        errors.avatarValue = t('main.character_edit.errors.emoji_required')
      } else {
        const charCount = [...val].length
        if (isEmojiString(val)) {
          if (charCount > 2) {
            errors.avatarValue = t('main.character_edit.errors.emoji_max')
          }
        } else {
          if (charCount > 5) {
            errors.avatarValue = t('main.character_edit.errors.text_emoji_max')
          }
        }
      }
    } else if (avatarType === 'initials') {
      if (!val) {
        errors.avatarValue = t('main.character_edit.errors.initials_required')
      } else if ([...val].length > 3) {
        errors.avatarValue = t('main.character_edit.errors.initials_max')
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Submit form (create / update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setErrorMsg('')

    const payload = {
      name: name.trim(),
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
      avatarType,
      avatarValue: avatarValue.trim(),
      avatarColor,
      category,
      tone: tones,
      visibility,
    }

    startTransition(async () => {
      try {
        const url = initialData?.id
          ? `/api/characters/${initialData.id}`
          : '/api/characters'
        const method = initialData?.id ? 'PUT' : 'POST'

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const resData = await response.json()

        if (!response.ok) {
          throw new Error(
            resData.error || t('main.character_edit.errors.save_failed'),
          )
        }

        router.push('/characters/my')
        router.refresh()
      } catch (err: any) {
        console.error(err)
        setErrorMsg(
          err.message || t('main.character_edit.errors.save_generic'),
        )
      }
    })
  }

  // Handle delete character API submit
  const handleDelete = async () => {
    if (deleteConfirmInput !== name) return
    setErrorMsg('')

    startTransition(async () => {
      try {
        const response = await fetch(`/api/characters/${initialData?.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const resData = await response.json()
          throw new Error(
            resData.error || t('main.character_edit.errors.delete_failed'),
          )
        }

        setShowDeleteConfirm(false)
        router.push('/characters/my')
        router.refresh()
      } catch (err: any) {
        console.error(err)
        setErrorMsg(
          err.message || t('main.character_edit.errors.delete_generic'),
        )
      }
    })
  }

  // Render preview avatar block
  const renderAvatarPreview = () => {
    if (avatarType === 'image' && avatarValue.trim() && !imageError) {
      return (
        <img
          src={avatarValue}
          alt={name || t('main.character_edit.avatar_preview_alt')}
          className='w-full h-full object-cover rounded-full'
          onError={() => setImageError(true)}
        />
      )
    }

    // Fallback initials/emoji render
    const fallbackText =
      avatarType === 'image'
        ? getInitials(name)
        : avatarValue || getInitials(name)

    return (
      <div
        className='w-full h-full rounded-full flex items-center justify-center text-4xl shadow-inner transition-colors duration-300 select-none font-bold'
        style={{
          background: `linear-gradient(135deg, ${avatarColor}20 0%, ${avatarColor}50 100%)`,
          border: `2px solid ${avatarColor}30`,
          color: avatarColor,
        }}
      >
        <span>{fallbackText || '?'}</span>
      </div>
    )
  }

  return (
    <div className='grow flex h-full overflow-hidden relative'>
      {/* Form Area (Left) */}
      <div className='grow overflow-y-auto custom-scrollbar px-6 md:px-12 py-10'>
        <header className='mb-10'>
          <h1 className='text-2xl md:text-3xl font-extrabold text-primary mb-2 font-sans tracking-tight'>
            {initialData?.id
              ? t('main.character_edit.title_edit')
              : t('main.character_edit.title_create')}
          </h1>
          <p className='text-on-surface-variant text-sm md:text-base leading-relaxed max-w-2xl'>
            {initialData?.id
              ? t('main.character_edit.desc_edit')
              : t('main.character_edit.desc_create')}
          </p>
        </header>

        {errorMsg && (
          <div className='mb-6 p-4 rounded-xl bg-error/15 border border-error/20 text-error text-sm flex items-center gap-3 animate-fade-in'>
            <AlertCircle size={18} />
            <p className='font-semibold'>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className='max-w-3xl space-y-10'>
          {/* 1. Identity Section */}
          <div className='space-y-6'>
            <div className='flex items-center gap-3 border-b border-border/10 pb-2'>
              <Fingerprint className='text-primary stroke-[2px]' size={20} />
              <h2 className='text-lg font-bold text-on-surface'>
                {t('main.character_edit.identity_title')}
              </h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 md:gap-8 items-start'>
              {/* Avatar Selector Panel */}
              <div className='flex flex-col items-center gap-3'>
                <div className='w-30 h-30 rounded-full relative overflow-hidden shadow-lg p-0.5 bg-surface-container-high border border-border/20'>
                  {renderAvatarPreview()}
                </div>
                <span className='text-[10px] uppercase font-extrabold tracking-widest text-outline'>
                  {t('main.character_edit.avatar_view')}
                </span>
              </div>

              {/* Identity inputs */}
              <div className='space-y-4 grow'>
                <div>
                  <label
                    className='block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2'
                    htmlFor='character-name'
                  >
                    {t('main.character_edit.name_label')}
                  </label>
                  <input
                    id='character-name'
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('main.character_edit.name_placeholder')}
                    className='w-full bg-surface-container border border-border/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all text-on-surface placeholder:text-outline/70'
                  />
                  {fieldErrors.name && (
                    <span className='text-xs text-error mt-1.5 flex items-center gap-1 font-medium'>
                      <AlertCircle size={12} /> {fieldErrors.name}
                    </span>
                  )}
                </div>

                <div>
                  <label className='block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2'>
                    {t('main.character_edit.desc_label')}
                  </label>
                  <input
                    type='text'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('main.character_edit.desc_placeholder')}
                    className='w-full bg-surface-container border border-border/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all text-on-surface placeholder:text-outline/70'
                  />
                  {fieldErrors.description && (
                    <span className='text-xs text-error mt-1.5 flex items-center gap-1 font-medium'>
                      <AlertCircle size={12} /> {fieldErrors.description}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Avatar Values picker tabbed interface */}
            <div className='p-5 bg-surface-container-low rounded-2xl border border-border/10 space-y-4'>
              <span className='block text-xs font-bold text-on-surface-variant uppercase tracking-wider'>
                {t('main.character_edit.avatar_config_title')}
              </span>

              <div className='flex gap-2 border-b border-border/10 pb-3 select-none'>
                <button
                  type='button'
                  onClick={() => handleAvatarTypeChange('emoji')}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                    avatarType === 'emoji'
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
                  )}
                >
                  <Smile size={14} /> {t('main.character_edit.tab_emoji')}
                </button>
                <button
                  type='button'
                  onClick={() => handleAvatarTypeChange('initials')}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                    avatarType === 'initials'
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
                  )}
                >
                  <Type size={14} /> {t('main.character_edit.tab_initials')}
                </button>
                <button
                  type='button'
                  onClick={() => handleAvatarTypeChange('image')}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                    avatarType === 'image'
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
                  )}
                >
                  <ImageIcon size={14} /> {t('main.character_edit.tab_image')}
                </button>
              </div>

              {/* Input for selected type */}
              <div>
                <label className='block text-[11px] font-bold text-outline uppercase tracking-wider mb-2'>
                  {avatarType === 'emoji' &&
                    t('main.character_edit.input_label_emoji')}
                  {avatarType === 'initials' &&
                    t('main.character_edit.input_label_initials')}
                  {avatarType === 'image' &&
                    t('main.character_edit.input_label_image')}
                </label>

                {avatarType === 'emoji' && (
                  <div className='mb-3'>
                    <span className='block text-[10px] font-bold text-outline uppercase tracking-wider mb-2'>
                      {t('main.character_edit.popular_emojis')}
                    </span>
                    <div className='flex gap-2.5 flex-wrap'>
                      {POPULAR_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type='button'
                          onClick={() => setAvatarValue(emoji)}
                          className={cn(
                            'w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer border border-border/25',
                            avatarValue === emoji &&
                              'border-primary bg-primary/15',
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {avatarType !== 'image' ? (
                  <input
                    type='text'
                    value={avatarValue}
                    onChange={(e) => setAvatarValue(e.target.value)}
                    placeholder={avatarType === 'emoji' ? '🎭' : 'AI'}
                    className='w-full bg-surface-container border border-border/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface'
                  />
                ) : (
                  <div className='space-y-3'>
                    <div className='flex flex-col sm:flex-row gap-3 items-start sm:items-center'>
                      <div className='grow w-full'>
                        <input
                          type='text'
                          value={avatarValue}
                          onChange={(e) => setAvatarValue(e.target.value)}
                          placeholder={t(
                            'main.character_edit.image_url_placeholder',
                          )}
                          className='w-full bg-surface-container border border-border/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-on-surface'
                        />
                      </div>

                      <div className='shrink-0 w-full sm:w-auto'>
                        <input
                          type='file'
                          accept='image/*'
                          onChange={handleFileUpload}
                          className='hidden'
                          id='avatar-file-upload'
                          disabled={isUploading}
                        />
                        <label
                          htmlFor='avatar-file-upload'
                          className={cn(
                            'w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 border rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none',
                            isUploading
                              ? 'bg-surface-container border-border/40 text-outline cursor-not-allowed'
                              : 'border-primary/30 text-primary hover:bg-primary/5 bg-primary/10',
                          )}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className='w-3.5 h-3.5 animate-spin' />
                              {t('main.character_edit.uploading')}
                            </>
                          ) : (
                            <>
                              <ImageIcon size={14} />
                              {t('main.character_edit.upload_file')}
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                    {uploadError && (
                      <p className='text-xs text-error font-medium flex items-center gap-1.5 animate-fade-in'>
                        <AlertCircle size={12} />
                        {uploadError}
                      </p>
                    )}
                  </div>
                )}

                {fieldErrors.avatarValue && (
                  <span className='text-xs text-error mt-1.5 flex items-center gap-1 font-medium'>
                    <AlertCircle size={12} /> {fieldErrors.avatarValue}
                  </span>
                )}
              </div>

              {/* Avatar Background Colors Selection */}
              {avatarType !== 'image' && (
                <div>
                  <label className='block text-[11px] font-bold text-outline uppercase tracking-wider mb-2'>
                    {t('main.character_edit.avatar_theme_color')}
                  </label>
                  <div className='flex gap-3 items-center flex-wrap select-none'>
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color.id}
                        type='button'
                        onClick={() => setAvatarColor(color.value)}
                        className={cn(
                          'w-7 h-7 rounded-full border-2 transition-transform cursor-pointer relative flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm',
                          avatarColor === color.value
                            ? 'scale-105'
                            : 'border-background',
                        )}
                        style={{
                          backgroundColor: color.value,
                          borderColor:
                            avatarColor === color.value
                              ? '#ffffff'
                              : 'transparent',
                        }}
                        title={t(`main.character_edit.colors.${color.id}`, {
                          defaultValue: color.label,
                        })}
                      >
                        {avatarColor === color.value && (
                          <Check
                            size={14}
                            className='text-white drop-shadow-md stroke-[3px]'
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Persona instructions */}
          <div className='space-y-4'>
            <div className='flex items-center gap-3 border-b border-border/10 pb-2'>
              <Brain className='text-primary stroke-[2px]' size={20} />
              <h2 className='text-lg font-bold text-on-surface'>
                {t('main.character_edit.system_prompt_title')}
              </h2>
            </div>

            <div className='relative group'>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder={t(
                  'main.character_edit.system_prompt_placeholder',
                )}
                rows={6}
                maxLength={2000}
                className='w-full bg-surface-container border border-border/20 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all text-on-surface placeholder:text-outline/70 resize-none custom-scrollbar leading-relaxed'
              />
              <div
                className={cn(
                  'absolute bottom-4 right-4 text-xs font-bold px-2 py-0.5 rounded-full select-none',
                  systemPrompt.length > 1800
                    ? 'bg-error/10 text-error'
                    : 'text-on-surface-variant bg-surface-lowest/60 backdrop-blur-sm',
                )}
              >
                {systemPrompt.length} / 2000
              </div>
            </div>
            {fieldErrors.systemPrompt && (
              <span className='text-xs text-error mt-1 flex items-center gap-1 font-medium'>
                <AlertCircle size={12} /> {fieldErrors.systemPrompt}
              </span>
            )}
            <p className='text-xs text-outline leading-normal font-sans'>
              {t('main.character_edit.system_prompt_help')}
            </p>
          </div>

          {/* 3. Tone, Category & Visibility Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* Tone select */}
            <div className='space-y-4'>
              <label className='block text-xs font-bold text-on-surface-variant uppercase tracking-wider'>
                {t('main.character_edit.tones_label')}
              </label>
              <div className='flex flex-wrap gap-2 select-none'>
                {TONE_OPTIONS.map((t_option) => {
                  const isSelected = tones.includes(t_option)
                  return (
                    <button
                      key={t_option}
                      type='button'
                      onClick={() => handleToneToggle(t_option)}
                      className={cn(
                        'px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer',
                        isSelected
                          ? 'bg-primary/25 text-primary border-primary/40 shadow-sm'
                          : 'bg-surface-container border-border/20 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
                      )}
                    >
                      {t(`main.character_edit.tones.${t_option}`, {
                        defaultValue: t_option,
                      })}
                    </button>
                  )
                })}
              </div>
              {fieldErrors.tones && (
                <span className='text-xs text-error mt-1 flex items-center gap-1 font-medium'>
                  <AlertCircle size={12} /> {fieldErrors.tones}
                </span>
              )}
            </div>

            {/* Category dropdown */}
            <div className='space-y-4'>
              <label className='block text-xs font-bold text-on-surface-variant uppercase tracking-wider'>
                {t('main.character_edit.category_label')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className='w-full bg-surface-container border border-border/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface cursor-pointer font-semibold capitalize'
              >
                {CATEGORIES.map((cat) => (
                  <option
                    key={cat}
                    value={cat}
                    className='bg-surface text-on-surface capitalize'
                  >
                    {t(`main.character_edit.categories.${cat}`, {
                      defaultValue: cat,
                    })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Visibility Toggle */}
          <div className='space-y-4'>
            <div className='flex items-center gap-3 border-b border-border/10 pb-2'>
              <Eye className='text-primary stroke-[2px]' size={20} />
              <h2 className='text-lg font-bold text-on-surface'>
                {t('main.character_edit.privacy_title')}
              </h2>
            </div>

            {cooldownRemainingHours > 0 && (
              <div className='p-4 rounded-xl border border-error/20 bg-error/10 text-error flex flex-col gap-1.5 select-none animate-pulse'>
                <div className='flex items-center gap-2 text-xs font-bold'>
                  <AlertTriangle size={14} />
                  {t('main.character_edit.cooldown_title')}
                </div>
                <p className='text-[10px] leading-relaxed opacity-90 font-medium'>
                  {t('main.character_edit.cooldown_desc_prefix')} &ldquo;
                  {rejectionReason ||
                    t('main.character_edit.cooldown_default_reason')}
                  &rdquo;. {t('main.character_edit.cooldown_desc_middle')}{' '}
                  <strong>
                    {t('main.character_edit.cooldown_desc_hours', {
                      count: cooldownRemainingHours,
                    })}
                  </strong>
                  . {t('main.character_edit.cooldown_desc_suffix')}
                </p>
              </div>
            )}

            <div className='flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-border/10'>
              <div className='max-w-[80%]'>
                <p className='text-sm font-bold text-on-surface'>
                  {t('main.character_edit.public_visibility_title')}
                </p>
                <p className='text-xs text-on-surface-variant mt-0.5 leading-normal'>
                  {t('main.character_edit.public_visibility_desc')}
                </p>
              </div>

              {/* Toggle switch checkbox */}
              <button
                type='button'
                role='switch'
                disabled={cooldownRemainingHours > 0}
                aria-checked={visibility === 'public'}
                onClick={() => {
                  if (cooldownRemainingHours > 0) return
                  setVisibility(visibility === 'public' ? 'private' : 'public')
                }}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/40',
                  visibility === 'public'
                    ? 'bg-primary'
                    : 'bg-surface-container-highest',
                  cooldownRemainingHours > 0 && 'opacity-50 cursor-not-allowed',
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                    visibility === 'public' ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </button>
            </div>
          </div>

          {/* Action buttons footer */}
          <div className='pt-8 border-t border-border/10 flex flex-wrap items-center justify-between gap-4'>
            <div>
              {initialData?.id && (
                <button
                  type='button'
                  onClick={() => setShowDeleteConfirm(true)}
                  className='px-5 py-3 border border-error/30 text-error rounded-xl font-bold hover:bg-error/5 transition-all flex items-center gap-1.5 text-sm cursor-pointer'
                >
                  <Trash2 size={16} />
                  {t('main.character_edit.btn_delete')}
                </button>
              )}
            </div>

            <div className='flex items-center gap-3'>
              <button
                type='button'
                onClick={() => router.push('/characters/my')}
                className='px-6 py-3 border border-border hover:bg-surface-container rounded-xl text-on-surface-variant hover:text-on-surface font-bold text-sm transition-all cursor-pointer'
              >
                {t('main.character_edit.btn_cancel')}
              </button>

              <button
                type='submit'
                disabled={isPending}
                className='px-8 py-3 rounded-xl btn-gradient text-white font-bold text-sm shadow-md shadow-primary/10 flex items-center gap-2 cursor-pointer hover:opacity-95 transition-opacity'
              >
                <Save size={16} />
                {isPending
                  ? t('main.character_edit.btn_saving')
                  : t('main.character_edit.btn_save')}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 2. Interactive Sandbox Preview Sidebar (Right) */}
      <aside className='hidden lg:flex flex-col w-95 h-full bg-surface-container-low border-l border-border/40 select-none font-sans'>
        {/* Header */}
        <div className='h-16 flex items-center justify-between px-6 border-b border-border/40'>
          <span className='font-bold text-sm text-primary tracking-tight'>
            {t('main.character_edit.sandbox_title')}
          </span>
          <span className='px-2.5 py-0.5 rounded-full bg-tertiary/15 border border-tertiary/20 text-tertiary text-[10px] font-bold uppercase tracking-wider'>
            {t('main.character_edit.sandbox_draft')}
          </span>
        </div>

        {/* Message Thread */}
        <div className='grow overflow-y-auto p-6 space-y-6 custom-scrollbar'>
          {sandboxMessages.map((msg, idx) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={idx}
                className={cn(
                  'flex items-end gap-2.5',
                  isUser ? 'justify-end' : 'justify-start',
                )}
              >
                {/* AI Profile Avatar Icon */}
                {!isUser && (
                  <div className='w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-border/30 shadow-sm bg-surface-container-high relative'>
                    {avatarType === 'image' &&
                    avatarValue.trim() &&
                    !imageError ? (
                      <img
                        src={avatarValue}
                        alt={t('main.character_edit.ai_avatar_alt')}
                        className='w-full h-full object-cover'
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div
                        className='w-full h-full flex items-center justify-center text-[10px] font-bold select-none'
                        style={{
                          background: `linear-gradient(135deg, ${avatarColor}20 0%, ${avatarColor}50 100%)`,
                          color: avatarColor,
                        }}
                      >
                        {avatarType === 'image'
                          ? getInitials(name)
                          : avatarValue || getInitials(name)}
                      </div>
                    )}
                  </div>
                )}

                {/* Msg Bubble */}
                <div
                  className={cn(
                    'p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed border shadow-inner',
                    isUser
                      ? 'bg-linear-to-br from-primary to-secondary text-white border-transparent rounded-br-none'
                      : 'glass-panel text-on-surface rounded-bl-none border-border/10',
                  )}
                >
                  <p>{msg.content}</p>
                </div>

                {/* User Profile avatar */}
                {isUser && (
                  <div className='w-8 h-8 rounded-full border border-border/20 bg-surface-bright flex items-center justify-center overflow-hidden shadow-sm'>
                    <UserIcon size={14} className='text-on-surface-variant' />
                  </div>
                )}
              </div>
            )
          })}

          {/* Thinking state indicator */}
          {isSandboxThinking && (
            <div className='flex items-center gap-2.5 justify-start'>
              <div className='w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-border/30 bg-surface-container-high relative'>
                {avatarType === 'image' && avatarValue.trim() && !imageError ? (
                  <img
                    src={avatarValue}
                    alt={t('main.character_edit.ai_avatar_alt')}
                    className='w-full h-full object-cover'
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div
                    className='w-full h-full flex items-center justify-center text-[10px] font-bold select-none'
                    style={{
                      background: `linear-gradient(135deg, ${avatarColor}20 0%, ${avatarColor}50 100%)`,
                      color: avatarColor,
                    }}
                  >
                    {avatarType === 'image'
                      ? getInitials(name)
                      : avatarValue || getInitials(name)}
                  </div>
                )}
              </div>
              <div className='flex items-center gap-2 text-outline text-xs italic'>
                <div className='flex gap-1'>
                  <div className='w-1 h-1 bg-primary rounded-full animate-bounce'></div>
                  <div className='w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]'></div>
                  <div className='w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]'></div>
                </div>
                <span>
                  {t('main.character_edit.sandbox_typing', {
                    name: name || t('main.character_edit.character_fallback'),
                  })}
                </span>
              </div>
            </div>
          )}
          <div ref={sandboxBottomRef} />
        </div>

        {/* Input box */}
        <div className='p-6 border-t border-border/40 bg-surface-low'>
          <form onSubmit={handleSandboxSend} className='relative group'>
            <input
              type='text'
              value={sandboxInput}
              onChange={(e) => setSandboxInput(e.target.value)}
              placeholder={t('main.character_edit.sandbox_placeholder')}
              disabled={isSandboxThinking}
              className='w-full bg-surface-container border border-border/20 rounded-full pl-6 pr-14 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 text-on-surface placeholder:text-outline'
            />
            <button
              type='submit'
              disabled={isSandboxThinking}
              className='absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/15 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed'
            >
              <Send size={15} />
            </button>
          </form>
          <p className='text-[9px] text-center mt-4 text-outline font-extrabold uppercase tracking-widest font-sans'>
            {t('main.character_edit.sandbox_footer')}
          </p>
        </div>
      </aside>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in'>
          <div className='w-full max-w-md bg-surface-container rounded-2xl p-6 border border-error/20 shadow-2xl relative'>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className='absolute top-4 right-4 p-1 rounded-lg hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors cursor-pointer'
            >
              <X size={18} />
            </button>

            <h3 className='text-lg font-bold text-error mb-2 flex items-center gap-2'>
              <Trash2 size={20} /> {t('main.character_edit.delete_modal_title')}
            </h3>
            <p className='text-sm text-on-surface-variant mb-6 leading-relaxed'>
              {t('main.character_edit.delete_modal_desc')} <strong>{name}</strong>{' '}
              {t('main.character_edit.delete_modal_desc_suffix')}
            </p>

            <div className='space-y-4'>
              <label className='block text-xs font-bold text-on-surface-variant uppercase tracking-wider'>
                {t('main.character_edit.delete_modal_confirm_label')}{' '}
                <span className='text-error'>"{name}"</span>{' '}
                {t('main.character_edit.delete_modal_to_confirm')}
              </label>
              <input
                type='text'
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder={t(
                  'main.character_edit.delete_modal_placeholder',
                )}
                className='w-full bg-surface-container-low border border-border/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-error/40 text-on-surface'
              />

              <div className='flex gap-3 justify-end pt-2'>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className='px-5 py-2.5 border border-border rounded-xl font-bold text-xs text-on-surface-variant hover:text-on-surface'
                >
                  {t('main.character_edit.delete_modal_cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirmInput !== name || isPending}
                  className='px-5 py-2.5 bg-error text-white font-bold rounded-xl text-xs hover:bg-error/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                >
                  {t('main.character_edit.delete_modal_confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Minimal user profile icon backup for sandbox
function UserIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
    >
      <path d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' />
      <circle cx='12' cy='7' r='4' />
    </svg>
  )
}
