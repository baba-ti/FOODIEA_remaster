import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
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
import { addRestaurantRecord } from '../storage/restaurantDatabase';

function localDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function RestaurantEntryScreen({ navigation }) {
  const [restaurantName, setRestaurantName] = useState('');
  const [menuName, setMenuName] = useState('');
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [visitedAt, setVisitedAt] = useState(localDateString());
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locating, setLocating] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [saving, setSaving] = useState(false);

  const chooseImage = () => {
    Alert.alert('사진 추가', '어디에서 사진을 가져올까요?', [
      { text: '취소', style: 'cancel' },
      { text: '앨범', onPress: () => pickImage(false) },
      { text: '카메라', onPress: () => pickImage(true) },
    ]);
  };

  const pickImage = async (useCamera) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한이 필요해요', '설정에서 카메라 또는 사진 접근 권한을 허용해 주세요.');
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.75 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('위치 권한이 필요해요', '현재 위치를 기록하려면 위치 권한을 허용해 주세요.');
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nextLatitude = current.coords.latitude;
      const nextLongitude = current.coords.longitude;
      setLatitude(nextLatitude);
      setLongitude(nextLongitude);

      const [place] = await Location.reverseGeocodeAsync({
        latitude: nextLatitude,
        longitude: nextLongitude,
      });
      if (place) {
        const formattedAddress = [
          place.region,
          place.city,
          place.district,
          place.street,
          place.streetNumber,
        ].filter(Boolean).join(' ');
        if (formattedAddress) setAddress(formattedAddress);
      }
    } catch (error) {
      Alert.alert('현재 위치를 찾지 못했어요', '위치 서비스를 확인한 뒤 다시 시도해 주세요.');
    } finally {
      setLocating(false);
    }
  };

  const resolveCoordinates = async () => {
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
    if (!address.trim()) return { latitude: null, longitude: null };

    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return { latitude: null, longitude: null };
    const [position] = await Location.geocodeAsync(address.trim());
    return position
      ? { latitude: position.latitude, longitude: position.longitude }
      : { latitude: null, longitude: null };
  };

  const saveRecord = async () => {
    if (!restaurantName.trim() || !menuName.trim()) {
      Alert.alert('필수 항목을 확인해 주세요', '맛집 이름과 먹은 메뉴를 입력해 주세요.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(visitedAt)) {
      Alert.alert('날짜 형식을 확인해 주세요', 'YYYY-MM-DD 형식으로 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const coordinates = await resolveCoordinates();
      await addRestaurantRecord({
        restaurantName: restaurantName.trim(),
        menuName: menuName.trim(),
        rating,
        note: note.trim(),
        tags: tags.split(',').map((item) => item.trim()).filter(Boolean),
        imageUri,
        visitedAt,
        address: address.trim(),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        isFavorite,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('저장하지 못했어요', '잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.photoBox} onPress={chooseImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoIcon}>📷</Text>
                <Text style={styles.photoTitle}>음식 사진 추가</Text>
                <Text style={styles.helper}>카메라 또는 앨범에서 선택</Text>
              </View>
            )}
          </Pressable>

          <Text style={styles.label}>맛집 이름 *</Text>
          <TextInput style={styles.input} value={restaurantName} onChangeText={setRestaurantName} placeholder="예: 을지로 골목식당" placeholderTextColor="#A9A39B" />
          <Text style={styles.label}>먹은 메뉴 *</Text>
          <TextInput style={styles.input} value={menuName} onChangeText={setMenuName} placeholder="예: 들기름 막국수" placeholderTextColor="#A9A39B" />

          <Text style={styles.label}>평점</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)} hitSlop={5}>
                <Text style={[styles.star, star > rating && styles.starEmpty]}>★</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>한 줄 기록</Text>
          <TextInput style={[styles.input, styles.multiline]} value={note} onChangeText={setNote} placeholder="맛, 분위기, 다시 먹고 싶은 이유를 남겨보세요." placeholderTextColor="#A9A39B" multiline textAlignVertical="top" />
          <Text style={styles.label}>태그</Text>
          <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="데이트, 혼밥, 매운맛 (쉼표로 구분)" placeholderTextColor="#A9A39B" />
          <Text style={styles.label}>방문 날짜</Text>
          <TextInput style={styles.input} value={visitedAt} onChangeText={setVisitedAt} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
          <Text style={styles.label}>주소 또는 지역</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={(value) => {
              setAddress(value);
              setLatitude(null);
              setLongitude(null);
            }}
            placeholder="예: 서울특별시 마포구 연남동"
            placeholderTextColor="#A9A39B"
          />
          <View style={styles.locationRow}>
            <Pressable style={styles.locationButton} onPress={useCurrentLocation} disabled={locating}>
              <Text style={styles.locationButtonText}>{locating ? '위치 확인 중...' : '⌖ 현재 위치 사용'}</Text>
            </Pressable>
            {Number.isFinite(latitude) ? <Text style={styles.locationReady}>● 지도 위치 저장됨</Text> : null}
          </View>
          <Text style={styles.locationHelp}>주소를 입력하거나 현재 위치를 선택하면 맛집 지도에 표시됩니다.</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Foodia 즐겨찾기</Text>
              <Text style={styles.helper}>기록 목록에서 빠르게 구분할 수 있어요.</Text>
            </View>
            <Switch value={isFavorite} onValueChange={setIsFavorite} trackColor={{ true: colors.primarySoft }} thumbColor={isFavorite ? colors.primary : '#D6D0C8'} />
          </View>

          <Pressable style={[styles.saveButton, saving && styles.disabled]} onPress={saveRecord} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? '저장 중...' : '기록 저장하기'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 42 },
  photoBox: { height: 220, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.primarySoft, marginBottom: 24 },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#F5B7B0', borderRadius: 22 },
  photoIcon: { fontSize: 38, marginBottom: 9 },
  photoTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  helper: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  label: { color: colors.text, fontWeight: '800', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 15, color: colors.text, fontSize: 15, paddingHorizontal: 15, paddingVertical: 13 },
  multiline: { height: 110 },
  stars: { flexDirection: 'row', gap: 8, paddingVertical: 3 },
  star: { color: '#F5A623', fontSize: 34 },
  starEmpty: { color: '#DDD7CF' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 22, backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 9 },
  locationButton: { backgroundColor: '#EAF8EF', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10 },
  locationButtonText: { color: '#087B3B', fontSize: 12, fontWeight: '900' },
  locationReady: { color: colors.success, fontSize: 11, fontWeight: '800' },
  locationHelp: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 7 },
  switchText: { flex: 1 },
  switchTitle: { color: colors.text, fontWeight: '900' },
  saveButton: { backgroundColor: colors.primary, borderRadius: 17, alignItems: 'center', paddingVertical: 16, marginTop: 26 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  disabled: { opacity: 0.6 },
});
