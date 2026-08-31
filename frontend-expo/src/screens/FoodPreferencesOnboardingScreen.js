import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';
import { useFoodPreferences } from '../context/FoodPreferencesContext';

const COMMON_ALLERGENS = ['달걀', '우유', '땅콩', '대두', '밀', '새우', '게', '생선', '조개류', '견과류'];

function parseIngredients(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export default function FoodPreferencesOnboardingScreen({ navigation }) {
  const { saveFoodPreferences } = useFoodPreferences();
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [otherAllergies, setOtherAllergies] = useState('');
  const [dislikedIngredients, setDislikedIngredients] = useState('');
  const [favoriteFoods, setFavoriteFoods] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleAllergy = (allergy) => {
    setSelectedAllergies((current) =>
      current.includes(allergy)
        ? current.filter((item) => item !== allergy)
        : [...current, allergy],
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveFoodPreferences({
        allergies: [...selectedAllergies, ...parseIngredients(otherAllergies)],
        dislikedIngredients: parseIngredients(dislikedIngredients),
        favoriteFoods: parseIngredients(favoriteFoods),
      });
      navigation.replace('Home');
    } catch {
      Alert.alert('저장 실패', '음식 설정을 저장하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>FOODIA PERSONAL SETUP</Text>
        <Text style={styles.title}>안전한 추천을 위해{`\n`}음식 정보를 알려주세요</Text>
        <Text style={styles.description}>
          알레르기와 싫어하는 재료는 제외 조건으로, 좋아하는 음식은 AI 추천 취향으로 적용됩니다.
        </Text>

        <Text style={styles.sectionTitle}>알레르기가 있나요?</Text>
        <Text style={styles.helper}>해당 항목을 모두 선택해 주세요. 없다면 선택하지 않아도 됩니다.</Text>
        <View style={styles.chips}>
          {COMMON_ALLERGENS.map((allergy) => {
            const selected = selectedAllergies.includes(allergy);
            return (
              <TouchableOpacity key={allergy} onPress={() => toggleAllergy(allergy)} style={[styles.chip, selected && styles.chipSelected]}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{allergy}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput onChangeText={setOtherAllergies} placeholder="기타 알레르기 재료를 쉼표로 구분해 주세요" placeholderTextColor="#AAA39A" style={styles.input} value={otherAllergies} />

        <Text style={styles.sectionTitle}>싫어하는 재료가 있나요?</Text>
        <Text style={styles.helper}>추천에서 제외할 재료를 쉼표로 구분해 입력해 주세요.</Text>
        <TextInput onChangeText={setDislikedIngredients} placeholder="예: 가지, 고수, 피망" placeholderTextColor="#AAA39A" style={styles.input} value={dislikedIngredients} />

        <Text style={styles.sectionTitle}>좋아하는 음식은 무엇인가요?</Text>
        <Text style={styles.helper}>AI가 메뉴를 추천할 때 참고할 음식이나 종류를 입력해 주세요.</Text>
        <TextInput onChangeText={setFavoriteFoods} placeholder="예: 김치찌개, 파스타, 국물 요리" placeholderTextColor="#AAA39A" style={styles.input} value={favoriteFoods} />

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>알레르기 안전 안내</Text>
          <Text style={styles.noticeText}>AI 추천은 참고용입니다. 제품 표시사항과 식당의 교차오염 가능성을 반드시 직접 확인해 주세요.</Text>
        </View>

        <TouchableOpacity disabled={saving} onPress={save} style={[styles.button, saving && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>{saving ? '저장하고 있어요...' : '설정 저장하고 시작하기'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  container: { padding: 24, paddingBottom: 42 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 29, fontWeight: '900', lineHeight: 39, marginTop: 10 },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 22, marginTop: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 30 },
  helper: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginTop: 14 },
  chip: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, margin: 4, paddingHorizontal: 14, paddingVertical: 10 },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  chipTextSelected: { color: '#FFFFFF' },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, fontSize: 14, marginTop: 14, paddingHorizontal: 15, paddingVertical: 14 },
  notice: { backgroundColor: '#FFF8E8', borderRadius: 14, marginTop: 28, padding: 15 },
  noticeTitle: { color: colors.warning, fontSize: 13, fontWeight: '900' },
  noticeText: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 5 },
  button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 16, marginTop: 24, padding: 17 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
});
