import React, { useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyzeIngredientImage } from '../api/foodiaApi';
import StateView from '../components/StateView';
import { colors } from '../constants/theme';

export default function CameraScreen({ navigation }) {
  const [previewUri, setPreviewUri] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeImage = async (asset) => {
    setPreviewUri(asset.uri);
    setAnalyzing(true);

    try {
      const result = await analyzeIngredientImage(asset);
      navigation.navigate('IngredientConfirm', {
        ingredients: result.ingredients,
        imageUri: asset.uri,
        source: 'camera',
      });
    } catch (error) {
      Alert.alert('분석 실패', error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('카메라 권한 필요', '사진을 촬영하려면 카메라 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      mediaTypes: ['images'],
      quality: 0.75,
    });

    if (!result.canceled) await analyzeImage(result.assets[0]);
  };

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('사진 권한 필요', '사진을 선택하려면 사진 보관함 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ['images'],
      quality: 0.75,
    });

    if (!result.canceled) await analyzeImage(result.assets[0]);
  };

  if (analyzing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {previewUri ? <Image source={{ uri: previewUri }} style={styles.preview} /> : null}
        <StateView
          description="OpenAI가 사진 속 식재료를 분석하고 있어요."
          loading
          title="사진 속 재료를 살펴보고 있어요"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.illustration}>
          <Text style={styles.illustrationIcon}>🥕</Text>
          <Text style={styles.illustrationIcon}>🥔</Text>
          <Text style={styles.illustrationIcon}>🥚</Text>
        </View>
        <Text style={styles.title}>식재료가 잘 보이게{`\n`}사진을 준비해 주세요</Text>
        <Text style={styles.description}>
          밝은 곳에서 재료가 겹치지 않도록 촬영하면{`\n`}더 정확하게 인식할 수 있어요.
        </Text>

        <TouchableOpacity onPress={openCamera} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>📷  카메라로 촬영하기</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={openGallery} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>🖼️  갤러리에서 선택하기</Text>
        </TouchableOpacity>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>현재는 데모 모드예요</Text>
          <Text style={styles.noticeText}>어떤 사진을 선택해도 준비된 재료 목록이 표시됩니다.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  illustration: { flexDirection: 'row', justifyContent: 'center', marginBottom: 26 },
  illustrationIcon: { fontSize: 48, marginHorizontal: 4 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', lineHeight: 38, textAlign: 'center' },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 22, marginBottom: 34, marginTop: 12, textAlign: 'center' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 15, marginBottom: 12, padding: 17 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 15, borderWidth: 1, padding: 17 },
  secondaryButtonText: { color: colors.text, fontSize: 16, fontWeight: '800' },
  notice: { backgroundColor: colors.primarySoft, borderRadius: 14, marginTop: 24, padding: 16 },
  noticeTitle: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  noticeText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  preview: { height: 220, width: '100%' },
});
