import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../context/AppContext';
import { searchPlaces, type SearchHit } from '../lib/nominatim';

export default function SearchBar() {
  const { colors, setDestination, setFollowUser } = useApp();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const query = q.trim();
    if (query.length < 3) {
      setHits([]);
      setLoading(false);
      setErr(null);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await searchPlaces(query);
        setHits(res);
        setErr(res.length === 0 ? 'Aucun lieu trouvé' : null);
        setOpen(true);
      } catch {
        setErr('Recherche indisponible');
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 380);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  const pick = (hit: SearchHit) => {
    setDestination({
      lat: hit.lat,
      lng: hit.lng,
      name: hit.name,
      address: hit.address,
    });
    setFollowUser(false);
    setQ(hit.name);
    setHits([]);
    setOpen(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: '#000',
          },
        ]}
      >
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={q}
          onChangeText={(t) => {
            setQ(t);
            setOpen(true);
          }}
          placeholder="Rechercher une adresse, une gare…"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }]}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          onFocus={() => hits.length > 0 && setOpen(true)}
        />
        {loading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : q.length > 0 ? (
          <Pressable
            onPress={() => {
              setQ('');
              setHits([]);
              setOpen(false);
            }}
            hitSlop={10}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {open && (hits.length > 0 || err) ? (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: '#000' },
          ]}
        >
          {err && hits.length === 0 ? (
            <Text style={[styles.err, { color: colors.textMuted }]}>{err}</Text>
          ) : null}
          {hits.map((hit, i) => (
            <Pressable
              key={hit.id}
              onPress={() => pick(hit)}
              style={[
                styles.row,
                i < hits.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.iconBubble, { backgroundColor: colors.accentDim }]}>
                <Ionicons name="location" size={16} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                  {hit.name}
                </Text>
                <Text style={[styles.addr, { color: colors.textMuted }]} numberOfLines={1}>
                  {hit.address}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', zIndex: 20 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
  dropdown: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 15, fontWeight: '600' },
  addr: { fontSize: 12, marginTop: 2 },
  err: { padding: 14, fontSize: 13 },
});
