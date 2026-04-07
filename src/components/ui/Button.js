import styles from './Button.module.css';

export default function Button({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  onClick,
  type = 'button',
  className,
  ...props
}) {
  return (
    <button
      type={type}
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        className,
      ].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className={styles.spinner} />}
      {!loading && icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
}
