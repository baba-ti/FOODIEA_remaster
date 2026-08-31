import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';
import { useFoodPreferences } from '../context/FoodPreferencesContext';

function arrayToText(items = []) {
  return items.join(', ');
}

function textToArray(text) {
  return text.split(',').map((item) => item.trim()).filter(Boolean);
}

function ChoiceRow({ options, value, onChange, suffix = '' }) {
  return (
    <View style={styles.choices}>
      {options.map((option) => (
        <Pressable
          key={option}
          style={[styles.choice, value === option && styles.choiceActive]}
          onPress={() => onChange(option)}
        >
          <Text style={[styles.choiceText, value === option && styles.choiceTextActive]}>
            {option}{suffix}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function SettingSwitch({ title, description, value, onValueChange }) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchCopy}>
        <Text style={styles.switchTitle}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#DED9D2', true: '#F8B9B2' }}
        thumbColor={value ? colors.primary : '#FFFFFF'}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { preferences, saveFoodPreferences } = useFoodPreferences();
  const [form, setForm] = useState({
    allergies: '',
    dislikedIngredients: '',
    avoidRecentDays: 3,
    weatherRecommendations: true,
    seasonalRecommendations: true,
    restaurantHistoryRecommendations: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      ...preferences,
      allergies: arrayToText(preferences.allergies),
      dislikedIngredients: arrayToText(preferences.dislikedIngredients),
    });
  }, [preferences]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await saveFoodPreferences({
        ...form,
        allergies: textToArray(form.allergies),
        dislikedIngredients: textToArray(form.dislikedIngredients),
      });
      Alert.alert(
        '저장했어요',
        '안전 조건과 AI 추천 기준이 다음 추천부터 반영됩니다.',
      );
    } catch (error) {
      Alert.alert('저장하지 못했어요', '잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>PERSONALIZE FOODIA</Text>
        <Text style={styles.title}>사용자 설정</Text>
        <Text style={styles.subtitle}>추천 기준과 안전 조건을 내 취향에 맞게 관리하세요.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>안전 및 제외 조건</Text>
          <Text style={styles.label}>알레르기</Text>
          <TextInput
            style={styles.input}
            value={form.allergies}
            onChangeText={(value) => update('allergies', value)}
            placeholder="예: 땅콩, 새우, 우유"
            placeholderTextColor="#A9A39B"
          />
          <Text style={styles.help}>쉼표로 구분해 주세요. AI 검색에서 항상 제외합니다.</Text>
          <Text style={styles.label}>싫어하는 재료</Text>
          <TextInput
            style={styles.input}
            value={form.dislikedIngredients}
            onChangeText={(value) => update('dislikedIngredients', value)}
            placeholder="예: 고수, 가지"
            placeholderTextColor="#A9A39B"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 추천 기준</Text>
          <SettingSwitch title="현재 날씨 반영" description="기온과 날씨에 어울리는 메뉴를 우선 추천해요." value={form.weatherRecommendations} onValueChange={(value) => update('weatherRecommendations', value)} />
          <SettingSwitch title="날짜·계절 반영" description="복날, 명절, 제철 음식 등 날짜 맥락을 사용해요." value={form.seasonalRecommendations} onValueChange={(value) => update('seasonalRecommendations', value)} />
          <SettingSwitch title="맛집 기록 반영" description="높은 평점을 준 메뉴를 취향 정보로 활용해요." value={form.restaurantHistoryRecommendations} onValueChange={(value) => update('restaurantHistoryRecommendations', value)} />
          <Text style={styles.label}>최근 먹은 메뉴 제외 기간</Text>
          <ChoiceRow options={[1, 3, 7, 14]} value={form.avoidRecentDays} onChange={(value) => update('avoidRecentDays', value)} suffix="일" />
        </View>

        <View style={styles.privacyBox}>
          <Text style={styles.privacyTitle}>내 데이터 관리 방식</Text>
          <Text style={styles.description}>맛집 기록과 취향 설정은 현재 기기의 로컬 저장소에 보관됩니다.</Text>
        </View>

        <Pressable style={[styles.saveButton, saving && styles.disabled]} onPress={save} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? '저장 중...' : '설정 저장하기'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 42 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginBottom: 5 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: 22 },
  section: { backgroundColor: colors.surface, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginBottom: 8 },
  label: { color: colors.text, fontSize: 13, fontWeight: '800', marginTop: 14, marginBottom: 8 },
  input: { color: colors.text, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  help: { color: colors.primaryDark, fontSize: 11, lineHeight: 17, marginTop: 6 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 13 },
  choiceActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  choiceText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  choiceTextActive: { color: colors.primaryDark },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 14 },
  switchCopy: { flex: 1 },
  switchTitle: { color: colors.text, fontWeight: '800', fontSize: 14 },
  description: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  privacyBox: { backgroundColor: '#F1F5F2', borderRadius: 17, padding: 16, marginBottom: 18 },
  privacyTitle: { color: '#315B43', fontSize: 14, fontWeight: '900' },
  saveButton: { backgroundColor: colors.primary, borderRadius: 17, alignItems: 'center', paddingVertical: 16 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  disabled: { opacity: 0.6 },
});
