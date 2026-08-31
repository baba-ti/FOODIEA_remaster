import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/theme';

export default function AssistantRecipeListItem({ recipe, onPress }) {
  return (
    <TouchableOpacity
      accessibilityHint="만개의레시피 원문을 엽니다"
      accessibilityRole="link"
      activeOpacity={0.78}
      onPress={onPress}
      style={styles.item}
    >
      <View style={styles.topRow}>
        <Text numberOfLines={2} style={styles.title}>{recipe.name}</Text>
        <Text style={styles.arrow}>›</Text>
      </View>

      {typeof recipe.matchScore === 'number' ? (
        <Text style={styles.score}>AI 추천 적합도 {recipe.matchScore}%</Text>
      ) : null}

      <Text numberOfLines={2} style={styles.summary}>{recipe.summary}</Text>

      <View style={styles.bottomRow}>
        <Text style={styles.meta}>⏱ {recipe.cookingMinutes}분 · {recipe.difficulty}</Text>
        <Text style={styles.source}>만개의레시피에서 보기</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  topRow: { alignItems: 'flex-start', flexDirection: 'row' },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
  },
  arrow: { color: colors.primary, fontSize: 24, lineHeight: 24, marginLeft: 8 },
  score: { color: colors.success, fontSize: 11, fontWeight: '900', marginTop: 5 },
  summary: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 7 },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  meta: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  source: { color: colors.primaryDark, fontSize: 11, fontWeight: '800', marginLeft: 8 },
});
