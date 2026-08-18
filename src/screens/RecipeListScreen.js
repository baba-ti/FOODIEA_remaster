import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchMockRecipes } from '../api/mockApi';
import IngredientChip from '../components/IngredientChip';
import RecipeCard from '../components/RecipeCard';
import StateView from '../components/StateView';
import { colors } from '../constants/theme';

export default function RecipeListScreen({ navigation, route }) {
  const ingredients = route.params?.ingredients ?? [];
  const excludeIngredients = route.params?.excludeIngredients ?? [];
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    searchMockRecipes({ ingredients, excludeIngredients })
      .then((result) => {
        if (active) setRecipes(result.recipes);
      })
      .catch(() => {
        if (active) setError('레시피를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ingredients.join(','), excludeIngredients.join(',')]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StateView
          description="실제 Agent 대신 가짜 JSON에서 조건에 맞는 결과를 정렬하고 있어요."
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
          <Text style={styles.demoTitle}>DEMO SEARCH</Text>
          <Text style={styles.demoText}>현재 결과와 출처는 화면 개발을 위한 가짜 데이터입니다.</Text>
        </View>

        <Text style={styles.title}>재료와 잘 맞는 레시피</Text>
        <Text style={styles.description}>
          보유 재료 일치율과 조리 시간을 기준으로 정렬했어요.
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
});
