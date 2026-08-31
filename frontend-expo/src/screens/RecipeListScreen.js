import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchRecipes } from '../api/foodiaApi';
import IngredientChip from '../components/IngredientChip';
import RecipeCard from '../components/RecipeCard';
import StateView from '../components/StateView';
import { colors } from '../constants/theme';
import { useFoodPreferences } from '../context/FoodPreferencesContext';
import { buildRecommendationPreferences } from '../services/recommendationContext';

export default function RecipeListScreen({ navigation, route }) {
  const { preferences } = useFoodPreferences();
  const ingredients = route.params?.ingredients ?? [];
  const excludeIngredients = route.params?.excludeIngredients ?? [];
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    buildRecommendationPreferences(preferences)
      .then((recommendationPreferences) =>
        searchRecipes({
          ingredients,
          excludeIngredients,
          preferences: recommendationPreferences,
          maxResults: 8,
        }),
      )
      .then((result) => {
        if (active) {
          setRecipes(result.recipes);
          setHasMore(result.recipes.length > 0);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ingredients.join(','), excludeIngredients.join(','), preferences]);

  const loadMoreRecipes = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const recommendationPreferences = await buildRecommendationPreferences(preferences);
      const excludedSourceUrls = recipes
        .map((recipe) => recipe.source?.url)
        .filter(Boolean);
      const result = await searchRecipes({
        ingredients,
        excludeIngredients,
        excludedSourceUrls,
        preferences: recommendationPreferences,
        maxResults: 8,
      });
      const knownUrls = new Set(excludedSourceUrls);
      const newRecipes = result.recipes.filter(
        (recipe) => recipe.source?.url && !knownUrls.has(recipe.source.url),
      );

      setRecipes((current) => [...current, ...newRecipes]);
      setHasMore(newRecipes.length > 0);
    } catch (requestError) {
      Alert.alert('추가 검색 실패', requestError.message);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StateView
          description="AI Agent가 만개의레시피에서 조건에 맞는 결과를 찾고 있어요."
          loading
          title="웹 레시피를 찾고 있어요"
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return <StateView description="잠시 후 다시 시도해 주세요." title={error} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.demoNotice}>
          <Text style={styles.demoTitle}>AI WEB SEARCH</Text>
          <Text style={styles.demoText}>만개의레시피 검색 결과를 AI 추천 적합도에 따라 정리했습니다.</Text>
        </View>

        <Text style={styles.title}>재료와 잘 맞는 레시피</Text>
        <Text style={styles.description}>
          보유 재료, 추가 구매 부담, 조리 시간과 음식 취향을 함께 반영했어요.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {ingredients.map((ingredient) => (
            <IngredientChip key={ingredient} name={ingredient} />
          ))}
        </ScrollView>

        {excludeIngredients.length ? (
          <Text style={styles.excluded}>제외: {excludeIngredients.join(', ')}</Text>
        ) : null}

        <Text style={styles.resultCount}>총 {recipes.length}개의 데모 결과</Text>
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            onPress={() => navigation.navigate('RecipeDetail', { recipe })}
            recipe={recipe}
          />
        ))}

        {hasMore ? (
          <TouchableOpacity
            disabled={loadingMore}
            onPress={loadMoreRecipes}
            style={[styles.moreButton, loadingMore && styles.moreButtonDisabled]}
          >
            <Text style={styles.moreButtonText}>
              {loadingMore ? '추가 레시피를 찾고 있어요...' : '레시피 더 보기'}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.endText}>더 이상 새로운 레시피가 없어요.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  demoNotice: { backgroundColor: colors.primarySoft, borderRadius: 13, marginBottom: 22, padding: 14 },
  demoTitle: { color: colors.primaryDark, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  demoText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900' },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  chips: { marginBottom: 6, marginTop: 20 },
  excluded: { color: colors.warning, fontSize: 12, fontWeight: '700', marginTop: 6 },
  resultCount: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 14, marginTop: 22 },
  moreButton: { alignItems: 'center', backgroundColor: colors.text, borderRadius: 14, marginTop: 8, padding: 15 },
  moreButtonDisabled: { opacity: 0.6 },
  moreButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  endText: { color: colors.textMuted, fontSize: 12, marginTop: 14, textAlign: 'center' },
});
