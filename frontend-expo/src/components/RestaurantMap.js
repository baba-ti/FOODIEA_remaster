import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../constants/theme';

function createMapHtml(records) {
  const markers = records.map((record) => ({
    id: record.id,
    name: record.restaurantName,
    menu: record.menuName,
    rating: record.rating,
    visitedAt: record.visitedAt,
    address: record.address,
    favorite: record.isFavorite,
    latitude: record.latitude,
    longitude: record.longitude,
  }));
  const markerJson = JSON.stringify(markers)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  return `<!DOCTYPE html>
  <html lang="ko">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        html, body, #map { width: 100%; height: 100%; margin: 0; background: #F2EFE9; }
        .leaflet-control-attribution { font-size: 9px; }
        .foodia-pin { width: 34px; height: 34px; border-radius: 18px 18px 18px 5px; transform: rotate(-45deg); background: #F45B4F; border: 3px solid white; box-shadow: 0 3px 9px rgba(38,35,31,.28); }
        .foodia-pin.favorite { background: #26231F; }
        .foodia-pin span { display: block; transform: rotate(45deg); color: white; font-size: 15px; line-height: 28px; text-align: center; }
        .popup-title { font-weight: 800; font-size: 14px; color: #26231F; margin-bottom: 3px; }
        .popup-copy { color: #746F68; font-size: 12px; line-height: 1.45; }
        .popup-meta { color: #9A938A; font-size: 10px; margin-top: 4px; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        const records = ${markerJson};
        const map = L.map('map', { zoomControl: true }).setView([37.5665, 126.9780], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        const points = [];
        records.forEach((record) => {
          const icon = L.divIcon({
            className: '',
            html: '<div class="foodia-pin ' + (record.favorite ? 'favorite' : '') + '"><span>' + (record.favorite ? '♥' : '●') + '</span></div>',
            iconSize: [38, 38],
            iconAnchor: [12, 34],
            popupAnchor: [7, -31]
          });
          const marker = L.marker([record.latitude, record.longitude], { icon }).addTo(map);
          marker.bindPopup('<div class="popup-title"></div><div class="popup-copy"></div><div class="popup-meta"></div>');
          marker.on('popupopen', () => {
            const popup = marker.getPopup().getElement();
            popup.querySelector('.popup-title').textContent = record.name;
            popup.querySelector('.popup-copy').textContent = record.menu + ' · ★ ' + record.rating;
            popup.querySelector('.popup-meta').textContent = [record.visitedAt, record.address].filter(Boolean).join(' · ');
          });
          marker.on('click', () => window.ReactNativeWebView.postMessage(String(record.id)));
          points.push([record.latitude, record.longitude]);
        });
        if (points.length === 1) map.setView(points[0], 15);
        if (points.length > 1) map.fitBounds(points, { padding: [45, 45], maxZoom: 15 });
      </script>
    </body>
  </html>`;
}

export default function RestaurantMap({ records, onSelect }) {
  const mapRecords = records.filter(
    (record) => Number.isFinite(record.latitude) && Number.isFinite(record.longitude),
  );
  const html = useMemo(() => createMapHtml(mapRecords), [mapRecords]);

  if (!mapRecords.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>⌖</Text>
        <Text style={styles.emptyTitle}>표시할 위치가 없어요</Text>
        <Text style={styles.emptyCopy}>새 기록에 주소나 현재 위치를 추가해 주세요.</Text>
      </View>
    );
  }

  return (
    <WebView
      source={{ html }}
      style={styles.webView}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      onMessage={(event) => onSelect?.(Number(event.nativeEvent.data))}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  webView: { flex: 1, backgroundColor: '#F2EFE9' },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2EFE9' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F2EFE9' },
  emptyIcon: { color: colors.primary, fontSize: 42, fontWeight: '900', marginBottom: 12 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  emptyCopy: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 7 },
});
