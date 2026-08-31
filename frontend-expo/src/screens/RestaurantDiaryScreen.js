import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RestaurantMap from '../components/RestaurantMap';
import { colors, shadows } from '../constants/theme';
import {
  deleteRestaurantRecord,
  listRestaurantRecords,
  setRestaurantFavorite,
  updateRestaurantCoordinates,
} from '../storage/restaurantDatabase';

function RestaurantCard({ record, onDelete, onFavorite }) {
  const openNaverMap = () => {
    const query = record.address || record.restaurantName;
    Linking.openURL(`https://map.naver.com/p/search/${encodeURIComponent(query)}`).catch(() =>
      Alert.alert('지도를 열 수 없어요', '잠시 후 다시 시도해 주세요.'),
    );
  };

  return (
    <View style={styles.card}>
      {record.imageUri ? <Image source={{ uri: record.imageUri }} style={styles.photo} /> : null}
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.restaurantName}>{record.restaurantName}</Text>
            <Text style={styles.menuName}>{record.menuName}</Text>
          </View>
          <Pressable
            accessibilityLabel="즐겨찾기 변경"
            hitSlop={10}
            onPress={() => onFavorite(record)}
          >
            <Text style={[styles.favorite, record.isFavorite && styles.favoriteActive]}>
              {record.isFavorite ? '♥' : '♡'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.rating}>{'★'.repeat(Math.round(record.rating))}</Text>
          <Text style={styles.date}>{record.visitedAt}</Text>
        </View>
        {record.note ? <Text style={styles.note}>{record.note}</Text> : null}
        {record.tags.length ? (
          <View style={styles.tags}>
            {record.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>#{tag}</Text>
            ))}
          </View>
        ) : null}
        <View style={styles.actions}>
          <Pressable style={styles.mapButton} onPress={openNaverMap}>
            <Text style={styles.mapButtonText}>네이버 지도에서 보기</Text>
          </Pressable>
          <Pressable onPress={() => onDelete(record)} hitSlop={8}>
            <Text style={styles.deleteText}>삭제</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function RestaurantDiaryListScreen({ navigation }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    try {
      setRecords(await listRestaurantRecords());
    } catch (error) {
      Alert.alert('기록을 불러오지 못했어요', '앱을 다시 실행해 주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords]),
  );

  const handleFavorite = async (record) => {
    await setRestaurantFavorite(record.id, !record.isFavorite);
    await loadRecords();
  };

  const handleDelete = (record) => {
    Alert.alert('맛집 기록 삭제', `${record.restaurantName} 기록을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteRestaurantRecord(record.id);
          await loadRecords();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <RestaurantCard record={item} onDelete={handleDelete} onFavorite={handleFavorite} />
        )}
        contentContainerStyle={[styles.content, !records.length && styles.emptyContent]}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>MY FOOD DIARY</Text>
              <Text style={styles.title}>맛집 기록</Text>
              <Text style={styles.subtitle}>좋았던 한 끼를 취향 데이터로 남겨보세요.</Text>
            </View>
            <Pressable style={styles.addButton} onPress={() => navigation.navigate('RestaurantEntry')}>
              <Text style={styles.addButtonText}>+ 기록</Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <Text style={styles.emptyText}>기록을 불러오는 중...</Text>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={styles.emptyTitle}>아직 맛집 기록이 없어요</Text>
              <Text style={styles.emptyText}>사진과 평점을 남기면 AI 추천에 활용할 수 있어요.</Text>
              <Pressable style={styles.emptyButton} onPress={() => navigation.navigate('RestaurantEntry')}>
                <Text style={styles.emptyButtonText}>첫 기록 남기기</Text>
              </Pressable>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 36 },
  emptyContent: { flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, gap: 12 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginBottom: 5 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 6 },
  addButton: { backgroundColor: colors.primary, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 11 },
  addButtonText: { color: '#fff', fontWeight: '900' },
  card: { backgroundColor: colors.surface, borderRadius: 22, marginBottom: 18, overflow: 'hidden', ...shadows.card },
  photo: { width: '100%', height: 190, backgroundColor: colors.border },
  cardBody: { padding: 18 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardTitleBlock: { flex: 1 },
  restaurantName: { color: colors.text, fontSize: 20, fontWeight: '900' },
  menuName: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  favorite: { color: colors.textMuted, fontSize: 28 },
  favoriteActive: { color: colors.primary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 13 },
  rating: { color: '#F5A623', fontSize: 15, letterSpacing: 1 },
  date: { color: colors.textMuted, fontSize: 12 },
  note: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: 13 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  tag: { color: colors.primaryDark, backgroundColor: colors.primarySoft, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, fontSize: 12, fontWeight: '700' },
  actions: { borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14 },
  mapButton: { backgroundColor: '#EAF8EF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  mapButtonText: { color: '#087B3B', fontWeight: '800', fontSize: 12 },
  deleteText: { color: colors.textMuted, fontSize: 12 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 15 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: 8 },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyButton: { backgroundColor: colors.text, borderRadius: 15, marginTop: 20, paddingHorizontal: 20, paddingVertical: 12 },
  emptyButtonText: { color: '#fff', fontWeight: '900' },
});

export default function RestaurantDiaryScreen({ navigation }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const attemptedGeocodes = useRef(new Set());

  const loadRecords = useCallback(async () => {
    try {
      const nextRecords = await listRestaurantRecords();
      setRecords(nextRecords);
      setSelectedId((current) => current ?? nextRecords.find((item) => item.isFavorite)?.id ?? null);
    } catch (error) {
      Alert.alert('기록을 불러오지 못했어요', '앱을 다시 실행해 주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadRecords(); }, [loadRecords]));

  useEffect(() => {
    if (viewMode !== 'map' || locationStatus === 'working') return;
    const missing = records.filter(
      (record) =>
        record.address &&
        !Number.isFinite(record.latitude) &&
        !attemptedGeocodes.current.has(record.id),
    );
    if (!missing.length) return;

    const geocodeExistingRecords = async () => {
      setLocationStatus('working');
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) {
          setLocationStatus('denied');
          return;
        }
        let updated = false;
        for (const record of missing) {
          attemptedGeocodes.current.add(record.id);
          try {
            const [position] = await Location.geocodeAsync(record.address);
            if (position) {
              await updateRestaurantCoordinates(record.id, position.latitude, position.longitude);
              updated = true;
            }
          } catch (error) {
            // 변환되지 않은 주소는 목록 기록으로 유지합니다.
          }
        }
        setLocationStatus('done');
        if (updated) await loadRecords();
      } catch (error) {
        setLocationStatus('error');
      }
    };
    geocodeExistingRecords();
  }, [records, viewMode, locationStatus, loadRecords]);

  const handleFavorite = async (record) => {
    await setRestaurantFavorite(record.id, !record.isFavorite);
    await loadRecords();
  };

  const handleDelete = (record) => {
    Alert.alert('맛집 기록 삭제', `${record.restaurantName} 기록을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteRestaurantRecord(record.id);
          if (selectedId === record.id) setSelectedId(null);
          await loadRecords();
        },
      },
    ]);
  };

  const openSelectedInNaverMap = () => {
    const selected = records.find((record) => record.id === selectedId);
    if (!selected) return;
    const query = [selected.restaurantName, selected.address].filter(Boolean).join(' ');
    Linking.openURL(`https://map.naver.com/p/search/${encodeURIComponent(query)}`).catch(() =>
      Alert.alert('네이버 지도를 열 수 없어요', '잠시 후 다시 시도해 주세요.'),
    );
  };

  const selectedRecord = records.find((record) => record.id === selectedId);
  const mappedCount = records.filter(
    (record) => Number.isFinite(record.latitude) && Number.isFinite(record.longitude),
  ).length;

  return (
    <SafeAreaView style={mapStyles.safeArea} edges={['top']}>
      <View style={mapStyles.header}>
        <View style={mapStyles.headerCopy}>
          <Text style={mapStyles.eyebrow}>MY FOOD DIARY</Text>
          <Text style={mapStyles.title}>맛집 기록</Text>
          <Text style={mapStyles.subtitle}>내가 다녀온 맛집을 지도에서 한눈에 확인하세요.</Text>
        </View>
        <Pressable style={mapStyles.addButton} onPress={() => navigation.navigate('RestaurantEntry')}>
          <Text style={mapStyles.addButtonText}>+ 기록</Text>
        </Pressable>
      </View>

      <View style={mapStyles.segment}>
        {[
          { key: 'list', label: `목록 ${records.length}` },
          { key: 'map', label: `지도 ${mappedCount}` },
        ].map((option) => (
          <Pressable
            key={option.key}
            style={[mapStyles.segmentButton, viewMode === option.key && mapStyles.segmentButtonActive]}
            onPress={() => setViewMode(option.key)}
          >
            <Text style={[mapStyles.segmentText, viewMode === option.key && mapStyles.segmentTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {viewMode === 'list' ? (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <RestaurantCard record={item} onDelete={handleDelete} onFavorite={handleFavorite} />
          )}
          contentContainerStyle={[mapStyles.listContent, !records.length && mapStyles.emptyContent]}
          ListEmptyComponent={
            loading ? (
              <Text style={mapStyles.emptyText}>기록을 불러오는 중...</Text>
            ) : (
              <View style={mapStyles.emptyBox}>
                <Text style={mapStyles.emptyIcon}>🍽️</Text>
                <Text style={mapStyles.emptyTitle}>아직 맛집 기록이 없어요</Text>
                <Text style={mapStyles.emptyText}>주소를 함께 기록하면 지도에 맛집 마커가 생겨요.</Text>
                <Pressable style={mapStyles.emptyButton} onPress={() => navigation.navigate('RestaurantEntry')}>
                  <Text style={mapStyles.emptyButtonText}>첫 기록 남기기</Text>
                </Pressable>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={mapStyles.mapSection}>
          {locationStatus === 'working' ? (
            <View style={mapStyles.notice}><Text style={mapStyles.noticeText}>기존 주소를 지도 위치로 변환하는 중...</Text></View>
          ) : null}
          {locationStatus === 'denied' ? (
            <View style={mapStyles.notice}><Text style={mapStyles.noticeText}>위치 권한을 허용하면 기존 주소도 지도에 표시할 수 있어요.</Text></View>
          ) : null}
          <View style={mapStyles.mapFrame}>
            <RestaurantMap records={records} onSelect={setSelectedId} />
          </View>
          {selectedRecord ? (
            <View style={mapStyles.selectedCard}>
              {selectedRecord.imageUri ? <Image source={{ uri: selectedRecord.imageUri }} style={mapStyles.selectedPhoto} /> : null}
              <View style={mapStyles.selectedCopy}>
                <View style={mapStyles.selectedTitleRow}>
                  <View style={mapStyles.selectedTitleCopy}>
                    <Text style={mapStyles.selectedName} numberOfLines={1}>{selectedRecord.restaurantName}</Text>
                    <Text style={mapStyles.selectedMenu} numberOfLines={1}>{selectedRecord.menuName} · ★ {selectedRecord.rating}</Text>
                  </View>
                  {selectedRecord.isFavorite ? <Text style={mapStyles.selectedFavorite}>♥</Text> : null}
                </View>
                <Text style={mapStyles.selectedMeta}>{[selectedRecord.visitedAt, selectedRecord.address].filter(Boolean).join(' · ')}</Text>
                {selectedRecord.note ? <Text style={mapStyles.selectedNote} numberOfLines={2}>{selectedRecord.note}</Text> : null}
                {selectedRecord.tags.length ? (
                  <Text style={mapStyles.selectedTags} numberOfLines={1}>{selectedRecord.tags.map((tag) => `#${tag}`).join('  ')}</Text>
                ) : null}
                <Pressable style={mapStyles.naverButton} onPress={openSelectedInNaverMap}>
                  <Text style={mapStyles.naverButtonText}>네이버 지도에서 보기</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={mapStyles.mapHint}>마커를 누르면 맛집 기록을 확인할 수 있어요.</Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const mapStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingTop: 10 },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginBottom: 5 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 6 },
  addButton: { backgroundColor: colors.primary, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 11 },
  addButtonText: { color: '#fff', fontWeight: '900' },
  segment: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, marginBottom: 14, padding: 4, borderRadius: 15, backgroundColor: '#EEEAE4' },
  segmentButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  segmentButtonActive: { backgroundColor: colors.surface, ...shadows.card },
  segmentText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  segmentTextActive: { color: colors.text },
  listContent: { paddingHorizontal: 20, paddingBottom: 36 },
  emptyContent: { flexGrow: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 15 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: 8 },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyButton: { backgroundColor: colors.text, borderRadius: 15, marginTop: 20, paddingHorizontal: 20, paddingVertical: 12 },
  emptyButtonText: { color: '#fff', fontWeight: '900' },
  mapSection: { flex: 1 },
  mapFrame: { flex: 1, minHeight: 280, marginHorizontal: 20, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  notice: { marginHorizontal: 20, marginBottom: 8, backgroundColor: colors.primarySoft, padding: 10, borderRadius: 12 },
  noticeText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  selectedCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.surface, margin: 12, marginHorizontal: 20, padding: 13, borderRadius: 17, ...shadows.card },
  selectedPhoto: { width: 82, height: 82, borderRadius: 13, backgroundColor: colors.border },
  selectedCopy: { flex: 1 },
  selectedTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  selectedTitleCopy: { flex: 1 },
  selectedName: { color: colors.text, fontSize: 15, fontWeight: '900' },
  selectedMenu: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  selectedFavorite: { color: colors.primary, fontSize: 18 },
  selectedMeta: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 6 },
  selectedNote: { color: colors.text, fontSize: 11, lineHeight: 16, marginTop: 5 },
  selectedTags: { color: colors.primaryDark, fontSize: 10, fontWeight: '700', marginTop: 5 },
  naverButton: { alignSelf: 'flex-start', backgroundColor: '#EAF8EF', borderRadius: 11, paddingHorizontal: 11, paddingVertical: 8, marginTop: 9 },
  naverButtonText: { color: '#087B3B', fontSize: 11, fontWeight: '900' },
  mapHint: { color: colors.textMuted, fontSize: 12, textAlign: 'center', padding: 18 },
});
