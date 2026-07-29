import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/button';
import { postClientError } from '@/services/log-api';
import { normalizeError } from '@/types/errors';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  error: Error | null;
  retryKey: number;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, retryKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const normalized = normalizeError(error, {
      componentStack: info.componentStack ?? undefined,
    });
    void postClientError({
      ...normalized,
      stack: error.stack,
      type: 'react_boundary',
    }).catch(() => {
      /* best effort */
    });
  }

  handleRetry = () => {
    this.setState((s) => ({ error: null, retryKey: s.retryKey + 1 }));
    this.props.onRetry?.();
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app hit an unexpected error. Your delivery data is safe — tap below to retry.
          </Text>
          <Button label="Retry App" onPress={this.handleRetry} />
        </View>
      );
    }

    return <React.Fragment key={this.state.retryKey}>{this.props.children}</React.Fragment>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  message: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
});
