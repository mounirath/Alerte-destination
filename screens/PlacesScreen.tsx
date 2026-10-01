import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { formatDistance, haversineDistance } from '../lib/geo';
import type { SavedPlace } from '../lib/types';

export default function PlacesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const {
    colors,
    places,
    removePlace,
    usePlace,
    userPos,
    destination,
    saveCurrentDestination,
  } = useApp();
  const [q, setQ] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const data = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle
      ? places.filter(
          (p) =>
            p.name.toLowerCase().includes(needle) ||
            (p.address || '').toLowerCase().includes(needle)
        )
      : places.slice();
    if (userPos) {
      list.sort(
        (a, b) => haversineDistance(userPos, a) - haversineDistance(userPos, b)
      );
    }
    return list;
  }, [places, q, userPos]);

  const onUse = (place: SavedPlace) => {
    usePlace(place);
    navigation.navigate('Carte');
  };

  const onDelete = (place: SavedPlace) => {
    Alert.alert('Supprimer le lieu', `Retirer « ${place.name} » des favoris ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => removePlace(place.id),
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Lieux</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          Favoris enregistrés sur cet appareil
        </Text>
      </View>

      <View
        style={[
          styles.search,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Filtrer un favori…"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }]}
          returnKeyType="search"
        />
      </View>

      {destination ? (
        <Pressable
          onPress={saveCurrentDestination}
          style={[styles.saveCurrent, { backgroundColor: colors.accentDim }]}
        >
          <Ionicons name="star" size={16} color={colors.accent} />
          <Text style={[styles.saveCurrentTxt, { color: colors.accent }]}>
            Enregistrer « {destination.name} »
          </Text>
        </Pressable>
      ) : null}

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          setTimeout(() => setRefreshing(false), 500);
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={42} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun favori</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Posez une épingle sur la carte puis touchez l'étoile pour l'enregistrer.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const dist = userPos ? formatDistance(haversineDistance(userPos, item)) : null;
          return (
            <Pressable
              onPress={() => onUse(item)}
              onLongPress={() => onDelete(item)}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: colors.accentDim }]}>
                <Ionicons name="location" size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.addr, { color: colors.textMuted }]} numberOfLines={1}>
                  {item.address || `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}`}
                </Text>
              </View>
              {dist ? (
                <Text style={[styles.dist, { color: colors.textSoft }]}>{dist}</Text>
              ) : null}
              <Pressable onPress={() => onDelete(item)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </Pressable>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 32, fontWeight: '800' },
  sub: { fontSize: 14, marginTop: 4 },
  search: {
    marginHorizontal: 20,
    marginTop: 8,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
  saveCurrent: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveCurrentTxt: { fontWeight: '700', fontSize: 13, flex: 1 },
  list: { padding: 20, paddingBottom: 40, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 16, fontWeight: '700' },
  addr: { fontSize: 12, marginTop: 2 },
  dist: { fontSize: 12, fontWeight: '700', marginRight: 6 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptySub: { fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 },
});
