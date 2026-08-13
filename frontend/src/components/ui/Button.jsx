export default function Button({ variant = "primary", className = "", children, ...props }) {
  const base = variant === "secondary" ? "btn-secondary" : "btn-primary";
  return (
    <button className={`${base} ${className}`} {...props}>
      {children}
    </button>
  );
}
