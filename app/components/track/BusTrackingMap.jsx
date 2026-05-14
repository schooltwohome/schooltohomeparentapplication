/**
 * BusTrackingMap — Uber-style school bus live tracker.
 *
 * Parts implemented:
 *  1. Yellow/black top-down school bus SVG (SvgXml inside flat Marker)
 *  2. Real device GPS via expo-location (BestForNavigation, 2 m interval)
 *  3. Smooth animated marker movement via AnimatedRegion + setInterval interpolation
 *  4. Bearing calculation (great-circle formula)
 *  5. Road-snapped blue polyline via Google Directions API (fetched once on mount)
 *  6. Stop pins blue → green as bus passes within 200 m
 *  7. Uber-style camera follow + re-centre FAB (auto-resumes 6 s after user pans)
 *  8. Bottom info card showing route, next stop, speed, and stops passed
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, {
  AnimatedRegion,
  MarkerAnimated,
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import { SvgXml } from 'react-native-svg';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

// ─── Constants ────────────────────────────────────────────────────────────────

// FIX b12: single source of truth — derive INITIAL coords from WAYPOINTS[0].
const WAYPOINTS = [
  { name: 'Palayam Junction',    latitude: 8.5012, longitude: 76.9543 },
  { name: 'Sreekaryam Junction', latitude: 8.5241, longitude: 76.8897 },
  { name: 'Technopark Gate',     latitude: 8.5577, longitude: 76.8762 },
];

const INITIAL_LAT = WAYPOINTS[0].latitude;
const INITIAL_LNG = WAYPOINTS[0].longitude;

const GOOGLE_API_KEY =
  Constants.expoConfig?.extra?.googleMapsApiKey ||
  'AIzaSyAnjJcugrzeD5rNrj5WFwLAV6wUTrF_Ag4';

// ─── Part 1 — Bus SVG (top-down, front faces UP = north = 0°) ────────────────
// Yellow body · black front hood · blue windows · red brake lights · dark wheels

const BUS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 100" width="56" height="100">
  <ellipse cx="29" cy="95" rx="18" ry="4" fill="rgba(0,0,0,0.18)"/>
  <rect x="6" y="6" width="44" height="82" rx="8" fill="#FFD600"/>
  <rect x="6" y="6" width="44" height="20" rx="8" fill="#1C1C1E"/>
  <rect x="6" y="18" width="44" height="8" fill="#1C1C1E"/>
  <rect x="13" y="8" width="30" height="14" rx="4" fill="#93C5FD" opacity="0.9"/>
  <rect x="7" y="8" width="8" height="5" rx="2" fill="#FEF9C3"/>
  <rect x="41" y="8" width="8" height="5" rx="2" fill="#FEF9C3"/>
  <rect x="2"  y="30" width="8" height="10" rx="2" fill="#93C5FD" opacity="0.85"/>
  <rect x="2"  y="46" width="8" height="10" rx="2" fill="#93C5FD" opacity="0.85"/>
  <rect x="2"  y="62" width="8" height="10" rx="2" fill="#93C5FD" opacity="0.85"/>
  <rect x="46" y="30" width="8" height="10" rx="2" fill="#93C5FD" opacity="0.85"/>
  <rect x="46" y="46" width="8" height="10" rx="2" fill="#93C5FD" opacity="0.85"/>
  <rect x="46" y="62" width="8" height="10" rx="2" fill="#93C5FD" opacity="0.85"/>
  <rect x="2"  y="44" width="8" height="16" rx="2" fill="#E8B800"/>
  <rect x="8"  y="80" width="13" height="7" rx="3" fill="#EF4444"/>
  <rect x="35" y="80" width="13" height="7" rx="3" fill="#EF4444"/>
  <rect x="6"  y="86" width="44" height="2" rx="1" fill="#1C1C1E" opacity="0.4"/>
  <rect x="0"  y="22" width="9" height="13" rx="3" fill="#374151"/>
  <rect x="47" y="22" width="9" height="13" rx="3" fill="#374151"/>
  <rect x="0"  y="66" width="9" height="13" rx="3" fill="#374151"/>
  <rect x="47" y="66" width="9" height="13" rx="3" fill="#374151"/>
  <line x1="6" y1="28" x2="50" y2="28" stroke="#1C1C1E" stroke-width="1.5" opacity="0.25"/>
  <line x1="6" y1="78" x2="50" y2="78" stroke="#1C1C1E" stroke-width="1.5" opacity="0.25"/>
</svg>`;

// ─── Pure utility functions ───────────────────────────────────────────────────

/** Great-circle bearing in degrees [0, 360). */
function getBearing(start, end) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLon = toRad(end.longitude - start.longitude);
  const lat1 = toRad(start.latitude);
  const lat2 = toRad(end.latitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Haversine distance in metres.
 * FIX b8: clamp `a` to [0, 1] to prevent Math.sqrt domain error from
 *          floating-point rounding when from ≈ to.
 */
function haversineMeters(from, to) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6_371_000;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(to.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}

/** Google encoded-polyline decoder — no npm package needed. */
function decodePolyline(encoded) {
  let index = 0, lat = 0, lng = 0;
  const coords = [];
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 32);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 32);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BusTrackingMap({
  busLocation = null,
  useDeviceAsBusFallback = false,
} = {}) {
  const mapRef = useRef(null);

  // Follow-mode: camera centres on bus until user manually pans.
  const isFollowing = useRef(true);
  // Guards against onRegionChangeComplete firing from our own animateCamera calls.
  const isProgrammaticMoveRef = useRef(false);
  // FIX b3: track this timer so it can be cleared on unmount.
  const progMoveTimerRef = useRef(null);
  const followTimerRef = useRef(null);

  // FIX b5: replace Animated.Value pair + private __getValue() with a plain ref
  //         that tracks the current display coordinate used for re-centre.
  const currentCoordRef = useRef({ latitude: INITIAL_LAT, longitude: INITIAL_LNG });

  // AnimatedRegion drives the MarkerAnimated coordinate at the native layer.
  const animCoord = useRef(
    new AnimatedRegion({
      latitude: INITIAL_LAT,
      longitude: INITIAL_LNG,
      latitudeDelta: 0.0001,
      longitudeDelta: 0.0001,
    })
  ).current;

  const interpTimerRef = useRef(null);
  // FIX b4: prevCoordRef now always stores the LAST ANIMATED position (not the raw
  //         GPS fix), so each new interpolation segment starts where the marker
  //         visually is — preventing jumps when GPS ticks arrive quickly.
  const prevCoordRef = useRef({ latitude: INITIAL_LAT, longitude: INITIAL_LNG });

  // bearingRef holds the current value for stable reads in camera calls.
  const bearingRef = useRef(0);
  const [bearing, setBearing] = useState(0);

  // ── Part 5 — Route ──────────────────────────────────────────────────────────
  const [routeCoords, setRouteCoords] = useState([]);

  // ── Part 6 — Stop state ─────────────────────────────────────────────────────
  // passedStopsRef avoids stale-closure issues inside the GPS watcher callback.
  const passedStopsRef = useRef([]);
  const [passedStops, setPassedStops] = useState([]);

  // ── Part 8 — Info card ──────────────────────────────────────────────────────
  const [speed, setSpeed] = useState(0);

  // Next stop = first waypoint whose index is not yet passed.
  const nextStopIndex = WAYPOINTS.findIndex((_, i) => !passedStops.includes(i));

  const hasExternalBusLocation =
    busLocation &&
    Number.isFinite(busLocation.latitude) &&
    Number.isFinite(busLocation.longitude);

  // ── Part 2 — GPS watcher (optional fallback; GPS fires every 2 m or 1 s) ───
  // FIX b1: cancelled flag prevents a memory leak when the component unmounts
  //         before watchPositionAsync resolves (the async continuation would
  //         otherwise assign a watcher that the cleanup already ran past).
  useEffect(() => {
    if (!useDeviceAsBusFallback || hasExternalBusLocation) return;
    let cancelled = false;
    let watcher = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Enable location to track the bus.');
        return;
      }
      watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2,
        },
        (loc) => handleLocationUpdate(loc.coords)
      );
      if (cancelled) watcher.remove();
    })();

    return () => {
      cancelled = true;
      watcher?.remove();
    };
  }, [hasExternalBusLocation, useDeviceAsBusFallback]); // eslint-disable-line react-hooks/exhaustive-deps

  // Consume server/driver GPS updates when passed from parent tracking flow.
  useEffect(() => {
    if (!hasExternalBusLocation) return;
    handleLocationUpdate({
      latitude: busLocation.latitude,
      longitude: busLocation.longitude,
      speed:
        Number.isFinite(busLocation.speedKmh) && busLocation.speedKmh >= 0
          ? busLocation.speedKmh / 3.6
          : 0,
      heading:
        Number.isFinite(busLocation.heading) ? busLocation.heading : null,
    });
  }, [
    hasExternalBusLocation,
    busLocation?.latitude,
    busLocation?.longitude,
    busLocation?.speedKmh,
    busLocation?.heading,
  ]);

  // ── Part 5 — Fetch road-snapped route once on mount ─────────────────────────
  // FIX b2: AbortController cancels the in-flight fetch on unmount to prevent
  //         calling setRouteCoords on an unmounted component.
  useEffect(() => {
    const controller = new AbortController();
    fetchRoute(controller.signal);
    return () => controller.abort();
  }, []);

  // Cleanup timers on unmount.
  useEffect(() => {
    return () => {
      if (interpTimerRef.current) clearInterval(interpTimerRef.current);
      if (followTimerRef.current) clearTimeout(followTimerRef.current);
      // FIX b3: clear the programmatic-move guard timer too.
      if (progMoveTimerRef.current) clearTimeout(progMoveTimerRef.current);
    };
  }, []);

  // ── Part 3 — Smooth animated marker movement ─────────────────────────────────
  function handleLocationUpdate(coords) {
    // FIX b4: start the interpolation from where the marker currently IS
    //         (last animated position), not from the last raw GPS fix.
    const start = { ...prevCoordRef.current };

    // FIX b9: only update bearing when the bus has actually moved (>1 m).
    //         At near-zero displacement atan2(0,0)=0 which snaps north.
    const distMoved = haversineMeters(start, coords);
    if (distMoved > 1) {
      const newBearing = getBearing(start, coords);
      bearingRef.current = newBearing;
      setBearing(newBearing);
    }

    // FIX b10: GPS speed is -1 on Android when unavailable; clamp to 0.
    setSpeed(Math.max(0, Math.round((coords.speed ?? 0) * 3.6)));

    if (interpTimerRef.current) clearInterval(interpTimerRef.current);

    let step = 0;
    const STEPS = 9;
    interpTimerRef.current = setInterval(() => {
      step++;
      const f = step / STEPS;
      const iLat = start.latitude + (coords.latitude - start.latitude) * f;
      const iLng = start.longitude + (coords.longitude - start.longitude) * f;

      // FIX b5: keep currentCoordRef in sync so handleRecentre can read it
      //         without touching private Animated internals.
      currentCoordRef.current = { latitude: iLat, longitude: iLng };

      // FIX b4: advance prevCoordRef each frame so the next GPS update's
      //         interpolation starts from the correct animated position.
      prevCoordRef.current = { latitude: iLat, longitude: iLng };

      // AnimatedRegion drives the MarkerAnimated at the native thread.
      animCoord.setValue({
        latitude: iLat,
        longitude: iLng,
        latitudeDelta: 0.0001,
        longitudeDelta: 0.0001,
      });

      if (step >= STEPS) {
        clearInterval(interpTimerRef.current);
        interpTimerRef.current = null;
      }
    }, 100);

    // ── Part 7 — Camera follows bus ──────────────────────────────────────────
    if (isFollowing.current) {
      isProgrammaticMoveRef.current = true;
      mapRef.current?.animateCamera(
        {
          center: { latitude: coords.latitude, longitude: coords.longitude },
          heading: bearingRef.current,
          pitch: 0,
          zoom: 16,
        },
        { duration: 900 }
      );
    }

    // ── Part 6 — Check stop passes ───────────────────────────────────────────
    checkStopsPassed(coords);
  }

  function checkStopsPassed(busCoords) {
    let changed = false;
    WAYPOINTS.forEach((stop, index) => {
      if (passedStopsRef.current.includes(index)) return;
      const dist = haversineMeters(
        { latitude: busCoords.latitude, longitude: busCoords.longitude },
        { latitude: stop.latitude, longitude: stop.longitude }
      );
      if (dist < 200) {
        passedStopsRef.current = [...passedStopsRef.current, index];
        changed = true;
      }
    });
    if (changed) setPassedStops([...passedStopsRef.current]);
  }

  // ── Part 5 — Google Directions API fetch (once, cached in state) ─────────
  // FIX b2: accepts AbortSignal; guards setRouteCoords against AbortError and
  //         checks both HTTP status and Directions API status field.
  async function fetchRoute(signal) {
    const origin = `${INITIAL_LAT},${INITIAL_LNG}`;
    const destination = `${WAYPOINTS[WAYPOINTS.length - 1].latitude},${WAYPOINTS[WAYPOINTS.length - 1].longitude}`;
    const interiorWaypoints = WAYPOINTS.slice(1, -1);
    const waypointsStr = interiorWaypoints
      .map((w) => `${w.latitude},${w.longitude}`)
      .join('|');

    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${origin}` +
      `&destination=${destination}` +
      (waypointsStr ? `&waypoints=${waypointsStr}` : '') +
      `&mode=driving` +
      `&key=${GOOGLE_API_KEY}`;

    try {
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status !== 'OK') throw new Error(`Directions API: ${data.status}`);
      const points = data.routes?.[0]?.overview_polyline?.points;
      if (points) setRouteCoords(decodePolyline(points));
    } catch (e) {
      if (e.name !== 'AbortError') console.error('Route fetch failed', e);
    }
  }

  // ── Part 7 — Re-centre FAB handler ──────────────────────────────────────────
  function handleRecentre() {
    if (followTimerRef.current) clearTimeout(followTimerRef.current);
    followTimerRef.current = null;
    isFollowing.current = true;
    isProgrammaticMoveRef.current = true;
    // FIX b5: use currentCoordRef instead of private animLat.__getValue().
    // FIX b7: add pitch:0 so map always resets tilt on re-centre.
    mapRef.current?.animateCamera(
      {
        center: {
          latitude: currentCoordRef.current.latitude,
          longitude: currentCoordRef.current.longitude,
        },
        heading: bearingRef.current,
        pitch: 0,
        zoom: 16,
      },
      { duration: 800 }
    );
  }

  function handleRegionChangeComplete() {
    if (isProgrammaticMoveRef.current) {
      // FIX b3: use a tracked ref for this timer so it's cleared on unmount,
      //         and lengthen the delay beyond the longest animateCamera duration
      //         (900 ms) to avoid prematurely re-enabling user-pan detection.
      if (progMoveTimerRef.current) clearTimeout(progMoveTimerRef.current);
      progMoveTimerRef.current = setTimeout(() => {
        progMoveTimerRef.current = null;
        isProgrammaticMoveRef.current = false;
      }, 1100);
      return;
    }
    // User manually panned — pause camera follow, then auto-resume after 6 s.
    isFollowing.current = false;
    if (followTimerRef.current) clearTimeout(followTimerRef.current);
    followTimerRef.current = setTimeout(() => {
      followTimerRef.current = null;
      isFollowing.current = true;
      // FIX b6: immediately animate to current bus position on resume so the
      //         map doesn't wait for the next GPS tick before re-following.
      isProgrammaticMoveRef.current = true;
      mapRef.current?.animateCamera(
        {
          center: {
            latitude: currentCoordRef.current.latitude,
            longitude: currentCoordRef.current.longitude,
          },
          heading: bearingRef.current,
          pitch: 0,
          zoom: 16,
        },
        { duration: 800 }
      );
    }, 6000);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {!hasExternalBusLocation && !useDeviceAsBusFallback ? (
        <View style={styles.waitingBanner}>
          <Text style={styles.waitingBannerText}>Waiting for live bus GPS...</Text>
        </View>
      ) : null}
      {/* ── MapView ── */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: INITIAL_LAT,
          longitude: INITIAL_LNG,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
      >
        {/* ── Part 5 — Road-snapped blue polyline ── */}
        {routeCoords.length >= 2 ? (
          <>
            {/* Casing — dark border makes the line pop */}
            <Polyline
              coordinates={routeCoords}
              strokeColor="#1E40AF"
              strokeWidth={7}
              lineCap="round"
              lineJoin="round"
            />
            {/* Main line — Uber-style bright blue */}
            <Polyline
              coordinates={routeCoords}
              strokeColor="#3B82F6"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          </>
        ) : (
          /* Fallback dashed line between stops while Directions API loads */
          <Polyline
            coordinates={WAYPOINTS.map((w) => ({
              latitude: w.latitude,
              longitude: w.longitude,
            }))}
            strokeColor="#93C5FD"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
            lineDashPattern={[10, 6]}
          />
        )}

        {/* ── Part 6 — Stop pins (blue → green on pass) ── */}
        {WAYPOINTS.map((stop, i) => {
          const passed = passedStops.includes(i);
          const isNext = i === nextStopIndex;
          return (
            <Marker
              key={`stop-${i}`}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              // FIX b11: allow native view updates when the stop's appearance
              //          changes (passed / next). Without this, custom marker
              //          children don't re-render after the first layout on many
              //          react-native-maps versions.
              tracksViewChanges={passed || isNext}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={styles.stopWrap}>
                <View
                  style={[
                    styles.stopDot,
                    passed
                      ? styles.stopDotPassed
                      : isNext
                      ? styles.stopDotNext
                      : styles.stopDotUpcoming,
                  ]}
                />
                <View
                  style={[
                    styles.stopLabelPill,
                    passed && styles.stopLabelPillPassed,
                    isNext && styles.stopLabelPillNext,
                  ]}
                >
                  <Text style={styles.stopLabelText} numberOfLines={1}>
                    {passed ? `✓ ${stop.name}` : stop.name}
                  </Text>
                </View>
              </View>
            </Marker>
          );
        })}

        {/* ── Part 1 + 3 — Animated flat bus marker ── */}
        <MarkerAnimated
          coordinate={animCoord}
          flat
          anchor={{ x: 0.5, y: 0.5 }}
          rotation={bearing}
          tracksViewChanges={false}
        >
          <SvgXml xml={BUS_SVG} width={56} height={100} />
        </MarkerAnimated>
      </MapView>

      {/* ── Part 7 — Re-centre FAB ── */}
      <Pressable
        onPress={handleRecentre}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        accessibilityLabel="Re-centre map on bus"
        accessibilityRole="button"
      >
        <Text style={styles.fabIcon}>⊙</Text>
      </Pressable>

      {/* ── Part 8 — Bottom info card ── */}
      <View style={styles.infoCard}>
        <View style={styles.infoCardHandle} />
        <Text style={styles.infoRoute} numberOfLines={1}>
          Trivandrum Central → Kazhakkoottam
        </Text>
        <Text style={styles.infoNextStopRow}>
          Next stop:{' '}
          <Text style={styles.infoNextStopName}>
            {nextStopIndex === -1
              ? 'Arrived'
              : WAYPOINTS[nextStopIndex]?.name ?? 'Arrived'}
          </Text>
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Speed</Text>
            <Text style={styles.statValue}>{speed} km/h</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Stops passed</Text>
            <Text style={styles.statValue}>
              {passedStops.length}
              <Text style={styles.statValueDim}> / {WAYPOINTS.length}</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  waitingBanner: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 20,
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  waitingBannerText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
  },
  map: {
    width: '100%',
    height: '100%',
  },

  // Stop markers
  stopWrap: {
    alignItems: 'center',
  },
  stopDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  stopDotPassed: {
    backgroundColor: '#22C55E',
  },
  stopDotNext: {
    backgroundColor: '#2563EB',
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  stopDotUpcoming: {
    backgroundColor: '#94A3B8',
  },
  stopLabelPill: {
    marginTop: 3,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: 102,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stopLabelPillPassed: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  stopLabelPillNext: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  stopLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E293B',
  },

  // Re-centre FAB
  fab: {
    position: 'absolute',
    bottom: 196,
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 8,
  },
  fabPressed: {
    backgroundColor: '#F1F5F9',
  },
  fabIcon: {
    fontSize: 22,
    lineHeight: 26,
    color: '#0F172A',
  },

  // Bottom info card
  infoCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 14,
  },
  infoCardHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  infoRoute: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  infoNextStopRow: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  infoNextStopName: {
    fontWeight: '700',
    color: '#2563EB',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  statValueDim: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
});
