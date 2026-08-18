import React, { useEffect, useState } from 'react';
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
import { getFeaturedRecipes } from '../api/mockApi';
import RecipeCard from '../components/RecipeCard';
import { colors } from '../constants/theme';

export default function Home({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [featuredRecipes, setFeaturedRecipes] = useState([]);

  useEffect(() => {
    let active = true;

    getFeaturedRecipes().then((result) => {
      if (active) setFeaturedRecipes(result);
    });

    return () => {
      active = false;
    };
  }, []);

  const startManualSearch = () => {
    const ingredients = searchText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (!ingredients.length) {
      Alert.alert('재료를 입력해 주세요', '예: 감자, 양파, 계란');
      return;
    }

    navigation.navigate('IngredientConfirm', {
      ingredients: ingredients.map((name, index) => ({
        id: `manual-${index}-${name}`,
        name,
        status: 'confirmed',
      })),
      source: 'manual',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <Image source={require('../../assets/Image/main_logo.png')} style={styles.logo} />
          <Text style={styles.brand}>FOODIA</Text>
          <View style={styles.demoBadge}>
            <Text style={styles.demoBadgeText}>DEMO</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>냉장고 속 재료를 맛있는 한 끼로</Text>
          <Text style={styles.heroTitle}>오늘은 어떤 재료로{`\n`}요리해 볼까요?</Text>
          <Text style={styles.heroDescription}>
            재료를 직접 입력하거나 사진을 찍어 레시피를 찾아보세요.
          </Text>

          <View style={styles.searchBox}>
            <TextInput
              onChangeText={setSearchText}
              onSubmitEditing={startManualSearch}
              placeholder="감자, 양파, 계란"
              placeholderTextColor="#AAA39A"
              returnKeyType="search"
              style={styles.searchInput}
              value={searchText}
            />
            <TouchableOpacity onPress={startManualSearch} style={styles.searchButton}>
              <Text style={styles.searchButtonText}>검색</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Camera')}
            style={styles.cameraButton}
          >
            <Text style={styles.cameraIcon}>📷</Text>
            <View style={styles.cameraCopy}>
              <Text style={styles.cameraTitle}>사진으로 재료 찾기</Text>
              <Text style={styles.cameraDescription}>AI 분석 체험용 가짜 데이터가 연결돼 있어요</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>추천 레시피</Text>
            <Text style={styles.sectionDescription}>현재는 가짜 JSON 데이터로 표시됩니다.</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {featuredRecipes.map((recipe) => (
            <RecipeCard
              compact
              key={recipe.id}
              onPress={() => navigation.navigate('RecipeDetail', { recipe })}
              recipe={recipe}
            />
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  brandRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 22 },
  logo: { height: 38, marginRight: 9, resizeMode: 'contain', width: 38 },
  brand: { color: colors.primary, fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  demoBadge: { backgroundColor: colors.primarySoft, borderRadius: 8, marginLeft: 9, paddingHorizontal: 8, paddingVertical: 4 },
  demoBadgeText: { color: colors.primaryDark, fontSize: 10, fontWeight: '900' },
  hero: { marginBottom: 32 },
  eyebrow: { color: colors.primary, fontSize: 13, fontWeight: '800', marginBottom: 9 },
  heroTitle: { color: colors.text, fontSize: 31, fontWeight: '900', letterSpacing: -0.8, lineHeight: 40 },
  heroDescription: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 12 },
  searchBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', marginTop: 22, padding: 6 },
  searchInput: { color: colors.text, flex: 1, fontSize: 15, paddingHorizontal: 12, paddingVertical: 11 },
  searchButton: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  searchButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  cameraButton: { alignItems: 'center', backgroundColor: colors.text, borderRadius: 18, flexDirection: 'row', marginTop: 12, padding: 17 },
  cameraIcon: { fontSize: 27, marginRight: 13 },
  cameraCopy: { flex: 1 },
  cameraTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  cameraDescription: { color: '#CFCBC5', fontSize: 11, marginTop: 4 },
  arrow: { color: '#FFFFFF', fontSize: 30, fontWeight: '300' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '900' },
  sectionDescription: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
});
