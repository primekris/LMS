export default function Card({ title, actions, className = "", children }) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
