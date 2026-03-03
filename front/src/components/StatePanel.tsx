type Props = {
  title: string
  description: string
  tone?: 'neutral' | 'loading' | 'error'
}

export function StatePanel({ title, description, tone = 'neutral' }: Props) {
  return (
    <section className={`state-panel state-panel-${tone}`}>
      <span className="section-kicker">Estado</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </section>
  )
}
