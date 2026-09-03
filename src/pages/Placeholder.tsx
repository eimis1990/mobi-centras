import { useT } from '../lib/i18n'

export function Placeholder({ title }: { title: string }) {
  const { t } = useT()
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground">{t('app.comingNext')}</p>
    </div>
  )
}
