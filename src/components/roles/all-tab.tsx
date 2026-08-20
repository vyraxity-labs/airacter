'use client'

import { useTranslation } from '@/lib/i18n/client'
import Link from 'next/link'

const AllTab = () => {
  const { t } = useTranslation('character')

  return (
    <section className='relative rounded-[24px] overflow-hidden bg-linear-to-r from-primary/80 to-secondary p-10 flex items-center justify-between group shadow-lg shadow-primary-container/10 border border-white/5 select-none'>
      <div className='z-10 max-w-lg'>
        <span className='bg-white/20 border border-white/10 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full mb-4 inline-block uppercase tracking-wider'>
          {t('main.all_tabs.new_release')}
        </span>
        <h1 className='text-2xl md:text-3xl font-extrabold text-white mb-3 leading-tight tracking-tight'>
          {t('main.all_tabs.title')}
        </h1>
        <p className='text-white/80 text-sm mb-6 leading-relaxed'>
          {t('main.all_tabs.description')}
        </p>
        <Link
          href='/characters/new'
          className='bg-white text-primary px-6 py-2.5 rounded-xl text-xs font-extrabold hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer inline-block'
        >
          {t('main.all_tabs.start_creating')}
        </Link>
      </div>
      <div className='absolute right-0 top-0 h-full w-1/2 overflow-hidden opacity-30 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none'>
        <img
          className='w-full h-full object-cover select-none'
          src='https://lh3.googleusercontent.com/aida-public/AB6AXuDdHM2sJjAbi13X0gviQljfiaoagm0FUl3K0ZrEuuJ4I7KEuRPeXUiT2-eNRTU42DwBsjr83aB-a1npznCwHgXWVYIF4540bSgvjcu8V46srMweph9ufrWisynX8mgdCb7vg5Uv0Q4Gu9fGVy0Oa7guZqD-dFnd4VSp-qAKEsTJCTD9AJHy6BgAY0IC0BfLK018BchDKYmAQHebmpra3E7XpRr6fP0f-H9JncVkEdj5ku7ds4bwJ4kHaKMCC-QxJVoh6kdu6BatLl8E'
          alt={t('main.all_tabs.bg_alt')}
        />
      </div>
    </section>
  )
}

export default AllTab
