import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { bearing } from '../lib/geo';
import { useApp } from '../context/AppContext';
import type { LatLng } from '../lib/geo';
import type { Destination } from '../lib/types';

type Props = {
  userPos: LatLng | null;
  destination: Destination | null;
  radius: number;
  tracking: boolean;
  followUser: boolean;
  recenterToken: number;
  onMapPress: (p: LatLng) => void;
};

/**
 * Fallback natif : radar directionnel.
 * Sur le web, Metro charge LeafletMap.web.tsx (carte OSM Leaflet).
 */
export default function LeafletMap({ userPos, destination }: Props) {
  const { colors, remainingLabel, distance, radius } = useApp();
  const angle = useMemo(() => {
    if (!userPos || !destination) return 0;
    return bearing(userPos, destination);
  }, [userPos, destination]);

  const progress =
    distance !== null && radius > 0
      ? Math.max(0.12, Math.min(1, radius / Math.max(distance, radius)))
      : 0.18;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={[styles.radar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.ring, { borderColor: colors.border, width: 240, height: 240 }]} />
        <View style={[styles.ring, { borderColor: colors.border, width: 160, height: 160 }]} />
        <View style={[styles.ring, { borderColor: colors.border, width: 80, height: 80 }]} />
        <View style={[styles.crossH, { backgroundColor: colors.border }]} />
        <View style={[styles.crossV, { backgroundColor: colors.border }]} />
        <View
          style={[
            styles.zone,
            {
              width: 60 + progress * 160,
              height: 60 + progress * 160,
              borderRadius: 200,
              backgroundColor: colors.accentDim,
              borderColor: colors.accent,
            },
          ]}
        />
        <View style={[styles.needleWrap, { transform: [{ rotate: `${angle}deg` }] }]}>
          <View style={[styles.needle, { backgroundColor: colors.pin }]} />
        </View>
        <View style={[styles.me, { backgroundColor: colors.user, borderColor: '#fff' }]} />
        <Text style={[styles.n, { color: colors.textMuted }]}>N</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        {destination ? destination.name : 'Choisissez une destination'}
      </Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        {destination
          ? `${remainingLabel} · cap ${Math.round(angle)}°`
          : Platform.OS === 'web'
            ? 'Touchez la carte pour poser une épingle'
            : 'Ouvrez la version web pour la carte interactive OSM.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 200,
  },
  radar: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 999,
  },
  crossH: { position: 'absolute', width: 280, height: 1 },
  crossV: { position: 'absolute', width: 1, height: 280 },
  zone: { position: 'absolute', borderWidth: 2 },
  needleWrap: {
    position: 'absolute',
    width: 300,
    height: 300,
    alignItems: 'center',
  },
  needle: {
    marginTop: 18,
    width: 8,
    height: 28,
    borderRadius: 4,
  },
  me: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    zIndex: 4,
  },
  n: {
    position: 'absolute',
    top: 10,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: { marginTop: 22, fontSize: 18, fontWeight: '700', textAlign: 'center', paddingHorizontal: 24 },
  sub: { marginTop: 6, fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});
