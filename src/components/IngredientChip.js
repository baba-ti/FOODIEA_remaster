import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/theme';

export default function IngredientChip({ name, uncertain = false, onRemove }) {
  return (
    <View style={[styles.chip, uncertain && styles.uncertainChip]}>
      <Text style={[styles.name, uncertain && styles.uncertainName]}>{name}</Text>
      {uncertain ? <Text style={styles.badge}>확인 필요</Text> : null}
      {onRemove ? (
        <TouchableOpacity
          accessibilityLabel={`${name} 삭제`}
          onPress={onRemove}
          style={styles.removeButton}
        >
          <Text style={styles.removeText}>×</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: '#FFD5CF',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    marginRight: 8,
    minHeight: 40,
    paddingHorizontal: 14,
  },
  uncertainChip: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F3D89B',
  },
  name: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '700',
  },
  uncertainName: {
    color: colors.warning,
  },
  badge: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 6,
  },
  removeButton: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    marginLeft: 8,
    width: 20,
  },
  removeText: {
    color: colors.textMuted,
    fontSize: 20,
    lineHeight: 22,
  },
});
