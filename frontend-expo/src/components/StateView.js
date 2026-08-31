import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

export default function StateView({ loading = false, title, description }) {
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator color={colors.primary} size="large" /> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 18,
    textAlign: 'center',
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
});
