import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IngredientChip from '../components/IngredientChip';
import { colors } from '../constants/theme';
import { useFoodPreferences } from '../context/FoodPreferencesContext';

export default function IngredientConfirmScreen({ navigation, route }) {
  const { defaultExcludedIngredients } = useFoodPreferences();
  const initialIngredients = route.params?.ingredients ?? [];
  const imageUri = route.params?.imageUri;
  const source = route.params?.source ?? 'manual';
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [newIngredient, setNewIngredient] = useState('');
  const [excludeText, setExcludeText] = useState('');

  const uncertainCount = useMemo(
    () => ingredients.filter((item) => item.status === 'uncertain').length,
    [ingredients],
  );

  const addIngredient = () => {
    const name = newIngredient.trim();
    if (!name) return;

    const alreadyExists = ingredients.some((item) => item.name === name);
    if (alreadyExists) {
      Alert.alert('이미 추가된 재료예요');
      return;
    }

    setIngredients((current) => [
      ...current,
      { id: `added-${Date.now()}`, name, status: 'confirmed' },
    ]);
    setNewIngredient('');
  };

  const removeIngredient = (id) => {
    setIngredients((current) => current.filter((item) => item.id !== id));
  };

  const searchRecipes = () => {
    if (!ingredients.length) {
      Alert.alert('재료가 필요해요', '한 가지 이상의 재료를 추가해 주세요.');
      return;
    }

    const sessionExcludedIngredients = excludeText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const excludeIngredients = Array.from(
      new Set([...defaultExcludedIngredients, ...sessionExcludedIngredients]),
    );

    navigation.navigate('RecipeList', {
      ingredients: ingredients.map((item) => item.name),
      excludeIngredients,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} />
        ) : null}

        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>
              {source === 'camera' ? 'AI 분석 결과 · 데모' : '직접 입력한 재료'}
            </Text>
            <Text style={styles.title}>검색할 재료를 확인해 주세요</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{ingredients.length}개</Text>
          </View>
        </View>

        <Text style={styles.description}>
          잘못 인식된 재료는 삭제하고 빠진 재료는 직접 추가할 수 있어요.
        </Text>

        {uncertainCount > 0 ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              확인이 필요한 재료가 {uncertainCount}개 있어요. 맞지 않으면 삭제해
              주세요.
            </Text>
          </View>
        ) : null}

        <View style={styles.chipContainer}>
          {ingredients.map((ingredient) => (
            <IngredientChip
              key={ingredient.id}
              name={ingredient.name}
              onRemove={() => removeIngredient(ingredient.id)}
              uncertain={ingredient.status === 'uncertain'}
            />
          ))}
        </View>

        <Text style={styles.label}>재료 추가</Text>
        <View style={styles.inputRow}>
          <TextInput
            onChangeText={setNewIngredient}
            onSubmitEditing={addIngredient}
            placeholder="예: 두부"
            placeholderTextColor="#AAA39A"
            returnKeyType="done"
            style={styles.input}
            value={newIngredient}
          />
          <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
            <Text style={styles.addButtonText}>추가</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>제외할 재료</Text>
        {defaultExcludedIngredients.length ? (
          <View style={styles.savedExclusions}>
            <Text style={styles.savedExclusionsTitle}>기본 제외 목록</Text>
            <Text style={styles.savedExclusionsText}>
              {defaultExcludedIngredients.join(', ')}
            </Text>
          </View>
        ) : null}
        <TextInput
          onChangeText={setExcludeText}
          placeholder="알레르기 또는 제외 재료를 쉼표로 구분해 주세요"
          placeholderTextColor="#AAA39A"
          style={styles.excludeInput}
          value={excludeText}
        />
        <Text style={styles.helper}>예: 우유, 땅콩</Text>

        <TouchableOpacity onPress={searchRecipes} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>이 재료로 레시피 찾기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  container: { padding: 20, paddingBottom: 42 },
  preview: { borderRadius: 18, height: 190, marginBottom: 24, width: '100%' },
  headerRow: { alignItems: 'flex-start', flexDirection: 'row' },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 7,
  },
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 34,
  },
  countBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  countText: { color: colors.primaryDark, fontSize: 13, fontWeight: '900' },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  warningBox: {
    backgroundColor: '#FFF8E8',
    borderRadius: 12,
    marginTop: 18,
    padding: 13,
  },
  warningText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    marginTop: 22,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 9,
    marginTop: 14,
  },
  inputRow: { flexDirection: 'row' },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  addButton: {
    backgroundColor: colors.text,
    borderRadius: 13,
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 19,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  excludeInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  helper: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: 3,
    marginTop: 6,
  },
  savedExclusions: { backgroundColor: colors.primarySoft, borderRadius: 12, marginBottom: 10, padding: 12 },
  savedExclusionsTitle: { color: colors.primaryDark, fontSize: 11, fontWeight: '900' },
  savedExclusionsText: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: 4 },
  searchButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 15,
    marginTop: 30,
    padding: 17,
  },
  searchButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
});
