import type { PropsWithChildren, ReactNode } from 'react';

export function SectionHeader({
  eye,
  title,
  subtitle,
  actions,
}: {
  eye: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        <div className="section-eye">{eye}</div>
        <h2 className="section-title">{title}</h2>
        <p className="section-subtitle">{subtitle}</p>
      </div>
      {actions ? <div className="section-actions">{actions}</div> : null}
    </div>
  );
}

export function Card({
  title,
  children,
  action,
}: PropsWithChildren<{ title: string; action?: ReactNode }>) {
  return (
    <section className="card">
      <div className="card-header">
        <h3>{title}</h3>
        {action}
      </div>
      <div className="card-body">
        <div className="card-scroll">{children}</div>
      </div>
    </section>
  );
}

export function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: 'danger' | 'violet' | 'success' | 'warning' | 'neutral';
}) {
  return (
    <div className={`kpi tone-${tone}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: PropsWithChildren<{ tone?: 'danger' | 'warning' | 'success' | 'violet' | 'neutral' }>) {
  return <span className={`badge tone-${tone}`}>{children}</span>;
}
