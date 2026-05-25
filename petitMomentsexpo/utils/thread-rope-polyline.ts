import type { LatLng } from '@/utils/moments-map-region';

/** Punten per stuk draad tussen twee punaises. */
const STEPS_PER_SPAN = 12;

/** Doorhang t.o.v. afstand — langere stukken zakken meer door. */
const SAG_RATIO = 0.18;

/** Max doorhang in graden (~220 m). */
const MAX_SAG_DEGREES = 0.0025;

/** Onder deze afstand blijft de draad strak (korte stukken op het prikbord). */
const MIN_SPAN_FOR_FULL_SAG = 0.00035;

/** Zeer lichte handmatige onregelmatigheid, deterministisch per segment. */
const FIBER_WOBBLE_RATIO = 0.012;

export type RopePolylineOptions = {
  stepsPerSpan?: number;
  sagRatio?: number;
};

function spanLength(a: LatLng, b: LatLng): number {
  const dLat = b.latitude - a.latitude;
  const dLng = b.longitude - a.longitude;
  return Math.hypot(dLat, dLng);
}

/**
 * Zwaartekracht wijst naar het zuiden op de kaart.
 * Projecteer die op de richting loodrecht op het draadstuk — zo hangt elke span
 * natuurlijk door, zoals garen op een prikbord.
 */
function gravityPerpendicular(a: LatLng, b: LatLng, span: number): { lat: number; lng: number } {
  const dLat = b.latitude - a.latitude;
  const dLng = b.longitude - a.longitude;
  const span2 = span * span || 1;

  const gLat = -1;
  const gLng = 0;
  const gDotD = gLat * dLat + gLng * dLng;

  const perpLat = gLat - (gDotD * dLat) / span2;
  const perpLng = gLng - (gDotD * dLng) / span2;
  const len = Math.hypot(perpLat, perpLng) || 1;

  return { lat: perpLat / len, lng: perpLng / len };
}

/** Parabolische catenary-benadering: 0 aan de uiteinden, max in het midden. */
function sagAmountAt(t: number, span: number, sagRatio: number): number {
  const depth = Math.min(span * sagRatio, MAX_SAG_DEGREES);
  const tautFactor = Math.min(1, span / MIN_SPAN_FOR_FULL_SAG);
  return depth * tautFactor * 4 * t * (1 - t);
}

function pushIfDifferent(out: LatLng[], point: LatLng) {
  const last = out[out.length - 1];
  if (
    !last ||
    last.latitude !== point.latitude ||
    last.longitude !== point.longitude
  ) {
    out.push(point);
  }
}

/**
 * Bouwt een doorhangende rode-draad-polyline tussen waypoints (punaises).
 * Eén berekening via useMemo — geen physics engine.
 */
export function buildRopePolylineCoordinates(
  waypoints: LatLng[],
  options: RopePolylineOptions = {},
): LatLng[] {
  if (waypoints.length < 2) {
    return waypoints.length ? [waypoints[0]] : [];
  }

  const stepsPerSpan = options.stepsPerSpan ?? STEPS_PER_SPAN;
  const sagRatio = options.sagRatio ?? SAG_RATIO;
  const out: LatLng[] = [];

  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    const dLat = end.latitude - start.latitude;
    const dLng = end.longitude - start.longitude;
    const span = spanLength(start, end) || 1;
    const gravity = gravityPerpendicular(start, end, span);

    const startStep = i === 0 ? 0 : 1;
    for (let step = startStep; step <= stepsPerSpan; step += 1) {
      const t = step / stepsPerSpan;
      const sag = sagAmountAt(t, span, sagRatio);

      const wobble =
        Math.sin(t * Math.PI * 2.4 + i * 2.1) * span * FIBER_WOBBLE_RATIO;

      const point: LatLng = {
        latitude:
          start.latitude +
          dLat * t +
          gravity.lat * sag +
          (dLat / span) * wobble * 0.15,
        longitude:
          start.longitude +
          dLng * t +
          gravity.lng * sag +
          (dLng / span) * wobble * 0.15,
      };

      pushIfDifferent(out, point);
    }
  }

  return out;
}
