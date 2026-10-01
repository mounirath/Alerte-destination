import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../context/AppContext';
import LeafletMap from '../components/LeafletMap';
import SearchBar from '../components/SearchBar';
import ControlSheet from '../components/ControlSheet';
import AlertBanner from '../components/AlertBanner';
import { formatAccuracy } from '../lib/geo';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const {
    colors,
    userPos,
    destination,
    radius,
    tracking,
    followUser,
    setFollowUser,
    recenterToken,
    requestRecenter,
    dropPin,
    locating,
    geoError,
    demoMode,
    accuracy,
    remainingLabel,
  } = useApp();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <LeafletMap
        userPos={userPos}
        destination={destination}
        radius={radius}
        tracking={tracking}
        followUser={followUser}
        recenterToken={recenterToken}
        onMapPress={(p) => {
          dropPin(p);
          setFollowUser(false);
        }}
      />

      <View
        pointerEvents="box-none"
        style={[styles.hud, { paddingTop: Math.max(insets.top, 12) + 8 }]}
      >
        <SearchBar />

        <View style={styles.hudRow}>
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: locating
                    ? colors.warning
                    : demoMode
                      ? colors.warning
                      : colors.accent,
                },
              ]}
            />
            <Text style={[styles.badgeTxt, { color: colors.textSoft }]}>
              {locating
                ? 'Localisation…'
                : demoMode
                  ? 'Mode démo · Paris'
                  : `GPS ${formatAccuracy(accuracy)}`}
            </Text>
          </View>

          {tracking ? (
            <View style={[styles.live, { backgroundColor: colors.accent }]}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTxt}>SUIVI {remainingLabel}</Text>
            </View>
          ) : null}
        </View>

        {geoError && demoMode ? (
          <View
            style={[
              styles.warn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="information-circle" size={16} color={colors.warning} />
            <Text style={[styles.warnTxt, { color: colors.textSoft }]} numberOfLines={2}>
              {geoError} Le mode démo simule le trajet.
            </Text>
          </View>
        ) : null}
      </View>

      <View pointerEvents="box-none" style={[styles.fabs, { bottom: 330 }]}>
        <Pressable
          onPress={() => {
            setFollowUser(true);
            requestRecenter();
          }}
          style={[
            styles.fab,
            {
              backgroundColor: followUser ? colors.accent : colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="locate"
            size={22}
            color={followUser ? '#062016' : colors.text}
          />
        </Pressable>
      </View>

      <View style={styles.bottom} pointerEvents="box-none">
        <ControlSheet />
      </View>

      <AlertBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  hudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badgeTxt: { fontSize: 12, fontWeight: '600' },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 16,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#062016',
  },
  liveTxt: { color: '#062016', fontWeight: '800', fontSize: 11, letterSpacing: 0.6 },
  warn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  warnTxt: { flex: 1, fontSize: 12 },
  fabs: { position: 'absolute', right: 16, zIndex: 8 },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 12,
  },
});
