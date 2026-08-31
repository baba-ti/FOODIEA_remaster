import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, shadows } from '../constants/theme';
import { getRecipeImage } from '../data/recipeImages';

export default function RecipeCard({ recipe, onPress, compact = false }) {
  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      style={[styles.card, compact && styles.compactCard]}
    >
      <Image
        source={getRecipeImage(recipe.imageKey)}
        style={[styles.image, compact && styles.compactImage]}
      />
      <View style={styles.content}>
        {typeof recipe.matchScore === 'number' ? (
          <Text style={styles.match}>AI 추천 적합도 {recipe.matchScore}%</Text>
        ) : null}
        <Text numberOfLines={2} style={styles.title}>{recipe.name}</Text>
        <Text numberOfLines={compact ? 1 : 2} style={styles.summary}>{recipe.summary}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>⏱ {recipe.cookingMinutes}분</Text>
          <Text style={styles.meta}> · {recipe.difficulty}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    ...shadows.card,
  },
  compactCard: {
    marginRight: 14,
    width: 220,
  },
  image: {
    height: 180,
    width: '100%',
  },
  compactImage: {
    height: 130,
  },
  content: {
    padding: 15,
  },
  match: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  summary: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
