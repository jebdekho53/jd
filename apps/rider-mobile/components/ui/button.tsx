import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  type PressableProps,
} from 'react-native';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
}

const variantStyles = {
  primary: { bg: '#0f766e', text: '#fff' },
  secondary: { bg: '#e2e8f0', text: '#0f172a' },
  danger: { bg: '#dc2626', text: '#fff' },
  ghost: { bg: 'transparent', text: '#0f766e' },
};

export function Button({ label, variant = 'primary', loading, disabled, style, ...props }: ButtonProps) {
  const v = variantStyles[variant];
  return (
    <Pressable
      style={(state) => [
        styles.base,
        { backgroundColor: v.bg, opacity: state.pressed || disabled || loading ? 0.7 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <Text style={[styles.label, { color: v.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
