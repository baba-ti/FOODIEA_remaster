import React from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';
import { getRecipeImage } from '../data/recipeImages';

export default function RecipeDetail({ route }) {
  const recipe = route.params?.recipe;

  if (!recipe) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>레시피 정보가 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const showSource = async () => {
    if (recipe.source?.isMock) {
      Alert.alert(
        '가짜 출처입니다',
        '실제 Agent API가 연결되면 이 버튼에서 검색한 웹사이트 원문을 열 수 있습니다.'
      );
      return;
    }

    if (!recipe.source?.url) {
      Alert.alert('출처 없음', '연결할 원본 레시피 주소가 없습니다.');
      return;
    }

    try {
      await Linking.openURL(recipe.source.url);
    } catch {
      Alert.alert('링크 열기 실패', '원본 레시피 페이지를 열지 못했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={getRecipeImage(recipe.imageKey)} style={styles.heroImage} />

        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>
            {recipe.source?.isMock ? '샘플 레시피' : 'AI 검색 레시피'}
          </Text>
        </View>
        <Text style={styles.title}>{recipe.name}</Text>
        <Text style={styles.summary}>{recipe.summary}</Text>

        <View style={styles.metaCard}>
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{recipe.cookingMinutes}분</Text>
            <Text style={styles.metaLabel}>조리 시간</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{recipe.difficulty}</Text>
            <Text style={styles.metaLabel}>난이도</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{recipe.servings}인분</Text>
            <Text style={styles.metaLabel}>기준 분량</Text>
          </View>
        </View>

        {typeof recipe.matchScore === 'number' ? (
          <View style={styles.matchBox}>
            <Text style={styles.matchTitle}>AI 추천 적합도 {recipe.matchScore}%</Text>
            <Text style={styles.matchText}>
              일치: {recipe.matchedIngredients.length ? recipe.matchedIngredients.join(', ') : '없음'}
            </Text>
            <Text style={styles.matchText}>
              추가 필요: {recipe.missingIngredients.length ? recipe.missingIngredients.join(', ') : '없음'}
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>필요한 재료</Text>
        <View style={styles.sectionCard}>
          {recipe.ingredients.map((ingredient, index) => (
            <View
              key={`${ingredient.name}-${index}`}
              style={[styles.ingredientRow, index === recipe.ingredients.length - 1 && styles.lastRow]}
            >
              <Text style={styles.ingredientName}>{ingredient.name}</Text>
              <Text style={styles.ingredientAmount}>{ingredient.amount}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>조리 순서</Text>
        {recipe.steps.map((step, index) => (
          <View key={`${step}-${index}`} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}

        <View style={styles.sourceCard}>
          <Text style={styles.sourceLabel}>출처</Text>
          <Text style={styles.sourceTitle}>{recipe.source?.siteName} · {recipe.source?.title}</Text>
          <Text style={styles.sourceNotice}>
            {recipe.source?.isMock
              ? '홈 화면의 샘플 레시피입니다.'
              : 'AI가 검색한 원문 페이지로 이동합니다. 조리 전 원문 내용을 확인해 주세요.'}
          </Text>
          <TouchableOpacity onPress={showSource} style={styles.sourceButton}>
            <Text style={styles.sourceButtonText}>원문 링크 동작 확인</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  container: { paddingBottom: 40 },
  heroImage: { height: 260, width: '100%' },
  demoBadge: { alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: 9, marginLeft: 20, marginTop: 22, paddingHorizontal: 10, paddingVertical: 6 },
  demoBadgeText: { color: colors.primaryDark, fontSize: 11, fontWeight: '900' },
  title: { color: colors.text, fontSize: 29, fontWeight: '900', marginHorizontal: 20, marginTop: 12 },
  summary: { color: colors.textMuted, fontSize: 14, lineHeight: 22, marginHorizontal: 20, marginTop: 8 },
  metaCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', margin: 20, paddingVertical: 16 },
  metaItem: { alignItems: 'center', flex: 1 },
  metaValue: { color: colors.text, fontSize: 15, fontWeight: '900' },
  metaLabel: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  divider: { backgroundColor: colors.border, width: 1 },
  matchBox: { backgroundColor: '#EEF8F2', borderRadius: 14, marginBottom: 4, marginHorizontal: 20, padding: 15 },
  matchTitle: { color: colors.success, fontSize: 14, fontWeight: '900', marginBottom: 7 },
  matchText: { color: colors.textMuted, fontSize: 12, lineHeight: 19 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: 12, marginHorizontal: 20, marginTop: 26 },
  sectionCard: { backgroundColor: colors.surface, borderRadius: 16, marginHorizontal: 20, paddingHorizontal: 16 },
  ingredientRow: { borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
  lastRow: { borderBottomWidth: 0 },
  ingredientName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  ingredientAmount: { color: colors.textMuted, fontSize: 14 },
  stepRow: { flexDirection: 'row', marginBottom: 18, marginHorizontal: 20 },
  stepNumber: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 16, height: 32, justifyContent: 'center', marginRight: 13, width: 32 },
  stepNumberText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  stepText: { color: colors.text, flex: 1, fontSize: 14, lineHeight: 22, paddingTop: 5 },
  sourceCard: { backgroundColor: '#F4F1EC', borderRadius: 16, marginHorizontal: 20, marginTop: 18, padding: 17 },
  sourceLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  sourceTitle: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 5 },
  sourceNotice: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  sourceButton: { alignItems: 'center', borderColor: colors.border, borderRadius: 11, borderWidth: 1, marginTop: 13, padding: 11 },
  sourceButtonText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  empty: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
});
