import { cn } from '@/lib/utils'

interface SectionSubtitleProps {
  children: React.ReactNode
  className?: string
}

export function SectionSubtitle({ children, className }: SectionSubtitleProps) {
  return (
    <p className={cn('text-lg sm:text-xl lg:text-[22px] text-white/80 max-w-3xl mx-auto leading-relaxed', className)}>
      {children}
    </p>
  )
}

export default SectionSubtitle