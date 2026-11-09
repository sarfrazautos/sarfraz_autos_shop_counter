import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  GeoJSONSource,
  LineLayerSpecification,
  MapLayerMouseEvent,
  Map as MapLibreMap,
  MapMouseEvent,
  MapOptions,
  ProjectionSpecification,
  MapGeoJSONFeature as RenderedFeature,
  StyleSpecification,
} from "maplibre-gl";

type MapLibre = typeof import("maplibre-gl");

// =============================================================================
// Types
// =============================================================================

/** The MapLibre map: everything MapLibre can do, for what the parts don't. */
export type MapInstance = MapLibreMap;

/** A `[longitude, latitude]` pair. */
export type MapCoordinate = [number, number];

export interface MapLngLat {
  latitude: number;
  longitude: number;
}

/** Where the camera is. */
export interface MapViewport {
  /** Rotation, in degrees clockwise from north. */
  bearing: number;
  /** The center, as `[longitude, latitude]`. */
  center: MapCoordinate;
  /** Tilt, in degrees from looking straight down. */
  pitch: number;
  zoom: number;
}

export type MapTheme = "dark" | "light";

/** A MapLibre style: its URL or the style itself. */
export type MapStyle = string | StyleSpecification;

/** The basemap for each theme. */
export interface MapStyles {
  dark?: MapStyle;
  light?: MapStyle;
}

/** `mercator` (flat) or `globe`, or a MapLibre projection. */
export type MapProjection = "globe" | "mercator" | ProjectionSpecification;

/** `loading` until the first style has drawn, `error` without WebGL2. */
export type MapStatus = "error" | "loading" | "ready";

/** MapLibre's own options the parts don't set themselves. */
export type MapEngineOptions = Omit<
  MapOptions,
  "bearing" | "center" | "container" | "pitch" | "style" | "zoom"
>;

/** Which point of an element sits on its coordinate. */
export type MapAnchor =
  | "bottom"
  | "bottom-left"
  | "bottom-right"
  | "center"
  | "left"
  | "right"
  | "top"
  | "top-left"
  | "top-right";

export type MapSide = "bottom" | "left" | "right" | "top";

export type MapFillPaint = NonNullable<FillLayerSpecification["paint"]>;
export type MapLinePaint = NonNullable<LineLayerSpecification["paint"]>;
export type MapLineLayout = NonNullable<LineLayerSpecification["layout"]>;
export type MapCirclePaint = NonNullable<CircleLayerSpecification["paint"]>;

/** A GeoJSON position: `[longitude, latitude]`, and an altitude if any. */
export type MapGeoJSONPosition = number[];

export interface MapGeoJSONPoint {
  coordinates: MapGeoJSONPosition;
  type: "Point";
}

export interface MapGeoJSONLineString {
  coordinates: MapGeoJSONPosition[];
  type: "LineString";
}

/** A GeoJSON geometry (RFC 7946), any standard GeoJSON fits. */
export type MapGeoJSONGeometry =
  | MapGeoJSONPoint
  | MapGeoJSONLineString
  | { coordinates: MapGeoJSONPosition[]; type: "MultiPoint" }
  | { coordinates: MapGeoJSONPosition[][]; type: "MultiLineString" }
  | { coordinates: MapGeoJSONPosition[][]; type: "Polygon" }
  | { coordinates: MapGeoJSONPosition[][][]; type: "MultiPolygon" }
  | { geometries: MapGeoJSONGeometry[]; type: "GeometryCollection" };

export interface MapGeoJSONFeature<
  G extends MapGeoJSONGeometry | null = MapGeoJSONGeometry,
> {
  geometry: G;
  id?: number | string;
  properties: Record<string, unknown> | null;
  type: "Feature";
}

export interface MapGeoJSONFeatureCollection<
  G extends MapGeoJSONGeometry | null = MapGeoJSONGeometry,
> {
  features: MapGeoJSONFeature<G>[];
  type: "FeatureCollection";
}

/** GeoJSON to draw, or the URL of a file of it. */
export type MapGeoJSONData =
  | MapGeoJSONFeature
  | MapGeoJSONFeatureCollection
  | MapGeoJSONGeometry
  | string;

/** A drawn feature, its `properties` as given. */
export type MapFeature = RenderedFeature;

/** What a pointer did on a feature. */
export interface MapFeatureEvent {
  feature: MapFeature;
  latitude: number;
  longitude: number;
  /** MapLibre's event, for anything else. */
  originalEvent: MapMouseEvent;
}

/** One arc: from where to where, and any fields its paint reads. */
export interface MapArcDatum {
  from: MapCoordinate;
  /** Unique: hover state and events find the arc by it. */
  id: number | string;
  to: MapCoordinate;
  [field: string]: unknown;
}

export interface MapArcEvent {
  arc: MapArcDatum;
  latitude: number;
  longitude: number;
  originalEvent: MapMouseEvent;
}

/** A place on a route: an end, the progress point, or a fraction from 0 to 1. */
export type MapRouteAnchor = "end" | "progress" | "start" | number;

// =============================================================================
// Constants
// =============================================================================

const STYLES = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
} satisfies Record<MapTheme, string>;

/** CARTO's fonts, so a blank map can still write cluster counts. */
const GLYPHS =
  "https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf";
const LABEL_FONT = ["Montserrat SemiBold", "Open Sans Bold"];
const BOLD_FONT = /bold/i;
const ITALIC_FONT = /italic/i;

/**
 * A font the basemap's glyphs have, for text the parts write (cluster
 * counts): its labels' bold upright one, else an upright one. CARTO's
 * Montserrat SemiBold when the style names none (the blank basemap); a
 * style from elsewhere (OpenFreeMap's Noto Sans) has no Montserrat.
 */
const labelFontOf = (map: MapLibreMap): string[] => {
  const fonts: string[][] = [];
  for (const layer of map.getStyle()?.layers ?? []) {
    const font =
      layer.type === "symbol" ? layer.layout?.["text-font"] : undefined;
    if (
      Array.isArray(font) &&
      typeof font[0] === "string" &&
      !ITALIC_FONT.test(font[0]) &&
      font.every((name) => typeof name === "string")
    ) {
      fonts.push(font as string[]);
    }
  }
  return (
    fonts.find((font) => BOLD_FONT.test(font[0] ?? "")) ??
    fonts[0] ??
    LABEL_FONT
  );
};

/** No tiles and a clear ground: the map's box shows through. */
const BLANK_STYLE: StyleSpecification = {
  glyphs: GLYPHS,
  layers: [
    {
      id: "background",
      paint: { "background-color": "rgba(0, 0, 0, 0)" },
      type: "background",
    },
  ],
  sources: {},
  version: 8,
};

/** How far each anchor shifts its element, as a share of its own size. */
const ANCHOR_SHIFT: Record<MapAnchor, [number, number]> = {
  bottom: [-50, -100],
  "bottom-left": [0, -100],
  "bottom-right": [-100, -100],
  center: [-50, -50],
  left: [0, -50],
  right: [-100, -50],
  top: [-50, 0],
  "top-left": [0, 0],
  "top-right": [-100, 0],
};

const OPPOSITE: Record<MapSide, MapSide> = {
  bottom: "top",
  left: "right",
  right: "left",
  top: "bottom",
};

/** How close a popup comes to the box's edge, in pixels. */
const EDGE = 8;
/** How far a press travels before it drags a marker, in pixels. */
const DRAG_THRESHOLD = 3;
/** An element this far outside the box isn't drawn, in pixels. */
const CULL = 160;
/** A camera step from the controls (ms); none where motion is reduced. */
const STEP_MS = 300;
/**
 * A color MapLibre can't read: a theme variable anywhere in it (`rgb(from
 * var(--primary) …)` too), a CSS Color 4 function, `light-dark()`, or
 * `currentColor`.
 */
const COLOR_FUNCTION =
  /var\(|^(?:oklch|oklab|lab|lch|hwb|color|color-mix|light-dark)\(|^currentcolor$/i;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const DARK_SCHEME = "(prefers-color-scheme: dark)";

/** The "i" of the credits button, drawn as a mask in the text's color. */
const INFO_ICON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill-rule='evenodd'%3E%3Cpath d='M4 10a6 6 0 1 0 12 0 6 6 0 1 0-12 0m5-3a1 1 0 1 0 2 0 1 1 0 1 0-2 0m0 3a1 1 0 1 1 2 0v3a1 1 0 1 1-2 0'/%3E%3C/svg%3E\")";

/**
 * What MapLibre's canvas, gestures and credits need from its stylesheet, in
 * the theme's tokens: the rest of it styles MapLibre's own markers, popups
 * and controls, which the Map parts replace.
 */
const STYLESHEET = `
.maplibregl-map{overflow:hidden;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}
.maplibregl-canvas{position:absolute;top:0;left:0}
.maplibregl-canvas:focus-visible{outline:none}
.maplibregl-canvas-container.maplibregl-interactive{cursor:grab;user-select:none}
.maplibregl-canvas-container.maplibregl-interactive:active{cursor:grabbing}
.maplibregl-canvas-container.maplibregl-interactive.maplibregl-track-pointer{cursor:pointer}
.maplibregl-crosshair,.maplibregl-crosshair .maplibregl-interactive,.maplibregl-crosshair .maplibregl-interactive:active{cursor:crosshair}
.maplibregl-canvas-container.maplibregl-touch-zoom-rotate,.maplibregl-canvas-container.maplibregl-touch-zoom-rotate .maplibregl-canvas{touch-action:pan-x pan-y}
.maplibregl-canvas-container.maplibregl-touch-drag-pan,.maplibregl-canvas-container.maplibregl-touch-drag-pan .maplibregl-canvas{touch-action:pinch-zoom}
.maplibregl-canvas-container.maplibregl-touch-zoom-rotate.maplibregl-touch-drag-pan,.maplibregl-canvas-container.maplibregl-touch-zoom-rotate.maplibregl-touch-drag-pan .maplibregl-canvas{touch-action:none}
.maplibregl-canvas-container.maplibregl-touch-drag-pan.maplibregl-cooperative-gestures,.maplibregl-canvas-container.maplibregl-touch-drag-pan.maplibregl-cooperative-gestures .maplibregl-canvas{touch-action:pan-x pan-y}
.maplibregl-ctrl-top-left,.maplibregl-ctrl-top-right,.maplibregl-ctrl-bottom-left,.maplibregl-ctrl-bottom-right{position:absolute;z-index:35;pointer-events:none}
.maplibregl-ctrl-top-left{top:var(--map-credits-top,0);left:0}
.maplibregl-ctrl-top-right{top:var(--map-credits-top,0);right:0}
.maplibregl-ctrl-bottom-left{bottom:var(--map-credits-bottom,0);left:0}
.maplibregl-ctrl-bottom-right{right:0;bottom:var(--map-credits-bottom,0)}
.maplibregl-ctrl{clear:both;pointer-events:auto;transform:translate(0)}
.maplibregl-ctrl-top-left .maplibregl-ctrl,.maplibregl-ctrl-bottom-left .maplibregl-ctrl{float:left}
.maplibregl-ctrl-top-right .maplibregl-ctrl,.maplibregl-ctrl-bottom-right .maplibregl-ctrl{float:right}
.maplibregl-ctrl-attrib{margin:8px;font-size:10px;line-height:16px;color:var(--muted-foreground)}
.maplibregl-ctrl-attrib.maplibregl-compact{position:relative;box-sizing:content-box;min-width:16px;min-height:16px;padding:2px;border-radius:999px;background:var(--background);box-shadow:0 0 0 1px color-mix(in oklab,var(--foreground) 10%,transparent);backdrop-filter:blur(4px)}
.maplibregl-ctrl-attrib.maplibregl-compact-show{padding:2px 22px 2px 8px}
.maplibregl-ctrl-bottom-left>.maplibregl-ctrl-attrib.maplibregl-compact-show,.maplibregl-ctrl-top-left>.maplibregl-ctrl-attrib.maplibregl-compact-show{padding:2px 8px 2px 22px}
.maplibregl-ctrl-attrib.maplibregl-compact .maplibregl-ctrl-attrib-inner{display:none}
.maplibregl-ctrl-attrib-inner{unicode-bidi:plaintext}
.maplibregl-ctrl-attrib.maplibregl-compact-show .maplibregl-ctrl-attrib-inner{display:block}
.maplibregl-ctrl-attrib-button{position:absolute;top:0;right:0;display:none;box-sizing:border-box;width:20px;height:20px;border:0;border-radius:999px;background:transparent;color:inherit;cursor:pointer;list-style:none;appearance:none;outline:none}
.maplibregl-ctrl-attrib-button::-webkit-details-marker{display:none}
.maplibregl-ctrl-attrib-button::after{content:"";position:absolute;inset:2px;background:currentColor;-webkit-mask:${INFO_ICON} center/contain no-repeat;mask:${INFO_ICON} center/contain no-repeat}
.maplibregl-ctrl-attrib-button:hover{color:var(--foreground)}
.maplibregl-ctrl-attrib-button:focus-visible{box-shadow:0 0 0 3px color-mix(in oklab,var(--ring) 50%,transparent)}
.maplibregl-ctrl-bottom-left .maplibregl-ctrl-attrib-button,.maplibregl-ctrl-top-left .maplibregl-ctrl-attrib-button{right:auto;left:0}
.maplibregl-ctrl-attrib.maplibregl-compact .maplibregl-ctrl-attrib-button{display:block}
.maplibregl-ctrl-attrib a{color:inherit;text-decoration:none}
.maplibregl-ctrl-attrib a:hover{color:var(--foreground);text-decoration:underline}
.maplibregl-attrib-empty{display:none}
.maplibregl-boxzoom{position:absolute;top:0;left:0;width:0;height:0;border:1px solid var(--primary);background:color-mix(in oklab,var(--primary) 15%,transparent)}
.maplibregl-cooperative-gesture-screen{position:absolute;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem;background:color-mix(in oklab,var(--background) 75%,transparent);color:var(--foreground);font-size:.875rem;line-height:1.25rem;text-align:center;opacity:0;pointer-events:none;transition:opacity 1s ease 1s}
.maplibregl-cooperative-gesture-screen.maplibregl-show{opacity:1;transition:opacity 50ms}
.maplibregl-cooperative-gesture-screen .maplibregl-mobile-message{display:none}
@media (hover:none),(width<=480px){.maplibregl-cooperative-gesture-screen .maplibregl-desktop-message{display:none}.maplibregl-cooperative-gesture-screen .maplibregl-mobile-message{display:block}}
`;

/** The stylesheet, once a page, first in `<head>` so the app's own CSS wins. */
const ensureStylesheet = () => {
  if (document.querySelector("style[data-map-runtime]")) {
    return;
  }
  const style = document.createElement("style");
  style.dataset.mapRuntime = "";
  style.textContent = STYLESHEET;
  document.head.prepend(style);
};

// =============================================================================
// MapLibre, once
// =============================================================================

let library: Promise<MapLibre> | null = null;

const loadMapLibre = () => {
  library ??= import("maplibre-gl")
    .then((lib) => {
      if (!lib.getWorkerUrl()) {
        lib.setWorkerUrl(
          `https://unpkg.com/maplibre-gl@${lib.getVersion()}/dist/maplibre-gl-worker.mjs`
        );
      }
      return lib;
    })
    .catch((error: unknown) => {
      library = null;
      throw error;
    });
  return library;
};

// =============================================================================
// Small helpers
// =============================================================================

const reducedMotion = () =>
  typeof matchMedia === "function" && matchMedia(REDUCED_MOTION).matches;

/** A camera step's length: `STEP_MS`, or 0 where motion is reduced. */
export const mapStepDuration = (ms = STEP_MS) => (reducedMotion() ? 0 : ms);

const viewportOf = (map: MapLibreMap): MapViewport => {
  const center = map.getCenter();
  return {
    bearing: map.getBearing(),
    center: [center.lng, center.lat],
    pitch: map.getPitch(),
    zoom: map.getZoom(),
  };
};

const sameViewport = (a: MapViewport, b: MapViewport) =>
  a.center[0] === b.center[0] &&
  a.center[1] === b.center[1] &&
  a.zoom === b.zoom &&
  a.bearing === b.bearing &&
  a.pitch === b.pitch;

/** A value's shape as a string: an inline object each render isn't a change. */
const keyOf = (value: unknown) => {
  try {
    return String(JSON.stringify(value));
  } catch {
    return String(value);
  }
};

/**
 * Whether data changed: the same object never did (no serializing a large
 * collection on every render); another one did if its shape differs.
 */
const changeTracker = (initial: unknown) => {
  let last = initial;
  let key = typeof initial === "object" ? "" : keyOf(initial);
  return (next: unknown) => {
    if (next === last) {
      return false;
    }
    last = next;
    const nextKey = keyOf(next);
    if (nextKey === key) {
      return false;
    }
    key = nextKey;
    return true;
  };
};

const projectionOf = (projection: MapProjection | undefined) =>
  typeof projection === "string" ? { type: projection } : projection;

/** `beforeId` only when that layer is in the style: MapLibre drops a layer added before a missing one. */
const beforeOf = (map: MapLibreMap, beforeId: string | undefined) =>
  beforeId && map.getLayer(beforeId) ? beforeId : undefined;

const removeLayers = (map: MapLibreMap, layers: string[], source?: string) => {
  try {
    for (const layer of layers) {
      if (map.getLayer(layer)) {
        map.removeLayer(layer);
      }
    }
    if (source && map.getSource(source)) {
      map.removeSource(source);
    }
  } catch {
    // The style is being replaced: its layers go with it.
  }
};

/** Paint merged with what the hovered feature draws instead (feature-state `hover`). */
const withHover = <T extends Record<string, unknown>>(
  paint: T,
  hover: T | undefined
): T => {
  if (!hover) {
    return paint;
  }
  const merged: Record<string, unknown> = { ...paint };
  for (const [key, value] of Object.entries(hover)) {
    if (value === undefined) {
      continue;
    }
    const base = merged[key];
    // A hover value that follows the zoom can't sit in a `case`: then the
    // plain value stays. MapLibre takes `["zoom"]` only at the top of a
    // curve, so over a zoom curve the hover goes inside each of its outputs.
    if (base === undefined) {
      merged[key] = value;
    } else if (isZoomCurve(base) && !isZoomCurve(value)) {
      merged[key] = hoverInsideCurve(base as unknown[], value);
    } else if (!isZoomCurve(value)) {
      merged[key] = ["case", HOVERED, value, base];
    }
  }
  return merged as T;
};

const HOVERED = ["boolean", ["feature-state", "hover"], false];

/** A paint value that's a curve over the zoom (`interpolate` or `step` on `["zoom"]`). */
const isZoomCurve = (value: unknown) =>
  Array.isArray(value) &&
  (String(value[0]).startsWith("interpolate") || value[0] === "step") &&
  JSON.stringify(value[value[0] === "step" ? 1 : 2]) === '["zoom"]';

/** The curve with each output a choice between the hover value and its own. */
const hoverInsideCurve = (curve: unknown[], hover: unknown) => {
  const step = curve[0] === "step";
  // interpolate: [op, how, input, stop, out, stop, out…]; step: [op, input, out, stop, out…]
  return curve.map((item, index) => {
    const output = step
      ? index === 2 || (index > 2 && index % 2 === 0)
      : index > 3 && index % 2 === 0;
    return output ? ["case", HOVERED, hover, item] : item;
  });
};

/**
 * Sets the paint values that differ from the layer's: MapLibre redraws the
 * map on every `setPaintProperty`, changed or not, and the parts pass their
 * whole paint on every render.
 */
const setPaint = (
  map: MapLibreMap,
  layer: string,
  paint: Record<string, unknown>
) => {
  if (!map.getLayer(layer)) {
    return;
  }
  for (const [key, value] of Object.entries(paint)) {
    if (keyOf(map.getPaintProperty(layer, key as never)) !== keyOf(value)) {
      map.setPaintProperty(layer, key as never, value as never);
    }
  }
};

/** The same for layout values (a changed layout lays the layer's tiles out again). */
const setLayout = (
  map: MapLibreMap,
  layer: string,
  layout: Record<string, unknown>
) => {
  if (!map.getLayer(layer)) {
    return;
  }
  for (const [key, value] of Object.entries(layout)) {
    if (keyOf(map.getLayoutProperty(layer, key as never)) !== keyOf(value)) {
      map.setLayoutProperty(layer, key as never, value as never);
    }
  }
};

const emptyLine = (
  coordinates: MapCoordinate[]
): MapGeoJSONFeature<MapGeoJSONLineString> => ({
  geometry: {
    coordinates: coordinates.length < 2 ? [] : coordinates,
    type: "LineString",
  },
  properties: {},
  type: "Feature",
});

let ids = 0;
/** A layer id no other map part has. */
const uid = (prefix: string) => {
  ids += 1;
  return `${prefix}-${ids.toString(36)}`;
};

/**
 * A copy of a wheel, mouse or touch event for MapLibre's canvas, its
 * touches retargeted there (MapLibre drops touches from outside it).
 * `null` where the browser can't build one.
 */
const retarget = (event: Event, container: HTMLElement): Event | null => {
  try {
    if (event instanceof WheelEvent) {
      return new WheelEvent(event.type, event);
    }
    if (event instanceof MouseEvent) {
      return new MouseEvent(event.type, event);
    }
    if (typeof TouchEvent !== "undefined" && event instanceof TouchEvent) {
      const copy = (list: TouchList) =>
        Array.from(
          list,
          (touch) =>
            new Touch({
              clientX: touch.clientX,
              clientY: touch.clientY,
              force: touch.force,
              identifier: touch.identifier,
              pageX: touch.pageX,
              pageY: touch.pageY,
              radiusX: touch.radiusX,
              radiusY: touch.radiusY,
              rotationAngle: touch.rotationAngle,
              screenX: touch.screenX,
              screenY: touch.screenY,
              target: container,
            })
        );
      return new TouchEvent(event.type, {
        bubbles: true,
        cancelable: event.cancelable,
        changedTouches: copy(event.changedTouches),
        targetTouches: copy(event.touches),
        touches: copy(event.touches),
      });
    }
  } catch {
    // No constructor for it here: the gesture stays on the marker.
  }
  return null;
};

// =============================================================================
// Colors: any CSS color, resolved on the map's box
// =============================================================================

/**
 * Resolves CSS colors MapLibre can't read (`var(--primary)`, `oklch(…)`)
 * to `rgb()` on the map's box, through a hidden probe and a one-pixel
 * canvas. Hex, `rgb()`, `hsl()` and names pass as they are.
 */
class Colors {
  private readonly root: HTMLElement;
  private probe: HTMLElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private readonly cache: Record<string, string> = {};

  constructor(root: HTMLElement) {
    this.root = root;
  }

  /** The theme changed: every variable reads again. */
  reset() {
    for (const key of Object.keys(this.cache)) {
      delete this.cache[key];
    }
  }

  resolve(value: string) {
    if (!COLOR_FUNCTION.test(value.trim())) {
      return value;
    }
    const cached = this.cache[value];
    if (cached) {
      return cached;
    }
    const rgb = this.measure(value);
    if (!rgb) {
      // Not resolvable yet (a variable whose rule hasn't loaded): passed on
      // as it is and tried again at the next paint, never cached.
      return value;
    }
    this.cache[value] = rgb;
    return rgb;
  }

  /** A color's sRGB channels, 0 to 255 (alpha too), on the map's box; `null` if it isn't one. */
  channels(value: string): [number, number, number, number] | null {
    return this.rgba(value);
  }

  /** The `--background` luminance: dark below the middle. */
  theme(): MapTheme | null {
    const background = this.rgba("var(--background)");
    if (!background || background[3] === 0) {
      return null;
    }
    const [r, g, b] = background;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128 ? "dark" : "light";
  }

  destroy() {
    this.probe?.remove();
    this.probe = null;
  }

  private measure(value: string) {
    const rgba = this.rgba(value);
    if (!rgba) {
      return null;
    }
    const [r, g, b, a] = rgba;
    return a >= 255
      ? `rgb(${r}, ${g}, ${b})`
      : `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`;
  }

  private rgba(value: string): [number, number, number, number] | null {
    if (!this.probe) {
      this.probe = document.createElement("span");
      this.probe.hidden = true;
      this.probe.dataset.slot = "map-color-probe";
      this.root.append(this.probe);
    }
    this.probe.style.color = "";
    this.probe.style.color = value;
    if (!this.probe.style.color) {
      return null;
    }
    const computed = getComputedStyle(this.probe).color;
    if (!this.context) {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      this.context = canvas.getContext("2d", { willReadFrequently: true });
    }
    const { context } = this;
    if (!context) {
      return null;
    }
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = "#000";
    context.fillStyle = computed;
    context.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a];
  }
}

// =============================================================================
// The themed basemap: the style's own colors, in the theme's tokens
// =============================================================================

/** `[L, a, b]`, Oklab. */
type Lab = [number, number, number];

const toLinear = (channel: number) => {
  const value = channel / 255;
  return value <= 0.040_45 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const toChannel = (value: number) => {
  const clamped = Math.min(1, Math.max(0, value));
  const encoded =
    clamped <= 0.003_130_8
      ? 12.92 * clamped
      : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return Math.round(encoded * 255);
};

const oklabOf = (r: number, g: number, b: number): Lab => {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(
    0.412_221_47 * lr + 0.536_332_54 * lg + 0.051_445_99 * lb
  );
  const m = Math.cbrt(0.211_903_5 * lr + 0.680_699_55 * lg + 0.107_396_96 * lb);
  const s = Math.cbrt(0.088_302_46 * lr + 0.281_718_84 * lg + 0.629_978_7 * lb);
  return [
    0.210_454_26 * l + 0.793_617_79 * m - 0.004_072_05 * s,
    1.977_998_5 * l - 2.428_592_2 * m + 0.450_593_7 * s,
    0.025_904_04 * l + 0.782_771_77 * m - 0.808_675_77 * s,
  ];
};

const rgbOf = ([L, a, b]: Lab): [number, number, number] => {
  const l = (L + 0.396_337_78 * a + 0.215_803_76 * b) ** 3;
  const m = (L - 0.105_561_35 * a - 0.063_854_17 * b) ** 3;
  const s = (L - 0.089_484_18 * a - 1.291_485_5 * b) ** 3;
  return [
    toChannel(4.076_741_66 * l - 3.307_711_59 * m + 0.230_969_93 * s),
    toChannel(-1.268_438 * l + 2.609_757_4 * m - 0.341_319_4 * s),
    toChannel(-0.004_196_09 * l - 0.703_418_6 * m + 1.707_614_7 * s),
  ];
};

const mixLab = (from: Lab, to: Lab, t: number): Lab => [
  from[0] + (to[0] - from[0]) * t,
  from[1] + (to[1] - from[1]) * t,
  from[2] + (to[2] - from[2]) * t,
];

const clamp01 = (value: number) =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;

/** A style's color, parsed once: `[Oklab, alpha 0 to 1]`, `null` for anything else. */
const parsedColors = new Map<string, [Lab, number] | null>();
let colorParser: CanvasRenderingContext2D | null = null;
const HEX_SERIALIZED = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i;
const RGBA_SERIALIZED =
  /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i;

/** Hex, `rgb()`, `hsl()` and names, read by a canvas, which serializes each to hex or `rgba()`. */
const parseStyleColor = (value: string): [Lab, number] | null => {
  const cached = parsedColors.get(value);
  if (cached !== undefined) {
    return cached;
  }
  colorParser ??= document.createElement("canvas").getContext("2d");
  let result: [Lab, number] | null = null;
  if (colorParser) {
    // Two different starting colors: an unparsed value leaves each as it was.
    colorParser.fillStyle = "#010203";
    colorParser.fillStyle = value;
    const first = String(colorParser.fillStyle);
    colorParser.fillStyle = "#030201";
    colorParser.fillStyle = value;
    const serialized = String(colorParser.fillStyle);
    if (first === serialized) {
      const hex = serialized.match(HEX_SERIALIZED);
      const rgba = serialized.match(RGBA_SERIALIZED);
      if (hex) {
        result = [
          oklabOf(
            Number.parseInt(hex[1] ?? "0", 16),
            Number.parseInt(hex[2] ?? "0", 16),
            Number.parseInt(hex[3] ?? "0", 16)
          ),
          1,
        ];
      } else if (rgba) {
        result = [
          oklabOf(Number(rgba[1]), Number(rgba[2]), Number(rgba[3])),
          rgba[4] === undefined ? 1 : Number(rgba[4]),
        ];
      }
    }
  }
  parsedColors.set(value, result);
  return result;
};

/**
 * The theme's colors a basemap is drawn in: the land, what's lighter than
 * the land (the paper: roads, halos), the labels' gray, and the ink beyond
 * it, each in Oklab.
 */
interface BasemapPalette {
  /** The theme is dark. */
  dark: boolean;
  ground: Lab;
  ink: Lab;
  key: string;
  label: Lab;
  paper: Lab;
}

/** A style color's place between its style's background and its labels. */
interface BasemapSource {
  /** The style's background lightness (Oklab L). */
  ground: number;
  /** A light style: labels darker than the ground. */
  light: boolean;
}

/** What a color draws: a text's halo, or water (which keeps its hue). */
interface BasemapRole {
  halo: boolean;
  water: boolean;
}

/** Where a light style's labels sit, and a dark style's (Oklab L): Positron's and Dark Matter's grays. */
const LABEL_LIGHTNESS = { dark: 0.72, light: 0.55 };

/**
 * A style color's lightness, in the theme: placed against the style's
 * background, as far toward the theme's labels (or past them, toward its
 * ink, or back toward its paper), so land, water, roads, buildings and
 * labels keep their order.
 */
const themedLightness = (
  lightness: number,
  source: BasemapSource,
  palette: BasemapPalette,
  halo: boolean
): Lab => {
  const label = source.light ? LABEL_LIGHTNESS.light : LABEL_LIGHTNESS.dark;
  const toward = (lightness - source.ground) / (label - source.ground);
  if (toward >= 0 && toward <= 1) {
    return mixLab(palette.ground, palette.label, toward);
  }
  if (toward > 1) {
    const end = source.light ? 0 : 1;
    return mixLab(
      palette.label,
      palette.ink,
      clamp01((lightness - label) / (end - label))
    );
  }
  const start = source.light ? 1 : 0;
  const back = clamp01((lightness - source.ground) / (start - source.ground));
  if (source.light !== palette.dark) {
    return mixLab(palette.ground, palette.paper, back);
  }
  // A light style in a dark theme (or the reverse): its paper, the roads,
  // turns a step toward the labels, as a dark style draws them, and its
  // halos stay the ground the labels stand out from.
  return halo
    ? palette.ground
    : mixLab(palette.ground, mixLab(palette.ground, palette.label, 0.35), back);
};

/** One color of the style, in the theme's lightness and tint. */
const themedColor = (
  value: string,
  source: BasemapSource,
  palette: BasemapPalette,
  role: BasemapRole
) => {
  const parsed = parseStyleColor(value);
  if (!parsed) {
    return value;
  }
  const [[lightness, sourceA, sourceB], alpha] = parsed;
  let lab = themedLightness(lightness, source, palette, role.halo);
  if (role.water) {
    // Water keeps the style's own faint hue over the theme's: in gray
    // alone it reads as the buildings do, at the same lightness.
    lab = [lab[0], lab[1] + sourceA, lab[2] + sourceB];
  }
  const [r, g, b] = rgbOf(lab);
  return alpha >= 1
    ? `rgb(${r}, ${g}, ${b})`
    : `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 1000) / 1000})`;
};

const STYLE_COLOR = /^(?:#|rgba?\(|hsla?\()/i;

/** A paint value with every color in it themed, expressions and zoom stops included. */
const themedValue = (
  value: unknown,
  source: BasemapSource,
  palette: BasemapPalette,
  role: BasemapRole,
  top = true
): unknown => {
  if (typeof value === "string") {
    // Inside an expression only what looks like a color is one: a string
    // there may be a property's value ("park"), never a color name.
    return top || STYLE_COLOR.test(value)
      ? themedColor(value, source, palette, role)
      : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => themedValue(item, source, palette, role, false));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        themedValue(item, source, palette, role, false),
      ])
    );
  }
  return value;
};

/** Water's layers, by their id or their tiles' layer (CARTO's and OpenMapTiles' names alike). */
const WATER_LAYER = /water|ocean|sea\b|lake|river/i;

/** The paint keys that hold colors a basemap draws (not a heatmap's ramp). */
const isBasemapColor = (key: string) =>
  key.endsWith("-color") && key !== "heatmap-color";

/** Where a style's colors start from: its background's lightness. */
const basemapSource = (style: StyleSpecification): BasemapSource => {
  const background = style.layers.find((layer) => layer.type === "background");
  const value = background?.paint?.["background-color"];
  const colors: string[] = [];
  const collect = (item: unknown) => {
    if (typeof item === "string" && STYLE_COLOR.test(item)) {
      colors.push(item);
    } else if (Array.isArray(item)) {
      for (const inner of item) {
        collect(inner);
      }
    }
  };
  collect(typeof value === "string" ? [value] : value);
  const parsed = colors.length > 0 ? parseStyleColor(colors[0] ?? "") : null;
  const ground = parsed ? parsed[0][0] : 0.97;
  return { ground, light: ground >= 0.5 };
};

/** Each basemap layer's color paint, themed: `[layer id, paint]`. */
const themedPaints = (style: StyleSpecification, palette: BasemapPalette) => {
  const source = basemapSource(style);
  const out: [string, Record<string, unknown>][] = [];
  for (const layer of style.layers) {
    const { paint, "source-layer": tiles } = layer as {
      paint?: Record<string, unknown>;
      "source-layer"?: string;
    };
    if (!paint) {
      continue;
    }
    const water = WATER_LAYER.test(`${layer.id} ${tiles ?? ""}`);
    const themed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(paint)) {
      if (isBasemapColor(key)) {
        themed[key] = themedValue(value, source, palette, {
          halo: key.includes("halo"),
          water,
        });
      }
    }
    if (Object.keys(themed).length > 0) {
      out.push([layer.id, themed]);
    }
  }
  return out;
};

/** A copy of the style with its colors themed, for MapLibre's `transformStyle`. */
const themedStyle = (
  style: StyleSpecification,
  palette: BasemapPalette
): StyleSpecification => {
  const paints = new Map(themedPaints(style, palette));
  return {
    ...style,
    layers: style.layers.map((layer) => {
      const themed = paints.get(layer.id);
      return themed
        ? ({
            ...layer,
            paint: {
              ...(layer as { paint?: Record<string, unknown> }).paint,
              ...themed,
            },
          } as typeof layer)
        : layer;
    }),
  };
};

// =============================================================================
// Routes: lengths and points along them
// =============================================================================

interface RouteMeasure {
  /** The length up to each vertex. */
  cumulative: number[];
  total: number;
}

const clampFraction = (value: number) =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

/** Lengths along a route, equirectangular (longitude scaled by the latitude's cosine): close enough to cut it. */
const measureRoute = (coordinates: MapCoordinate[]): RouteMeasure => {
  const cumulative = [0];
  let total = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    const [lng1, lat1] = coordinates[index - 1] ?? [0, 0];
    const [lng2, lat2] = coordinates[index] ?? [0, 0];
    const midLat = ((lat1 + lat2) / 2) * (Math.PI / 180);
    total += Math.hypot((lng2 - lng1) * Math.cos(midLat), lat2 - lat1);
    cumulative.push(total);
  }
  return { cumulative, total };
};

/** The segment `distance` falls in. */
const segmentAt = (cumulative: number[], distance: number) => {
  let low = 0;
  let high = cumulative.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if ((cumulative[mid] ?? 0) < distance) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return Math.max(0, Math.min(low - 1, cumulative.length - 2));
};

const pointAtFraction = (
  coordinates: MapCoordinate[],
  measure: RouteMeasure,
  fraction: number
): MapCoordinate | null => {
  const [first] = coordinates;
  if (!first) {
    return null;
  }
  if (coordinates.length === 1 || measure.total === 0) {
    return first;
  }
  const target = measure.total * clampFraction(fraction);
  const index = segmentAt(measure.cumulative, target);
  const [lng1, lat1] = coordinates[index] ?? first;
  const [lng2, lat2] = coordinates[index + 1] ?? first;
  const from = measure.cumulative[index] ?? 0;
  const length = (measure.cumulative[index + 1] ?? from) - from;
  const ratio = length === 0 ? 0 : (target - from) / length;
  return [lng1 + (lng2 - lng1) * ratio, lat1 + (lat2 - lat1) * ratio];
};

/** The route up to `fraction`, ending exactly there. */
const sliceAtFraction = (
  coordinates: MapCoordinate[],
  measure: RouteMeasure,
  fraction: number
): MapCoordinate[] => {
  const t = clampFraction(fraction);
  if (coordinates.length < 2 || t <= 0 || measure.total === 0) {
    return [];
  }
  if (t >= 1) {
    return coordinates;
  }
  const index = segmentAt(measure.cumulative, measure.total * t);
  const point = pointAtFraction(coordinates, measure, t);
  const traveled = coordinates.slice(0, index + 1);
  if (point) {
    traveled.push(point);
  }
  return traveled;
};

/**
 * A place along a route: its start, its end, its progress point, or a
 * fraction of its length. `null` for an empty route, or for `progress`
 * without one.
 */
export const mapRoutePoint = (
  coordinates: MapCoordinate[],
  at: MapRouteAnchor,
  progress?: number
): MapCoordinate | null => {
  if (coordinates.length === 0) {
    return null;
  }
  if (at === "start") {
    return coordinates[0] ?? null;
  }
  if (at === "end") {
    return coordinates.at(-1) ?? null;
  }
  const fraction = at === "progress" ? progress : at;
  if (fraction === undefined) {
    return null;
  }
  return pointAtFraction(coordinates, measureRoute(coordinates), fraction);
};

/** A quadratic arc from one point to another, crossing the antimeridian the short way. */
const arcCoordinates = (
  from: MapCoordinate,
  to: MapCoordinate,
  curvature: number,
  samples: number
): MapCoordinate[] => {
  const [x0, y0] = from;
  const [toX, y2] = to;
  const rawDx = toX - x0;
  let x2 = toX;
  if (rawDx > 180) {
    x2 = toX - 360;
  } else if (rawDx < -180) {
    x2 = toX + 360;
  }
  const dx = x2 - x0;
  const dy = y2 - y0;
  const distance = Math.hypot(dx, dy);
  if (distance === 0 || curvature === 0) {
    return [from, [x2, y2]];
  }
  const cx = (x0 + x2) / 2 + (-dy / distance) * distance * curvature;
  const cy = (y0 + y2) / 2 + (dx / distance) * distance * curvature;
  const points: MapCoordinate[] = [];
  const segments = Math.max(2, Math.floor(samples));
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const inverse = 1 - t;
    points.push([
      inverse * inverse * x0 + 2 * inverse * t * cx + t * t * x2,
      inverse * inverse * y0 + 2 * inverse * t * cy + t * t * y2,
    ]);
  }
  return points;
};

// =============================================================================
// The controller
// =============================================================================

/** `original`: the basemap in its style's own colors. `theme`: in the theme's tokens. */
export type MapBasemap = "original" | "theme";

export interface MapControllerOptions {
  /**
   * `theme` draws the basemap in the theme's colors: its land, water,
   * roads, buildings and labels in the background, muted and foreground
   * tokens, in the same order of light to dark, read again when the theme
   * or the preset changes (the default). `original` keeps the style's own
   * colors.
   */
  basemap?: MapBasemap;
  /** A clear, tile-less basemap for your own layers. */
  blank?: boolean;
  /** The first camera, when `viewport` isn't given. */
  defaultViewport?: Partial<MapViewport>;
  /** A click on the map itself (not on a marker or a popup), and where. */
  onClick?: (position: MapLngLat) => void;
  onReady?: (map: MapInstance) => void;
  onViewportChange?: (viewport: MapViewport) => void;
  onViewportChangeEnd?: (viewport: MapViewport) => void;
  options?: MapEngineOptions;
  projection?: MapProjection;
  styles?: MapStyles;
  /** The basemap's theme; followed from the page when not given. */
  theme?: MapTheme;
  /** The camera, kept where it says (with `onViewportChange`). */
  viewport?: Partial<MapViewport>;
}

/** What the parts read: the map once it exists, and whether its style has drawn. */
export interface MapSnapshot {
  map: MapInstance | null;
  /** The style has loaded: layers can be added. */
  ready: boolean;
  status: MapStatus;
  theme: MapTheme;
}

interface Transformish {
  isLocationOccluded?: (lngLat: unknown) => boolean;
}

/** MapLibre's camera transform, which its own markers ask about the globe (`_camera` since v6). */
interface Occludable {
  _camera?: { transform?: Transformish };
  transform?: Transformish;
}

interface LayerEntry {
  /** Adds its sources and layers to a loaded style. */
  mount: (map: MapLibreMap) => void;
  /** Colors read again (the theme changed, the style didn't). */
  repaint?: (map: MapLibreMap) => void;
  /** Takes them off (the part unmounts). */
  unmount: (map: MapLibreMap) => void;
}

interface FloatingEntry {
  element: HTMLElement;
  offset: number;
  side: MapSide;
}

interface OverlayEntry {
  anchor: MapAnchor;
  element: HTMLElement;
  floating: FloatingEntry[];
  /** Where it was put last, from props or a drag. */
  lngLat: MapCoordinate;
  offset: [number, number];
  rotation?: number;
  rotationAlignment?: "map" | "viewport";
  /** Shown, culled or behind the globe, as last written: written again only when it changes. */
  shown?: "culled" | "occluded" | "visible";
  /** The turn last written, with its origin. */
  turned?: string;
}

export interface MapOverlayOptions {
  anchor?: MapAnchor;
  /** Drag it with a pointer; the arrow keys move it through `nudge`. */
  draggable?: boolean;
  latitude: number;
  longitude: number;
  /** Pixels from the anchor, `[x, y]`. */
  offset?: [number, number];
  onDrag?: (position: MapLngLat) => void;
  onDragEnd?: (position: MapLngLat) => void;
  /** Hands the wheel, presses and touches to the map, as a marker does. @default true */
  passThrough?: boolean;
  /**
   * Turns its content, in degrees clockwise, round its anchor (as
   * `--map-marker-rotation` and `--map-marker-origin` on the element).
   */
  rotation?: number;
  /** `map` turns it with the map, as a heading on the ground; `viewport` keeps it as it is on the screen. @default "viewport" */
  rotationAlignment?: "map" | "viewport";
}

/** An element kept over a coordinate. */
export interface MapOverlay {
  /**
   * Keeps `element` (a popup inside the overlay) on `side`, or the side with
   * room, `offset` pixels away, shifted to stay in the box. Returns the
   * detach.
   */
  attachFloating: (
    element: HTMLElement,
    side?: MapSide,
    offset?: number
  ) => () => void;
  /** Moves it by pixels, as a drag would, and reports where it lands. */
  nudge: (dx: number, dy: number) => void;
  remove: () => void;
  update: (options: MapOverlayOptions) => void;
}

/** Where to put a part's layers, and which way a style swap leaves them. */
export interface MapController {
  addLayer: (entry: LayerEntry) => () => void;
  addOverlay: (element: HTMLElement, options: MapOverlayOptions) => MapOverlay;
  destroy: () => void;
  /** Calls `listener` on a click on the map itself (not on a marker or a popup). */
  onClick: (listener: (event: MapMouseEvent) => void) => () => void;
  /** Resolves a CSS color on the map's box. */
  resolveColor: (value: string) => string;
  readonly root: HTMLElement;
  /** Sets the canvas cursor for `owner` (`null` gives it up). */
  setCursor: (owner: string, cursor: string | null) => void;
  snapshot: () => MapSnapshot;
  subscribe: (listener: (snapshot: MapSnapshot) => void) => () => void;
  /** Fills the screen with the map's box, or leaves fullscreen. */
  toggleFullscreen: () => void;
  update: (options: MapControllerOptions) => void;
  /** Calls `listener` with whether the map's box fills the screen, now and on each change. */
  watchFullscreen: (listener: (fullscreen: boolean) => void) => () => void;
}

/**
 * Mounts a map in `canvas` (an element filling `root`, the box the parts'
 * markers and popups are placed in) and returns its controller. The map
 * builds once MapLibre has loaded; `onChange` hears each step.
 */
export const createMapController = (
  root: HTMLElement,
  canvas: HTMLElement,
  initial: MapControllerOptions,
  onChange?: (snapshot: MapSnapshot) => void
): MapController => {
  let options = initial;
  let lib: MapLibre | null = null;
  let map: MapLibreMap | null = null;
  let destroyed = false;
  let loaded = false;
  let styleReady = false;
  let status: MapStatus = "loading";
  let appliedStyleKey = "";
  let appliedProjectionKey = "";
  /** A camera move the controller made itself: not reported back. */
  let internalMove = false;
  const colors = new Colors(root);
  const layers: LayerEntry[] = [];
  const overlays = new Set<OverlayEntry>();
  const clickListeners = new Set<(event: MapMouseEvent) => void>();
  const listeners = new Set<(snapshot: MapSnapshot) => void>();
  const cursors: Record<string, string> = {};
  ensureStylesheet();
  let detectedTheme: MapTheme = detectTheme(colors);
  let snapshotCache: MapSnapshot | null = null;

  const theme = () => options.theme ?? detectedTheme;

  const snapshot = (): MapSnapshot => {
    const next = {
      map,
      ready: loaded && styleReady,
      status,
      theme: theme(),
    };
    if (
      snapshotCache &&
      snapshotCache.map === next.map &&
      snapshotCache.ready === next.ready &&
      snapshotCache.status === next.status &&
      snapshotCache.theme === next.theme
    ) {
      return snapshotCache;
    }
    snapshotCache = next;
    return next;
  };

  const emit = () => {
    if (destroyed) {
      return;
    }
    const current = snapshot();
    onChange?.(current);
    for (const listener of listeners) {
      listener(current);
    }
  };

  const styleFor = (): MapStyle => {
    const own = options.styles;
    if (own) {
      return (theme() === "dark" ? own.dark : own.light) ?? STYLES[theme()];
    }
    return options.blank ? BLANK_STYLE : STYLES[theme()];
  };

  /** The basemap is drawn in the theme's colors (not a blank one: it has none). */
  const themed = () =>
    (options.basemap ?? "theme") === "theme" &&
    !(options.blank && !options.styles);

  /** A style's key, its object serialized once (a large style isn't, again, on every render). */
  let keyedStyle: unknown = null;
  let keyedStyleKey = "";
  const styleKey = (style: MapStyle) => {
    if (typeof style === "string") {
      return `${style}|${themed() ? "theme" : "original"}`;
    }
    if (style !== keyedStyle) {
      keyedStyle = style;
      keyedStyleKey = keyOf(style);
    }
    return `${keyedStyleKey}|${themed() ? "theme" : "original"}`;
  };

  // ---------------------------------------------------------------------------
  // The themed basemap
  // ---------------------------------------------------------------------------

  /** The style as it came, before its colors were themed: recolored from it again on a theme change. */
  let basemapStyle: StyleSpecification | null = null;
  /** The palette it was last drawn in. */
  let basemapKey = "";

  const basemapPalette = (): BasemapPalette | null => {
    const read = (token: string): Lab | null => {
      const rgba = colors.channels(`var(${token})`);
      return rgba ? oklabOf(rgba[0], rgba[1], rgba[2]) : null;
    };
    const background = read("--background");
    const muted = read("--muted");
    const label = read("--muted-foreground");
    const ink = read("--foreground");
    if (!(background && muted && label && ink)) {
      return null;
    }
    // Light: the land halfway to the muted surface and the roads the
    // background, lighter. Dark: the land is the background, and the paper
    // darker still.
    const dark = background[0] < 0.5;
    const ground = dark ? background : mixLab(background, muted, 0.5);
    const paper: Lab = dark
      ? [background[0] * 0.6, background[1] * 0.6, background[2] * 0.6]
      : background;
    return {
      dark,
      ground,
      ink,
      key: keyOf([ground, paper, label, ink]),
      label,
      paper,
    };
  };

  /** Loads `style`, its colors themed as it arrives when the basemap follows the theme. */
  const loadStyle = (instance: MapLibreMap, style: MapStyle) => {
    if (!themed()) {
      basemapStyle = null;
      instance.setStyle(style, { diff: false });
      return;
    }
    instance.setStyle(style, {
      // A full reload, so `style.load` fires every time and the layers go
      // back on in order.
      diff: false,
      transformStyle: (_previous, next) => {
        basemapStyle = next;
        const palette = basemapPalette();
        basemapKey = palette?.key ?? "";
        return palette ? themedStyle(next, palette) : next;
      },
    });
  };

  /** The loaded basemap drawn in the theme's colors again, in place: no tiles reload. */
  const recolorBasemap = () => {
    if (!(map && styleReady && basemapStyle && themed())) {
      return;
    }
    const palette = basemapPalette();
    if (!palette || palette.key === basemapKey) {
      return;
    }
    basemapKey = palette.key;
    for (const [layer, paint] of themedPaints(basemapStyle, palette)) {
      setPaint(map, layer, paint);
    }
  };

  // ---------------------------------------------------------------------------
  // Overlays: elements kept over coordinates
  // ---------------------------------------------------------------------------

  const fit = (overlay: OverlayEntry, floating: FloatingEntry) => {
    const { element, offset, side } = floating;
    const box = root.getBoundingClientRect();
    const anchor = overlay.element.getBoundingClientRect();
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const room: Record<MapSide, number> = {
      bottom: box.bottom - anchor.bottom - offset - EDGE,
      left: anchor.left - box.left - offset - EDGE,
      right: box.right - anchor.right - offset - EDGE,
      top: anchor.top - box.top - offset - EDGE,
    };
    const needs = (candidate: MapSide) =>
      candidate === "top" || candidate === "bottom" ? height : width;
    const order: MapSide[] = [
      side,
      OPPOSITE[side],
      ...(["top", "bottom", "right", "left"] as const).filter(
        (candidate) => candidate !== side && candidate !== OPPOSITE[side]
      ),
    ];
    const placement =
      order.find((candidate) => room[candidate] >= needs(candidate)) ??
      order.reduce((best, candidate) =>
        room[candidate] - needs(candidate) > room[best] - needs(best)
          ? candidate
          : best
      );
    let x = 0;
    let y = 0;
    if (placement === "top" || placement === "bottom") {
      x = (anchor.width - width) / 2;
      y = placement === "top" ? -height - offset : anchor.height + offset;
      const left = anchor.left + x;
      const min = box.left + EDGE;
      const max = box.right - EDGE - width;
      x += Math.max(min, Math.min(max, left)) - left;
    } else {
      y = (anchor.height - height) / 2;
      x = placement === "left" ? -width - offset : anchor.width + offset;
      const top = anchor.top + y;
      const min = box.top + EDGE;
      const max = box.bottom - EDGE - height;
      y += Math.max(min, Math.min(max, top)) - top;
    }
    element.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
    element.dataset.placement = placement;
  };

  // The box's size, read once per resize, not once per marker per frame: a
  // read after the last marker's write would lay the page out again, for
  // every marker, on every frame of a pan.
  let boxWidth = 0;
  let boxHeight = 0;
  const measureBox = () => {
    boxWidth = root.clientWidth;
    boxHeight = root.clientHeight;
  };

  // The box's own size, watched: MapLibre skips its observer's first call,
  // so a map built in a box laid out later (a frame's styles still loading,
  // a hidden tab) kept its first size, and markers were culled against it.
  const boxObserver = new ResizeObserver(() => {
    measureBox();
    if (!map) {
      return;
    }
    const drawn = map.getCanvas();
    if (
      Math.abs(drawn.clientWidth - canvas.clientWidth) > 1 ||
      Math.abs(drawn.clientHeight - canvas.clientHeight) > 1
    ) {
      map.resize();
    }
    placeAll();
  });
  boxObserver.observe(root);

  /** Behind the globe: hidden, as MapLibre's markers are. */
  const occludedAt = (instance: MapLibreMap, lngLat: MapCoordinate) =>
    lib !== null &&
    instance.getProjection()?.type === "globe" &&
    Boolean(
      (
        (instance as unknown as Occludable)._camera?.transform ??
        (instance as unknown as Occludable).transform
      )?.isLocationOccluded?.(new lib.LngLat(lngLat[0], lngLat[1]))
    );

  /** Shown, or hidden behind the globe, or culled this far outside the box. */
  const visibilityAt = (
    instance: MapLibreMap,
    lngLat: MapCoordinate,
    point: { x: number; y: number }
  ): NonNullable<OverlayEntry["shown"]> => {
    if (occludedAt(instance, lngLat)) {
      return "occluded";
    }
    return point.x < -CULL ||
      point.y < -CULL ||
      point.x > boxWidth + CULL ||
      point.y > boxHeight + CULL
      ? "culled"
      : "visible";
  };

  /** Its turn, as variables its content reads: with the map's bearing when it's aligned to the map. */
  const turn = (instance: MapLibreMap, overlay: OverlayEntry) => {
    const { style } = overlay.element;
    if (overlay.rotation === undefined) {
      if (overlay.turned !== undefined) {
        overlay.turned = undefined;
        style.removeProperty("--map-marker-rotation");
        style.removeProperty("--map-marker-origin");
      }
      return;
    }
    const bearing =
      overlay.rotationAlignment === "map" ? instance.getBearing() : 0;
    const angle = Math.round((overlay.rotation - bearing) * 100) / 100;
    const [shiftX, shiftY] = ANCHOR_SHIFT[overlay.anchor];
    const origin = `${-shiftX}% ${-shiftY}%`;
    const turned = `${angle}deg ${origin}`;
    if (turned !== overlay.turned) {
      overlay.turned = turned;
      style.setProperty("--map-marker-rotation", `${angle}deg`);
      style.setProperty("--map-marker-origin", origin);
    }
  };

  const place = (overlay: OverlayEntry) => {
    if (!map) {
      return;
    }
    turn(map, overlay);
    const point = map.project(overlay.lngLat);
    const ratio = globalThis.devicePixelRatio || 1;
    const x = Math.round((point.x + overlay.offset[0]) * ratio) / ratio;
    const y = Math.round((point.y + overlay.offset[1]) * ratio) / ratio;
    const [shiftX, shiftY] = ANCHOR_SHIFT[overlay.anchor];
    const { element } = overlay;
    element.style.translate = `calc(${x}px + ${shiftX}%) calc(${y}px + ${shiftY}%)`;
    const shown = visibilityAt(map, overlay.lngLat, point);
    const occluded = shown === "occluded";
    if (shown !== overlay.shown) {
      overlay.shown = shown;
      element.style.visibility = shown === "visible" ? "visible" : "hidden";
      if (occluded) {
        element.dataset.occluded = "";
      } else {
        delete element.dataset.occluded;
      }
    }
    if (shown === "visible") {
      for (const floating of overlay.floating) {
        fit(overlay, floating);
      }
    }
  };

  const placeAll = () => {
    for (const overlay of overlays) {
      place(overlay);
    }
  };

  const addOverlay = (
    element: HTMLElement,
    overlayOptions: MapOverlayOptions
  ): MapOverlay => {
    let current = overlayOptions;
    const entry: OverlayEntry = {
      anchor: current.anchor ?? "center",
      element,
      floating: [],
      lngLat: [current.longitude, current.latitude],
      offset: current.offset ?? [0, 0],
      rotation: current.rotation,
      rotationAlignment: current.rotationAlignment,
    };
    let given = keyOf([current.longitude, current.latitude]);
    overlays.add(entry);
    place(entry);

    const lngLatAt = (x: number, y: number): MapCoordinate | null => {
      if (!map) {
        return null;
      }
      const lngLat = map.unproject([x, y]);
      return [lngLat.lng, lngLat.lat];
    };
    const report = (callback: ((position: MapLngLat) => void) | undefined) => {
      const [longitude, latitude] = entry.lngLat;
      callback?.({ latitude, longitude });
    };

    // Where the last press went down: a click after the pointer travelled
    // (a drag, or a pan begun on the marker) isn't a click on the marker.
    let press: { x: number; y: number } | null = null;
    let drag: {
      dx: number;
      dy: number;
      moved: boolean;
      pointer: number;
    } | null = null;

    const onPointerDown = (event: PointerEvent) => {
      press = { x: event.clientX, y: event.clientY };
      if (!(current.draggable && map) || event.button !== 0) {
        return;
      }
      const box = root.getBoundingClientRect();
      const point = map.project(entry.lngLat);
      drag = {
        dx: event.clientX - box.left - point.x,
        dy: event.clientY - box.top - point.y,
        moved: false,
        pointer: event.pointerId,
      };
      element.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!(drag && press) || event.pointerId !== drag.pointer) {
        return;
      }
      if (
        !drag.moved &&
        Math.hypot(event.clientX - press.x, event.clientY - press.y) <
          DRAG_THRESHOLD
      ) {
        return;
      }
      drag.moved = true;
      element.dataset.dragging = "";
      const box = root.getBoundingClientRect();
      const next = lngLatAt(
        event.clientX - box.left - drag.dx,
        event.clientY - box.top - drag.dy
      );
      if (next) {
        entry.lngLat = next;
        place(entry);
        report(current.onDrag);
      }
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointer) {
        return;
      }
      const { moved } = drag;
      drag = null;
      delete element.dataset.dragging;
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
      if (moved) {
        report(current.onDragEnd);
      }
    };
    const onClickCapture = (event: MouseEvent) => {
      const from = press;
      press = null;
      if (
        from &&
        Math.hypot(event.clientX - from.x, event.clientY - from.y) >=
          DRAG_THRESHOLD
      ) {
        event.stopPropagation();
        event.preventDefault();
      }
    };

    // The map's own gestures begun over the marker: MapLibre listens on its
    // canvas, so the wheel, a press and touches are handed to it there (not
    // from a popup's content, and not a press that drags the marker).
    const forward = (event: Event) => {
      const target = event.target as Element | null;
      if (
        !(map && current.passThrough !== false) ||
        target?.closest("[data-map-floating]") ||
        (current.draggable && event.type !== "wheel")
      ) {
        return;
      }
      const container = map.getCanvasContainer();
      const copy = retarget(event, container);
      if (!copy) {
        return;
      }
      container.dispatchEvent(copy);
      if (copy.defaultPrevented && event.cancelable) {
        event.preventDefault();
      }
    };
    const FORWARDED = [
      "wheel",
      "mousedown",
      "touchstart",
      "touchmove",
      "touchend",
      "touchcancel",
    ];
    for (const type of FORWARDED) {
      element.addEventListener(type, forward, { passive: false });
    }
    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerUp);
    element.addEventListener("click", onClickCapture, true);

    return {
      attachFloating: (floatingElement, side = "top", offset = 12) => {
        const floating: FloatingEntry = {
          element: floatingElement,
          offset,
          side,
        };
        entry.floating.push(floating);
        floatingElement.dataset.mapFloating = "";
        fit(entry, floating);
        const resized = new ResizeObserver(() => fit(entry, floating));
        resized.observe(floatingElement);
        return () => {
          resized.disconnect();
          entry.floating = entry.floating.filter((item) => item !== floating);
          delete floatingElement.dataset.placement;
        };
      },
      nudge: (dx, dy) => {
        if (!map) {
          return;
        }
        const point = map.project(entry.lngLat);
        const next = lngLatAt(point.x + dx, point.y + dy);
        if (next) {
          entry.lngLat = next;
          place(entry);
          report(current.onDrag);
          report(current.onDragEnd);
        }
      },
      remove: () => {
        overlays.delete(entry);
        for (const type of FORWARDED) {
          element.removeEventListener(type, forward);
        }
        element.removeEventListener("pointerdown", onPointerDown);
        element.removeEventListener("pointermove", onPointerMove);
        element.removeEventListener("pointerup", onPointerUp);
        element.removeEventListener("pointercancel", onPointerUp);
        element.removeEventListener("click", onClickCapture, true);
        if (drag && element.hasPointerCapture(drag.pointer)) {
          element.releasePointerCapture(drag.pointer);
        }
        drag = null;
        delete element.dataset.dragging;
      },
      update: (next) => {
        current = next;
        const anchor = next.anchor ?? "center";
        const offset = next.offset ?? [0, 0];
        let moved =
          anchor !== entry.anchor ||
          offset[0] !== entry.offset[0] ||
          offset[1] !== entry.offset[1] ||
          next.rotation !== entry.rotation ||
          next.rotationAlignment !== entry.rotationAlignment;
        entry.anchor = anchor;
        entry.offset = offset;
        entry.rotation = next.rotation;
        entry.rotationAlignment = next.rotationAlignment;
        // A position from props moves it; the same props after a drag don't
        // pull it back.
        const key = keyOf([next.longitude, next.latitude]);
        if (key !== given) {
          given = key;
          entry.lngLat = [next.longitude, next.latitude];
          moved = true;
        }
        // Placed again only when something moved it: a list of markers
        // renders again on every hover in the app round it.
        if (moved) {
          place(entry);
        }
      },
    };
  };

  // ---------------------------------------------------------------------------
  // Layers, and the style under them
  // ---------------------------------------------------------------------------

  const addLayer = (entry: LayerEntry) => {
    layers.push(entry);
    if (map && styleReady) {
      entry.mount(map);
    }
    return () => {
      const index = layers.indexOf(entry);
      if (index !== -1) {
        layers.splice(index, 1);
      }
      if (map) {
        entry.unmount(map);
      }
    };
  };

  const applyStyle = () => {
    if (!map) {
      return;
    }
    const style = styleFor();
    const key = styleKey(style);
    if (key === appliedStyleKey) {
      return;
    }
    appliedStyleKey = key;
    styleReady = false;
    emit();
    // A full reload, so `style.load` fires every time and the layers go
    // back on in order.
    loadStyle(map, style);
  };

  const applyProjection = () => {
    if (!(map && styleReady)) {
      return;
    }
    const projection = projectionOf(options.projection);
    const key = keyOf(projection ?? null);
    if (projection && key !== appliedProjectionKey) {
      appliedProjectionKey = key;
      map.setProjection(projection);
      // No `move` follows a projection change: put the markers on the
      // globe (or back on the plane) now.
      placeAll();
    }
  };

  const applyViewport = () => {
    const { viewport } = options;
    if (!(map && viewport && options.onViewportChange) || map.isMoving()) {
      return;
    }
    const current = viewportOf(map);
    const next: MapViewport = {
      bearing: viewport.bearing ?? current.bearing,
      center: viewport.center ?? current.center,
      pitch: viewport.pitch ?? current.pitch,
      zoom: viewport.zoom ?? current.zoom,
    };
    if (sameViewport(current, next)) {
      return;
    }
    internalMove = true;
    map.jumpTo(next);
    internalMove = false;
  };

  const repaint = () => {
    if (!(map && styleReady)) {
      return;
    }
    for (const entry of layers) {
      entry.repaint?.(map);
    }
  };

  const onTheme = () => {
    const next = detectTheme(colors);
    colors.reset();
    const changed = next !== detectedTheme;
    detectedTheme = next;
    if (!map) {
      if (changed) {
        emit();
      }
      return;
    }
    const before = appliedStyleKey;
    applyStyle();
    if (before === appliedStyleKey) {
      // The same basemap in both themes (`blank`, or a preset's colors on
      // the same theme): the colors only.
      repaint();
      recolorBasemap();
      if (changed) {
        emit();
      }
    }
  };

  // The theme: the box's background, read again (once a frame) when a class
  // or a theme attribute changes on any element round the box. Not `style`:
  // the markers' own positions are styles, written on every frame of a pan.
  let themeFrame = 0;
  const scheduleTheme = () => {
    themeFrame ||= requestAnimationFrame(() => {
      themeFrame = 0;
      onTheme();
    });
  };
  const observer = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.target.contains(root))) {
      scheduleTheme();
    }
  });
  observer.observe(document.documentElement, {
    attributeFilter: ["class", "data-theme", "data-mode"],
    attributes: true,
    subtree: true,
  });
  const scheme = matchMedia(DARK_SCHEME);
  scheme.addEventListener("change", onTheme);
  // A stylesheet that arrives (a preset's or a style's, swapped in after
  // its class): its tokens are read once it has loaded.
  const onSheet = (event: Event) => {
    const target = event.target as HTMLLinkElement | null;
    if (target?.tagName === "LINK" && target.rel === "stylesheet") {
      scheduleTheme();
    }
  };
  document.addEventListener("load", onSheet, true);

  // ---------------------------------------------------------------------------
  // Building the map
  // ---------------------------------------------------------------------------

  const build = (loadedLib: MapLibre) => {
    if (destroyed) {
      return;
    }
    lib = loadedLib;
    const style = styleFor();
    appliedStyleKey = styleKey(style);
    const engine = options.options ?? {};
    const instance = new loadedLib.Map({
      container: canvas,
      // A globe is built flat and turns round once its style loads: with no
      // world copies the flat map would clamp its first view (a Pacific
      // center shown as the Atlantic) before the globe takes over.
      renderWorldCopies: projectionOf(options.projection)?.type === "globe",
      // A themed basemap loads below, through `transformStyle`, which the
      // constructor doesn't take.
      ...(themed() ? {} : { style }),
      ...engine,
      // Added below, at the end of the line the text runs to.
      attributionControl: false,
      ...cameraOptions(options.viewport ?? options.defaultViewport ?? {}),
    });
    if (!instance.painter) {
      instance.remove();
      throw new loadedLib.GPUInitializationError({}, null);
    }
    if (themed()) {
      loadStyle(instance, style);
    }
    addAttribution(loadedLib, instance, engine, root);
    map = instance;
    listen(instance);
    measureBox();
    emit();
    placeAll();
  };

  /** The map's events: the style's layers, the camera, clicks. */
  const listen = (instance: MapLibreMap) => {
    instance.on("style.load", () => {
      styleReady = true;
      appliedProjectionKey = "";
      applyProjection();
      // Tokens that changed while the style loaded.
      recolorBasemap();
      for (const entry of layers) {
        entry.mount(instance);
      }
      emit();
    });
    instance.on("load", () => {
      loaded = true;
      status = "ready";
      emit();
      options.onReady?.(instance);
    });
    instance.on("move", () => {
      placeAll();
      if (!internalMove) {
        options.onViewportChange?.(viewportOf(instance));
      }
    });
    instance.on("moveend", () => {
      if (!internalMove) {
        options.onViewportChangeEnd?.(viewportOf(instance));
      }
    });
    instance.on("resize", () => {
      measureBox();
      placeAll();
    });
    // Tiles in and nothing moving: screenshots and tests wait for this.
    instance.on("idle", () => {
      // A resize MapLibre hasn't caught up with yet (its observer is
      // throttled): draw at the box's size first, then call it settled.
      const drawn = instance.getCanvas();
      if (
        Math.abs(drawn.clientWidth - canvas.clientWidth) > 1 ||
        Math.abs(drawn.clientHeight - canvas.clientHeight) > 1
      ) {
        instance.resize();
        return;
      }
      root.setAttribute("data-idle", "");
    });
    instance.on("dataloading", () => root.removeAttribute("data-idle"));
    instance.on("movestart", () => root.removeAttribute("data-idle"));
    instance.on("resize", () => root.removeAttribute("data-idle"));
    // 3D terrain raises the ground as its tiles arrive, with no camera move:
    // markers follow it.
    instance.on("terrain", placeAll);
    instance.on("sourcedata", (event) => {
      if (instance.getTerrain() && event.sourceDataType !== "metadata") {
        placeAll();
      }
    });
    // The basemap's style itself didn't load (offline, a wrong URL): the
    // box says so instead of loading for ever. A tile's error names its
    // source and leaves the map as it is.
    instance.on("error", (event) => {
      const from = event as { sourceId?: string; tile?: unknown };
      if (loaded || styleReady || from.sourceId || from.tile) {
        return;
      }
      status = "error";
      emit();
    });
    instance.on("click", (event) => {
      options.onClick?.({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      });
      for (const listener of clickListeners) {
        listener(event);
      }
    });
  };

  loadMapLibre()
    .then(build)
    .catch((error: unknown) => {
      if (destroyed) {
        return;
      }
      status = "error";
      emit();
      console.warn("Map: MapLibre couldn't start.", error);
    });

  return {
    addLayer,
    addOverlay,
    destroy: () => {
      destroyed = true;
      observer.disconnect();
      boxObserver.disconnect();
      cancelAnimationFrame(themeFrame);
      scheme.removeEventListener("change", onTheme);
      document.removeEventListener("load", onSheet, true);
      overlays.clear();
      layers.length = 0;
      clickListeners.clear();
      listeners.clear();
      colors.destroy();
      map?.remove();
      map = null;
    },
    onClick: (listener) => {
      clickListeners.add(listener);
      return () => {
        clickListeners.delete(listener);
      };
    },
    resolveColor: (value) => colors.resolve(value),
    root,
    setCursor: (owner, cursor) => {
      if (cursor) {
        cursors[owner] = cursor;
      } else {
        delete cursors[owner];
      }
      if (map) {
        map.getCanvas().style.cursor = Object.values(cursors).at(-1) ?? "";
      }
    },
    snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    toggleFullscreen: () => {
      if (document.fullscreenElement === root) {
        document.exitFullscreen().catch(() => undefined);
      } else {
        root.requestFullscreen().catch(() => undefined);
      }
    },
    update: (next) => {
      const themeBefore = theme();
      options = next;
      if (!map) {
        return;
      }
      applyStyle();
      applyProjection();
      applyViewport();
      if (theme() !== themeBefore) {
        colors.reset();
        repaint();
        emit();
      }
    },
    watchFullscreen: (listener) => {
      const sync = () => listener(document.fullscreenElement === root);
      sync();
      document.addEventListener("fullscreenchange", sync);
      return () => document.removeEventListener("fullscreenchange", sync);
    },
  };
};

/** A camera as MapLibre's options take it, only what's given. */
const cameraOptions = (camera: Partial<MapViewport>) => ({
  ...(camera.center ? { center: camera.center } : {}),
  ...(camera.zoom === undefined ? {} : { zoom: camera.zoom }),
  ...(camera.bearing === undefined ? {} : { bearing: camera.bearing }),
  ...(camera.pitch === undefined ? {} : { pitch: camera.pitch }),
});

/** The sources' credits, compact, in the bottom corner at the end of the line. */
const addAttribution = (
  lib: MapLibre,
  map: MapLibreMap,
  engine: MapEngineOptions,
  root: HTMLElement
) => {
  if (engine.attributionControl === false) {
    return;
  }
  const rtl = getComputedStyle(root).direction === "rtl";
  map.addControl(
    new lib.AttributionControl({
      compact: true,
      ...(typeof engine.attributionControl === "object"
        ? engine.attributionControl
        : {}),
    }),
    rtl ? "bottom-left" : "bottom-right"
  );
};

/** The page's theme as the map's box shows it, else the document's, else the system's. */
const detectTheme = (colors: Colors): MapTheme => {
  const fromBox = colors.theme();
  if (fromBox) {
    return fromBox;
  }
  const root = document.documentElement;
  if (root.classList.contains("dark") || root.dataset.theme === "dark") {
    return "dark";
  }
  if (root.classList.contains("light") || root.dataset.theme === "light") {
    return "light";
  }
  return matchMedia(DARK_SCHEME).matches ? "dark" : "light";
};

// =============================================================================
// Controls
// =============================================================================

/** Zooms in or out a step. */
export const mapZoomBy = (map: MapInstance | null, delta: number) => {
  map?.zoomTo(map.getZoom() + delta, { duration: mapStepDuration() });
};

/** Turns the map back to north and looks straight down. */
export const mapResetNorth = (map: MapInstance | null) => {
  map?.resetNorthPitch({ duration: mapStepDuration() });
};

/** Calls `listener` with whether the map is zoomed all the way in (or out), now and as it zooms. */
export const mapWatchZoomLimit = (
  map: MapInstance | null,
  direction: "in" | "out",
  listener: (atLimit: boolean) => void
) => {
  if (!map) {
    return;
  }
  const check = () =>
    listener(
      direction === "in"
        ? map.getZoom() >= map.getMaxZoom()
        : map.getZoom() <= map.getMinZoom()
    );
  check();
  map.on("zoom", check);
  return () => {
    map.off("zoom", check);
  };
};

/** Calls `listener` with the map's bearing and pitch, now and as they change. */
export const mapWatchRotation = (
  map: MapInstance | null,
  listener: (bearing: number, pitch: number) => void
) => {
  if (!map) {
    return;
  }
  const turn = () => listener(map.getBearing(), map.getPitch());
  turn();
  map.on("rotate", turn);
  map.on("pitch", turn);
  return () => {
    map.off("rotate", turn);
    map.off("pitch", turn);
  };
};

/** Asks for the device's position, then flies there. */
export const mapLocate = (
  map: MapInstance | null,
  zoom = 14
): Promise<MapLngLat> =>
  new Promise((resolve, reject) => {
    if (!(map && "geolocation" in navigator)) {
      reject(new Error("Geolocation isn't available."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.flyTo({
          center: [longitude, latitude],
          duration: mapStepDuration(1500),
          zoom: Math.max(map.getZoom(), zoom),
        });
        resolve({ latitude, longitude });
      },
      reject,
      // Without one the spec waits forever, and a dismissed prompt would
      // leave the button busy.
      { timeout: 10_000 }
    );
  });

// =============================================================================
// Layers
// =============================================================================

export interface MapRouteOptions {
  active: boolean;
  beforeId?: string;
  color: string;
  coordinates: MapCoordinate[];
  dashArray?: [number, number];
  interactive: boolean;
  onClick?: () => void;
  onHoverChange?: (hovered: boolean) => void;
  opacity: number;
  progress?: number;
  width: number;
}

export interface MapRouteProgressOptions {
  color?: string;
  dashArray?: [number, number];
  opacity?: number;
  width?: number;
}

export interface MapRouteLayer {
  /** The traveled part, drawn over the route. Returns its update and removal. */
  addProgress: (options: MapRouteProgressOptions) => {
    remove: () => void;
    update: (options: MapRouteProgressOptions) => void;
  };
  remove: () => void;
  update: (options: MapRouteOptions) => void;
}

/** A line along coordinates, with an optional traveled part over it. */
export const addMapRoute = (
  controller: MapController | null,
  initial: MapRouteOptions
): MapRouteLayer | null => {
  if (!controller) {
    return null;
  }
  let options = initial;
  const source = uid("map-route-source");
  const layer = uid("map-route");
  const owned = [layer];
  const progressLayers: {
    layer: string;
    options: MapRouteProgressOptions;
    source: string;
  }[] = [];
  let measure = measureRoute(options.coordinates);
  let measuredKey = keyOf(options.coordinates);
  /** What the lines' data holds: the route's points, and its progress. */
  let syncedKey = measuredKey;
  let syncedProgress = options.progress;
  let hovered = false;
  let lastLayerSet = "";

  /** A line's paint; `dasharray` unset where there's none, so an update clears it. */
  const linePaint = (
    color: string,
    width: number,
    opacity: number,
    dashArray?: [number, number]
  ): Record<string, unknown> => ({
    "line-color": controller.resolveColor(color),
    "line-dasharray": dashArray,
    "line-opacity": opacity,
    "line-width": width,
  });
  /** The same, for `addLayer`, which takes no unset values. */
  const defined = (paint: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(paint).filter(([, value]) => value !== undefined)
    );

  const traveled = () =>
    options.progress === undefined
      ? []
      : sliceAtFraction(options.coordinates, measure, options.progress);

  const progressPaint = (progress: MapRouteProgressOptions) =>
    linePaint(
      progress.color ?? options.color,
      progress.width ?? options.width,
      progress.opacity ?? options.opacity,
      progress.dashArray
    );

  const addLine = (
    map: MapLibreMap,
    id: string,
    sourceId: string,
    data: MapCoordinate[],
    paint: Record<string, unknown>
  ) => {
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { data: emptyLine(data), type: "geojson" });
    }
    if (!map.getLayer(id)) {
      map.addLayer(
        {
          id,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: defined(paint),
          source: sourceId,
          type: "line",
        },
        beforeOf(map, options.beforeId)
      );
    }
  };

  const onClick = () => options.onClick?.();
  const onEnter = () => {
    hovered = true;
    controller.setCursor(layer, "pointer");
    options.onHoverChange?.(true);
  };
  const onLeave = () => {
    hovered = false;
    controller.setCursor(layer, null);
    options.onHoverChange?.(false);
  };

  // The active route sits over its siblings: raised whenever layers come or go.
  const raise = () => {
    const { map } = controller.snapshot();
    if (!(map && options.active)) {
      return;
    }
    const order = map.getLayersOrder();
    const layerSet = [...order].sort().join("|");
    if (layerSet === lastLayerSet) {
      return;
    }
    lastLayerSet = layerSet;
    const mine = owned.filter((id) => map.getLayer(id));
    const before = beforeOf(map, options.beforeId);
    const limit = before ? order.indexOf(before) : order.length;
    const top = order.slice(Math.max(0, limit - mine.length), limit);
    if (mine.every((id, index) => top[index] === id)) {
      return;
    }
    for (const id of mine) {
      map.moveLayer(id, before);
    }
  };

  const bind = (map: MapLibreMap) => {
    map.off("click", layer, onClick);
    map.off("mouseenter", layer, onEnter);
    map.off("mouseleave", layer, onLeave);
    if (options.interactive) {
      map.on("click", layer, onClick);
      map.on("mouseenter", layer, onEnter);
      map.on("mouseleave", layer, onLeave);
    }
  };

  const remove = controller.addLayer({
    mount: (map) => {
      syncedKey = measuredKey;
      syncedProgress = options.progress;
      addLine(
        map,
        layer,
        source,
        options.coordinates,
        linePaint(
          options.color,
          options.width,
          options.opacity,
          options.dashArray
        )
      );
      for (const progress of progressLayers) {
        addLine(
          map,
          progress.layer,
          progress.source,
          traveled(),
          progressPaint(progress.options)
        );
      }
      bind(map);
      lastLayerSet = "";
      map.on("styledata", raise);
      raise();
    },
    repaint: (map) => {
      setPaint(
        map,
        layer,
        linePaint(
          options.color,
          options.width,
          options.opacity,
          options.dashArray
        )
      );
      for (const progress of progressLayers) {
        setPaint(map, progress.layer, progressPaint(progress.options));
      }
    },
    unmount: (map) => {
      map.off("styledata", raise);
      map.off("click", layer, onClick);
      map.off("mouseenter", layer, onEnter);
      map.off("mouseleave", layer, onLeave);
      if (hovered) {
        onLeave();
      }
      for (const progress of progressLayers) {
        removeLayers(map, [progress.layer], progress.source);
      }
      removeLayers(map, [layer], source);
    },
  });

  /**
   * The lines' data, set again only when it changed: `setData` sends the
   * line to MapLibre's worker to be cut into tiles again, and the route
   * updates on every render of the app round it.
   */
  const sync = (map: MapLibreMap, route: boolean, progress: boolean) => {
    if (route) {
      (map.getSource(source) as GeoJSONSource | undefined)?.setData(
        emptyLine(options.coordinates)
      );
    }
    if (route || progress) {
      for (const line of progressLayers) {
        (map.getSource(line.source) as GeoJSONSource | undefined)?.setData(
          emptyLine(traveled())
        );
      }
    }
  };

  return {
    addProgress: (initialProgress) => {
      const progress = {
        layer: uid("map-route-progress"),
        options: initialProgress,
        source: uid("map-route-progress-source"),
      };
      progressLayers.push(progress);
      owned.push(progress.layer);
      const { map } = controller.snapshot();
      if (map?.getSource(source)) {
        addLine(
          map,
          progress.layer,
          progress.source,
          traveled(),
          progressPaint(progress.options)
        );
        lastLayerSet = "";
        raise();
      }
      return {
        remove: () => {
          const index = progressLayers.indexOf(progress);
          if (index !== -1) {
            progressLayers.splice(index, 1);
          }
          owned.splice(owned.indexOf(progress.layer), 1);
          const { map: current } = controller.snapshot();
          if (current) {
            removeLayers(current, [progress.layer], progress.source);
          }
        },
        update: (next) => {
          progress.options = next;
          const { map: current } = controller.snapshot();
          if (current) {
            setPaint(current, progress.layer, progressPaint(next));
          }
        },
      };
    },
    remove,
    update: (next) => {
      const previous = options;
      options = next;
      // The same array isn't read again; another one is, by its points.
      if (next.coordinates !== previous.coordinates) {
        const key = keyOf(next.coordinates);
        if (key !== measuredKey) {
          measuredKey = key;
          measure = measureRoute(next.coordinates);
        }
      }
      const { map } = controller.snapshot();
      if (!map?.getLayer(layer)) {
        return;
      }
      const routeChanged = syncedKey !== measuredKey;
      const progressChanged = syncedProgress !== next.progress;
      syncedKey = measuredKey;
      syncedProgress = next.progress;
      sync(map, routeChanged, progressChanged);
      setPaint(
        map,
        layer,
        linePaint(next.color, next.width, next.opacity, next.dashArray)
      );
      for (const progress of progressLayers) {
        setPaint(map, progress.layer, progressPaint(progress.options));
      }
      if (previous.interactive !== next.interactive) {
        bind(map);
      }
      if (next.active && !previous.active) {
        lastLayerSet = "";
        raise();
      }
    },
  };
};

export interface MapGeoJSONOptions {
  beforeId?: string;
  circleHoverPaint?: MapCirclePaint;
  /** Points' paint, or `false` for none. */
  circlePaint?: MapCirclePaint | false;
  data: MapGeoJSONData;
  fillHoverPaint?: MapFillPaint;
  /** Polygons' fill, or `false` for none. */
  fillPaint?: MapFillPaint | false;
  interactive: boolean;
  /** Paint for the line or outline under the pointer (needs feature ids). */
  lineHoverPaint?: MapLinePaint;
  /** Lines' and outlines' paint, or `false` for none. */
  linePaint?: MapLinePaint | false;
  onFeatureClick?: (event: MapFeatureEvent) => void;
  onFeatureHover?: (event: MapFeatureEvent | null) => void;
  /** The property that is each feature's id: hover needs one. */
  promoteId?: string;
}

const POLYGONS = [
  "match",
  ["geometry-type"],
  ["Polygon", "MultiPolygon"],
  true,
  false,
];
const NOT_POINTS = [
  "match",
  ["geometry-type"],
  ["Point", "MultiPoint"],
  false,
  true,
];
const POINTS = [
  "match",
  ["geometry-type"],
  ["Point", "MultiPoint"],
  true,
  false,
];

/** Any GeoJSON as fills, lines and points, each feature answering the pointer. */
export const addMapGeoJSON = (
  controller: MapController | null,
  initial: MapGeoJSONOptions
) => {
  if (!controller) {
    return null;
  }
  let options = initial;
  const source = uid("map-geojson-source");
  const fill = uid("map-geojson-fill");
  const line = uid("map-geojson-line");
  const circle = uid("map-geojson-circle");
  const cursor = uid("map-geojson");
  let hoveredId: number | string | null = null;
  const dataChanged = changeTracker(options.data);

  const paints = () => ({
    circle:
      options.circlePaint === false
        ? null
        : resolvePaint(
            controller,
            withHover(
              {
                "circle-color": "var(--primary)",
                "circle-radius": 5,
                "circle-stroke-color": "var(--background)",
                "circle-stroke-width": 2,
                ...options.circlePaint,
              },
              options.circleHoverPaint
            )
          ),
    fill:
      options.fillPaint === false
        ? null
        : resolvePaint(
            controller,
            withHover(
              {
                "fill-color": "var(--primary)",
                "fill-opacity": 0.16,
                ...options.fillPaint,
              },
              options.fillHoverPaint
            )
          ),
    line:
      options.linePaint === false
        ? null
        : resolvePaint(
            controller,
            withHover(
              {
                "line-color": "var(--primary)",
                "line-opacity": 0.8,
                "line-width": 1.5,
                ...options.linePaint,
              },
              options.lineHoverPaint
            )
          ),
  });

  const sync = (map: MapLibreMap) => {
    if (!map.getSource(source)) {
      return;
    }
    const before = beforeOf(map, options.beforeId);
    const paint = paints();
    const specs = [
      {
        filter: POLYGONS,
        id: fill,
        paint: paint.fill,
        type: "fill" as const,
      },
      {
        filter: NOT_POINTS,
        id: line,
        paint: paint.line,
        type: "line" as const,
      },
      {
        filter: POINTS,
        id: circle,
        paint: paint.circle,
        type: "circle" as const,
      },
    ];
    for (const spec of specs) {
      if (spec.paint && !map.getLayer(spec.id)) {
        map.addLayer(
          {
            filter: spec.filter,
            id: spec.id,
            paint: spec.paint,
            source,
            type: spec.type,
          } as never,
          before
        );
      } else if (!spec.paint && map.getLayer(spec.id)) {
        map.removeLayer(spec.id);
      } else if (spec.paint) {
        setPaint(map, spec.id, spec.paint);
      }
    }
  };

  const event = (
    feature: RenderedFeature,
    original: MapMouseEvent
  ): MapFeatureEvent => ({
    feature,
    latitude: original.lngLat.lat,
    longitude: original.lngLat.lng,
    originalEvent: original,
  });

  const setHover = (map: MapLibreMap, next: number | string | null) => {
    if (next === hoveredId) {
      return;
    }
    if (hoveredId !== null && map.getSource(source)) {
      map.setFeatureState({ id: hoveredId, source }, { hover: false });
    }
    hoveredId = next;
    if (next !== null && map.getSource(source)) {
      map.setFeatureState({ id: next, source }, { hover: true });
    }
  };

  const featureAt = (map: MapLibreMap, original: MapMouseEvent) => {
    const layersHere = [fill, line, circle].filter((id) => map.getLayer(id));
    return layersHere.length === 0
      ? undefined
      : map.queryRenderedFeatures(original.point, { layers: layersHere })[0];
  };

  let current: RenderedFeature | null = null;
  const onMove = (original: MapMouseEvent) => {
    const { map } = controller.snapshot();
    if (!(map && options.interactive)) {
      return;
    }
    const feature = featureAt(map, original) ?? null;
    const id = feature?.id ?? null;
    controller.setCursor(cursor, feature ? "pointer" : null);
    if (feature && current && id !== null && id === current.id) {
      return;
    }
    if (!(feature || current)) {
      return;
    }
    current = feature;
    setHover(map, id);
    options.onFeatureHover?.(feature ? event(feature, original) : null);
  };
  const onOut = () => {
    const { map } = controller.snapshot();
    controller.setCursor(cursor, null);
    if (map) {
      setHover(map, null);
    }
    if (current) {
      current = null;
      options.onFeatureHover?.(null);
    }
  };
  const onClick = (original: MapMouseEvent) => {
    const { map } = controller.snapshot();
    if (!(map && options.interactive)) {
      return;
    }
    const feature = featureAt(map, original);
    if (feature) {
      options.onFeatureClick?.(event(feature, original));
    }
  };

  const remove = controller.addLayer({
    mount: (map) => {
      if (!map.getSource(source)) {
        map.addSource(source, {
          data: options.data,
          type: "geojson",
          ...(options.promoteId ? { promoteId: options.promoteId } : {}),
        });
      }
      hoveredId = null;
      current = null;
      sync(map);
      map.on("mousemove", onMove);
      map.on("mouseout", onOut);
      map.on("click", onClick);
    },
    repaint: sync,
    unmount: (map) => {
      map.off("mousemove", onMove);
      map.off("mouseout", onOut);
      map.off("click", onClick);
      controller.setCursor(cursor, null);
      removeLayers(map, [circle, line, fill], source);
    },
  });

  return {
    remove,
    update: (next: MapGeoJSONOptions) => {
      options = next;
      const { map } = controller.snapshot();
      if (!map?.getSource(source)) {
        return;
      }
      if (dataChanged(next.data)) {
        (map.getSource(source) as GeoJSONSource).setData(next.data as never);
      }
      sync(map);
      if (!next.interactive) {
        onOut();
      }
    },
  };
};

const resolvePaint = <T extends Record<string, unknown>>(
  controller: MapController,
  paint: T
): T => {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(paint)) {
    out[key] = key.endsWith("-color") ? resolveDeep(controller, value) : value;
  }
  return out as T;
};

const resolveDeep = (controller: MapController, value: unknown): unknown => {
  if (typeof value === "string") {
    return controller.resolveColor(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveDeep(controller, item));
  }
  return value;
};

export interface MapArcOptions {
  beforeId?: string;
  curvature: number;
  data: MapArcDatum[];
  hoverPaint?: MapLinePaint;
  interactive: boolean;
  layout?: MapLineLayout;
  onArcClick?: (event: MapArcEvent) => void;
  onArcHover?: (event: MapArcEvent | null) => void;
  paint?: MapLinePaint;
  samples: number;
}

/** Curved lines between pairs of points, each answering the pointer on a wider, invisible line. */
export const addMapArcs = (
  controller: MapController | null,
  initial: MapArcOptions
) => {
  if (!controller) {
    return null;
  }
  let options = initial;
  const source = uid("map-arc-source");
  const layer = uid("map-arc");
  const hit = uid("map-arc-hit");
  let hoveredId: number | string | null = null;
  let dataKey = "";

  const collection = (): MapGeoJSONFeatureCollection<MapGeoJSONLineString> => ({
    features: options.data.map((arc) => {
      const { from, to, ...properties } = arc;
      return {
        geometry: {
          coordinates: arcCoordinates(
            from,
            to,
            options.curvature,
            options.samples
          ),
          type: "LineString",
        },
        properties,
        type: "Feature",
      };
    }),
    type: "FeatureCollection",
  });

  const paint = () =>
    resolvePaint(
      controller,
      withHover(
        {
          "line-color": "var(--primary)",
          "line-opacity": 0.85,
          "line-width": 2,
          ...options.paint,
        },
        options.hoverPaint
      )
    );
  const hitWidth = () => {
    const width = options.paint?.["line-width"];
    return Math.max((typeof width === "number" ? width : 2) + 8, 12);
  };
  const layout = () => ({
    "line-cap": "round",
    "line-join": "round",
    ...options.layout,
  });

  const findArc = (id: unknown) =>
    id === undefined || id === null
      ? undefined
      : options.data.find((arc) => String(arc.id) === String(id));

  const setHover = (map: MapLibreMap, next: number | string | null) => {
    if (next === hoveredId) {
      return;
    }
    if (hoveredId !== null && map.getSource(source)) {
      map.setFeatureState({ id: hoveredId, source }, { hover: false });
    }
    hoveredId = next;
    if (next !== null && map.getSource(source)) {
      map.setFeatureState({ id: next, source }, { hover: true });
    }
  };

  const onMove = (event: MapLayerMouseEvent) => {
    const { map } = controller.snapshot();
    const id = event.features?.[0]?.id;
    if (!map || id === undefined || id === hoveredId) {
      return;
    }
    setHover(map, id);
    controller.setCursor(layer, "pointer");
    const arc = findArc(id);
    if (arc) {
      options.onArcHover?.({
        arc,
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
        originalEvent: event,
      });
    }
  };
  const onLeave = () => {
    const { map } = controller.snapshot();
    if (map) {
      setHover(map, null);
    }
    controller.setCursor(layer, null);
    options.onArcHover?.(null);
  };
  const onClick = (event: MapLayerMouseEvent) => {
    const arc = findArc(event.features?.[0]?.id);
    if (arc) {
      options.onArcClick?.({
        arc,
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
        originalEvent: event,
      });
    }
  };

  const bind = (map: MapLibreMap) => {
    map.off("mousemove", hit, onMove);
    map.off("mouseleave", hit, onLeave);
    map.off("click", hit, onClick);
    if (options.interactive) {
      map.on("mousemove", hit, onMove);
      map.on("mouseleave", hit, onLeave);
      map.on("click", hit, onClick);
    }
  };

  const remove = controller.addLayer({
    mount: (map) => {
      dataKey = keyOf([options.data, options.curvature, options.samples]);
      if (!map.getSource(source)) {
        map.addSource(source, {
          data: collection(),
          promoteId: "id",
          type: "geojson",
        });
      }
      const before = beforeOf(map, options.beforeId);
      if (!map.getLayer(hit)) {
        map.addLayer(
          {
            id: hit,
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": "rgba(0, 0, 0, 0)",
              "line-width": hitWidth(),
            },
            source,
            type: "line",
          },
          before
        );
      }
      if (!map.getLayer(layer)) {
        map.addLayer(
          {
            id: layer,
            layout: layout() as never,
            paint: paint() as never,
            source,
            type: "line",
          },
          before
        );
      }
      hoveredId = null;
      bind(map);
    },
    repaint: (map) => setPaint(map, layer, paint()),
    unmount: (map) => {
      map.off("mousemove", hit, onMove);
      map.off("mouseleave", hit, onLeave);
      map.off("click", hit, onClick);
      controller.setCursor(layer, null);
      removeLayers(map, [layer, hit], source);
    },
  });

  return {
    remove,
    update: (next: MapArcOptions) => {
      const previous = options;
      options = next;
      const { map } = controller.snapshot();
      if (!map?.getSource(source)) {
        return;
      }
      const key = keyOf([next.data, next.curvature, next.samples]);
      if (key !== dataKey) {
        dataKey = key;
        (map.getSource(source) as GeoJSONSource).setData(collection());
      }
      setPaint(map, layer, paint());
      setLayout(map, layer, layout());
      setPaint(map, hit, { "line-width": hitWidth() });
      if (previous.interactive !== next.interactive) {
        bind(map);
      }
    },
  };
};

export interface MapClusterOptions {
  /** Colors for small, medium and large clusters. */
  clusterColors: [string, string, string];
  clusterMaxZoom: number;
  clusterRadius: number;
  /** Point counts where clusters turn medium, then large. */
  clusterThresholds: [number, number];
  data: MapGeoJSONFeatureCollection<MapGeoJSONPoint> | string;
  /** Called on a cluster; without it, a click zooms into the cluster. */
  onClusterClick?: (
    clusterId: number,
    coordinates: MapCoordinate,
    pointCount: number
  ) => void;
  onPointClick?: (
    feature: MapGeoJSONFeature<MapGeoJSONPoint>,
    coordinates: MapCoordinate
  ) => void;
  pointColor: string;
  /** The count's color. */
  textColor: string;
}

/** Many points grouped into counted circles that split as the map zooms in. */
export const addMapClusters = (
  controller: MapController | null,
  initial: MapClusterOptions
) => {
  if (!controller) {
    return null;
  }
  let options = initial;
  const source = uid("map-cluster-source");
  const clusters = uid("map-clusters");
  const count = uid("map-cluster-count");
  const points = uid("map-cluster-point");
  const dataChanged = changeTracker(options.data);

  const color = (value: string) => controller.resolveColor(value);
  const clusterPaint = () => {
    const [small, medium, large] = options.clusterColors;
    const [mid, high] = options.clusterThresholds;
    return {
      "circle-color": [
        "step",
        ["get", "point_count"],
        color(small),
        mid,
        color(medium),
        high,
        color(large),
      ],
      "circle-opacity": 0.9,
      "circle-radius": ["step", ["get", "point_count"], 18, mid, 24, high, 32],
      "circle-stroke-color": color("var(--background)"),
      "circle-stroke-width": 2,
    };
  };
  const pointPaint = () => ({
    "circle-color": color(options.pointColor),
    "circle-radius": 5,
    "circle-stroke-color": color("var(--background)"),
    "circle-stroke-width": 2,
  });

  const onClusterClick = async (event: MapLayerMouseEvent) => {
    const { map } = controller.snapshot();
    const feature = event.features?.[0];
    if (!(map && feature)) {
      return;
    }
    const clusterId = feature.properties.cluster_id as number;
    const pointCount = feature.properties.point_count as number;
    const coordinates = (feature.geometry as unknown as MapGeoJSONPoint)
      .coordinates as [number, number];
    if (options.onClusterClick) {
      options.onClusterClick(clusterId, coordinates, pointCount);
      return;
    }
    try {
      const zoom = await (
        map.getSource(source) as GeoJSONSource
      ).getClusterExpansionZoom(clusterId);
      map.easeTo({ center: coordinates, duration: mapStepDuration(500), zoom });
    } catch {
      // The layer went (an unmount, a style swap) before the worker answered.
    }
  };
  const onPointClick = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!(options.onPointClick && feature)) {
      return;
    }
    const coordinates = [
      ...(feature.geometry as unknown as MapGeoJSONPoint).coordinates,
    ] as MapCoordinate;
    // The copy of the world the click was on.
    while (Math.abs(event.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += event.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    options.onPointClick(
      feature as unknown as MapGeoJSONFeature<MapGeoJSONPoint>,
      coordinates
    );
  };
  const enterCluster = () => controller.setCursor(clusters, "pointer");
  const leaveCluster = () => controller.setCursor(clusters, null);
  const enterPoint = () => {
    if (options.onPointClick) {
      controller.setCursor(points, "pointer");
    }
  };
  const leavePoint = () => controller.setCursor(points, null);

  const remove = controller.addLayer({
    mount: (map) => {
      if (!map.getSource(source)) {
        map.addSource(source, {
          cluster: true,
          clusterMaxZoom: options.clusterMaxZoom,
          clusterRadius: options.clusterRadius,
          data: options.data,
          type: "geojson",
        });
      }
      if (!map.getLayer(clusters)) {
        map.addLayer({
          filter: ["has", "point_count"],
          id: clusters,
          paint: clusterPaint() as never,
          source,
          type: "circle",
        });
      }
      if (!map.getLayer(count)) {
        map.addLayer({
          filter: ["has", "point_count"],
          id: count,
          layout: {
            "text-allow-overlap": true,
            "text-field": "{point_count_abbreviated}",
            "text-font": labelFontOf(map),
            "text-size": 12,
          },
          paint: { "text-color": color(options.textColor) },
          source,
          type: "symbol",
        });
      }
      if (!map.getLayer(points)) {
        map.addLayer({
          filter: ["!", ["has", "point_count"]],
          id: points,
          paint: pointPaint(),
          source,
          type: "circle",
        });
      }
      map.on("click", clusters, onClusterClick);
      map.on("click", points, onPointClick);
      map.on("mouseenter", clusters, enterCluster);
      map.on("mouseleave", clusters, leaveCluster);
      map.on("mouseenter", points, enterPoint);
      map.on("mouseleave", points, leavePoint);
    },
    repaint: (map) => {
      setPaint(map, clusters, clusterPaint());
      setPaint(map, points, pointPaint());
      setPaint(map, count, { "text-color": color(options.textColor) });
    },
    unmount: (map) => {
      map.off("click", clusters, onClusterClick);
      map.off("click", points, onPointClick);
      map.off("mouseenter", clusters, enterCluster);
      map.off("mouseleave", clusters, leaveCluster);
      map.off("mouseenter", points, enterPoint);
      map.off("mouseleave", points, leavePoint);
      controller.setCursor(clusters, null);
      controller.setCursor(points, null);
      removeLayers(map, [count, points, clusters], source);
    },
  });

  return {
    remove,
    update: (next: MapClusterOptions) => {
      options = next;
      const { map } = controller.snapshot();
      if (!map?.getSource(source)) {
        return;
      }
      if (dataChanged(next.data)) {
        (map.getSource(source) as GeoJSONSource).setData(next.data as never);
      }
      setPaint(map, clusters, clusterPaint());
      setPaint(map, points, pointPaint());
      setPaint(map, count, { "text-color": color(next.textColor) });
    },
  };
};

export interface MapHeatmapOptions {
  beforeId?: string;
  /** From the least density to the most; the theme's chart ramp when not given. */
  colors?: string[];
  data: MapGeoJSONFeatureCollection<MapGeoJSONPoint> | string;
  /** How hot the heat runs: 1 as it is, 2 twice as hot. */
  intensity: number;
  /** Past this zoom the heat fades out and its points show instead; none when not given. */
  maxZoom?: number;
  opacity: number;
  /** Each point's reach, in pixels at zoom 10 (half at 5, twice at 15). */
  radius: number;
  weightMax: number;
  /** The property each point is weighted by, from 0 to `weightMax`. */
  weightProperty?: string;
}

/** The theme's chart colors, a light-to-dark ramp in every preset. */
const CHART_RAMP = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const RGB_CHANNELS = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/;

/** A color's luminance, 0 to 1, from the `rgb()` the colors resolve to. */
const luminanceOf = (rgb: string) => {
  const match = rgb.match(RGB_CHANNELS);
  if (!match) {
    return 0.5;
  }
  const [, r, g, b] = match.map(Number);
  return (0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0)) / 255;
};

/**
 * Density as heat: points blur into a ramp of colors, hottest where they
 * crowd, and give way to the points themselves as the map zooms in. The
 * default ramp is the theme's chart colors, its far end from the
 * background where the points crowd most, so the heat reads on the light
 * basemap and the dark one alike.
 */
export const addMapHeatmap = (
  controller: MapController | null,
  initial: MapHeatmapOptions
) => {
  if (!controller) {
    return null;
  }
  let options = initial;
  const source = uid("map-heatmap-source");
  const heat = uid("map-heatmap");
  const points = uid("map-heatmap-point");
  const dataChanged = changeTracker(options.data);

  const ramp = () => {
    const resolved = (options.colors ?? CHART_RAMP).map((value) =>
      controller.resolveColor(value)
    );
    if (options.colors) {
      return resolved;
    }
    // The end nearest the background is the coolest.
    const ground = luminanceOf(controller.resolveColor("var(--background)"));
    const first = Math.abs(luminanceOf(resolved[0] ?? "") - ground);
    const last = Math.abs(luminanceOf(resolved.at(-1) ?? "") - ground);
    return first <= last ? resolved : [...resolved].reverse();
  };
  /** The coolest color with no alpha: the heat fades in from nothing. */
  const transparent = (rgb: string) => {
    const match = rgb.match(RGB_CHANNELS);
    return match
      ? `rgba(${match[1]}, ${match[2]}, ${match[3]}, 0)`
      : "rgba(0, 0, 0, 0)";
  };

  const weight = () =>
    options.weightProperty
      ? [
          "interpolate",
          ["linear"],
          ["coalesce", ["to-number", ["get", options.weightProperty]], 0],
          0,
          0,
          options.weightMax,
          1,
        ]
      : 1;

  const heatPaint = () => {
    const colors = ramp();
    const stops: unknown[] = [0, transparent(colors[0] ?? "rgb(0, 0, 0)")];
    colors.forEach((color, index) => {
      stops.push(0.15 + (0.85 * index) / Math.max(1, colors.length - 1), color);
    });
    const fade =
      options.maxZoom === undefined
        ? options.opacity
        : [
            "interpolate",
            ["linear"],
            ["zoom"],
            options.maxZoom - 1,
            options.opacity,
            options.maxZoom,
            0,
          ];
    return {
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        ...stops,
      ],
      "heatmap-intensity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        0,
        options.intensity * 0.5,
        12,
        options.intensity * 1.5,
      ],
      "heatmap-opacity": fade,
      "heatmap-radius": [
        "interpolate",
        ["exponential", 2],
        ["zoom"],
        0,
        options.radius / 4,
        5,
        options.radius / 2,
        10,
        options.radius,
        15,
        options.radius * 2,
      ],
      "heatmap-weight": weight(),
    };
  };

  const pointPaint = () => {
    const colors = ramp();
    const hottest = colors.at(-1) ?? "rgb(0, 0, 0)";
    const maxZoom = options.maxZoom ?? 24;
    return {
      "circle-color": hottest,
      "circle-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        maxZoom - 1,
        0,
        maxZoom,
        1,
      ],
      "circle-radius": options.weightProperty
        ? [
            "interpolate",
            ["linear"],
            ["coalesce", ["to-number", ["get", options.weightProperty]], 0],
            0,
            3,
            options.weightMax,
            8,
          ]
        : 4,
      "circle-stroke-color": controller.resolveColor("var(--background)"),
      "circle-stroke-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        maxZoom - 1,
        0,
        maxZoom,
        1,
      ],
      "circle-stroke-width": 1.5,
    };
  };

  const sync = (map: MapLibreMap) => {
    setPaint(map, heat, heatPaint());
    if (options.maxZoom === undefined) {
      removeLayers(map, [points]);
      return;
    }
    const shown = map.getLayer(points);
    if (shown) {
      setPaint(map, points, pointPaint());
      if (shown.minzoom !== options.maxZoom - 1) {
        map.setLayerZoomRange(points, options.maxZoom - 1, 24);
      }
    } else {
      map.addLayer(
        {
          id: points,
          minzoom: options.maxZoom - 1,
          paint: pointPaint() as never,
          source,
          type: "circle",
        },
        beforeOf(map, options.beforeId)
      );
    }
  };

  const remove = controller.addLayer({
    mount: (map) => {
      if (!map.getSource(source)) {
        map.addSource(source, { data: options.data as never, type: "geojson" });
      }
      if (!map.getLayer(heat)) {
        map.addLayer(
          {
            id: heat,
            paint: heatPaint() as never,
            source,
            type: "heatmap",
          },
          beforeOf(map, options.beforeId)
        );
      }
      sync(map);
    },
    repaint: sync,
    unmount: (map) => removeLayers(map, [points, heat], source),
  });

  return {
    remove,
    update: (next: MapHeatmapOptions) => {
      options = next;
      const { map } = controller.snapshot();
      if (!map?.getSource(source)) {
        return;
      }
      if (dataChanged(next.data)) {
        (map.getSource(source) as GeoJSONSource).setData(next.data as never);
      }
      sync(map);
    },
  };
};

/** Room round what the camera frames, in pixels: one number for every side, or each side. */
export type MapPadding =
  | number
  | {
      bottom?: number;
      /** The side the line ends on: the right, or the left in RTL. */
      end?: number;
      left?: number;
      right?: number;
      /** The side the line starts on: the left, or the right in RTL. */
      start?: number;
      top?: number;
    };

export interface MapCameraOptions {
  bearing?: number;
  /** Frames these corners, `[[west, south], [east, north]]`, instead of `center` and `zoom`. */
  bounds?: [MapCoordinate, MapCoordinate];
  center?: MapCoordinate;
  /** How long a move takes, in ms; 0 where motion is reduced. */
  duration: number;
  /** The closest it comes when framing `bounds`, and the zoom for `bounds` round a single point. */
  maxZoom?: number;
  /** Room round what it frames. */
  padding: MapPadding;
  pitch?: number;
  /** A new value aims again at the same place (after the visitor moved away). */
  revision?: number | string;
  zoom?: number;
}

/**
 * Each side's room in pixels. `start` and `end` follow the map's direction
 * (a card floating at the start of an RTL page sits on the right), and win
 * over `left` and `right`.
 */
const paddingOf = (padding: MapPadding, rtl = false) => {
  if (typeof padding === "number") {
    return { bottom: padding, left: padding, right: padding, top: padding };
  }
  const { end, start } = padding;
  return {
    bottom: padding.bottom ?? 0,
    left: (rtl ? end : start) ?? padding.left ?? 0,
    right: (rtl ? start : end) ?? padding.right ?? 0,
    top: padding.top ?? 0,
  };
};

/**
 * The canvas size MapLibre frames with (its camera's), which lags the box
 * until MapLibre's own resize: a box laid out after the map was made has a
 * size its camera doesn't know yet.
 */
const canvasSize = (map: MapLibreMap) => {
  const { transform } = map as unknown as {
    transform?: { height?: number; width?: number };
  };
  return typeof transform?.width === "number" &&
    typeof transform.height === "number"
    ? { height: transform.height, width: transform.width }
    : {
        height: map.getContainer().clientHeight,
        width: map.getContainer().clientWidth,
      };
};

/**
 * Padding the canvas can hold, round the map's own (`setPadding`): on a
 * small box (a phone) each side shrinks so the sides take at most four
 * fifths of it (a hero may pad most of the map), and MapLibre never finds no
 * room to frame in.
 */
const paddingFor = (
  map: MapLibreMap,
  size: { height: number; width: number },
  padding: MapPadding
) => {
  const sides = paddingOf(
    padding,
    getComputedStyle(map.getContainer()).direction === "rtl"
  );
  const own = map.getPadding();
  const roomAcross = Math.max(
    0,
    size.width - (own.left ?? 0) - (own.right ?? 0)
  );
  const roomDown = Math.max(
    0,
    size.height - (own.top ?? 0) - (own.bottom ?? 0)
  );
  const across = Math.min(
    1,
    (roomAcross * 0.8) / (sides.left + sides.right || 1)
  );
  const down = Math.min(1, (roomDown * 0.8) / (sides.top + sides.bottom || 1));
  return {
    bottom: Math.floor(sides.bottom * down),
    left: Math.floor(sides.left * across),
    right: Math.floor(sides.right * across),
    top: Math.floor(sides.top * down),
  };
};

/** A camera MapLibre can take: no NaN from a box without a size. */
const finiteCamera = (camera: { center?: unknown; zoom?: number }): boolean => {
  if (camera.zoom !== undefined && !Number.isFinite(camera.zoom)) {
    return false;
  }
  const center = camera.center as
    | { lat: number; lng: number }
    | [number, number]
    | undefined;
  if (!center) {
    return true;
  }
  const [lng, lat] = Array.isArray(center) ? center : [center.lng, center.lat];
  return Number.isFinite(lng) && Number.isFinite(lat);
};

/** Bounds round one point (a list of one place): nothing to fit, a center. */
const pointOf = (bounds: [MapCoordinate, MapCoordinate]) => {
  const [[west, south], [east, north]] = bounds;
  return west === east && south === north ? bounds[0] : null;
};

/** Where a camera aim puts the map: its bounds framed, or its center and zoom. */
const cameraFor = (map: MapLibreMap, options: MapCameraOptions) => {
  const size = canvasSize(map);
  if (size.width === 0 || size.height === 0) {
    return null;
  }
  const padding = paddingFor(map, size, options.padding);
  const turn = {
    ...(options.bearing === undefined ? {} : { bearing: options.bearing }),
    ...(options.pitch === undefined ? {} : { pitch: options.pitch }),
  };
  const point = options.bounds ? pointOf(options.bounds) : null;
  if (options.bounds && !point) {
    // An unset maxZoom must stay out: MapLibre's own default would be lost.
    const frame = map.cameraForBounds(options.bounds, {
      ...turn,
      ...(options.maxZoom === undefined ? {} : { maxZoom: options.maxZoom }),
      padding,
    });
    return frame ? { ...frame, ...turn } : null;
  }
  const center = point ?? options.center;
  const zoom = point ? (options.maxZoom ?? map.getZoom()) : options.zoom;
  // The center in the middle of the room the padding leaves, as an offset:
  // `padding` itself would stay on the map's camera after the move, and
  // shift every later one (the zoom buttons', the visitor's).
  const offset: [number, number] = [
    (padding.left - padding.right) / 2,
    (padding.top - padding.bottom) / 2,
  ];
  return {
    ...turn,
    ...(center ? { center, offset } : {}),
    ...(zoom === undefined ? {} : { zoom }),
  };
};

/**
 * A camera the app aims: where it says when it starts, and a flight to
 * each new aim after (a list's choice, a filter's matches). Moves the
 * visitor makes in between stay until the aim changes.
 */
export const addMapCamera = (
  controller: MapController | null,
  initial: MapCameraOptions
) => {
  if (!controller) {
    return null;
  }
  const aimOf = (options: MapCameraOptions) =>
    keyOf([
      options.bounds,
      options.center,
      options.zoom,
      options.bearing,
      options.pitch,
      options.padding,
      options.maxZoom,
      options.revision,
    ]);
  let aim = "";

  let latest = initial;
  /** The camera is moving the map itself (not the visitor, not a control). */
  let ours = false;
  /** Takes back a move waiting for the box to have a size. */
  let waiting: (() => void) | null = null;

  const move = (options: MapCameraOptions, animate: boolean) => {
    const { map } = controller.snapshot();
    if (!map) {
      return;
    }
    aim = aimOf(options);
    waiting?.();
    waiting = null;
    // Aimed again, at once, on MapLibre's next resize: when its canvas has
    // no size yet, or not yet the box's (laid out after the map was made).
    const again = () => {
      const retry = () => {
        waiting = null;
        move(latest, false);
      };
      map.once("resize", retry);
      waiting = () => map.off("resize", retry);
    };
    // The box has a new size MapLibre hasn't taken yet (a breakpoint just
    // changed the padding too): framing now would measure the old canvas.
    const before = canvasSize(map);
    const box = map.getContainer();
    if (
      Math.abs(before.width - box.clientWidth) > 1 ||
      Math.abs(before.height - box.clientHeight) > 1
    ) {
      // The box observer resizes the map; `again` aims on that resize.
      again();
      return;
    }
    let camera: ReturnType<typeof cameraFor> = null;
    try {
      camera = cameraFor(map, options);
    } catch {
      camera = null;
    }
    if (!(camera && finiteCamera(camera))) {
      again();
      return;
    }
    const duration = animate ? mapStepDuration(options.duration) : 0;
    // MapLibre's `movestart` fires within these calls: a move of ours.
    ours = true;
    if (duration === 0) {
      // `easeTo` at 0 ms moves at once, as `jumpTo` does, and takes an offset.
      map.easeTo({ ...camera, duration: 0 });
    } else {
      map.flyTo({ ...camera, duration, essential: true });
    }
    ours = false;
  };

  move(initial, false);

  // The aim holds through a resize (a window resized, a phone turned, a
  // panel opened beside the map) until anything else moves the map (the
  // visitor, a zoom button): then that view stays until the next aim.
  let held = true;
  const onMoveStart = () => {
    if (!ours) {
      held = false;
    }
  };
  const onResize = () => {
    if (held && !waiting) {
      move(latest, false);
    }
  };
  const { map: bound } = controller.snapshot();
  bound?.on("movestart", onMoveStart);
  bound?.on("resize", onResize);

  return {
    remove: () => {
      waiting?.();
      waiting = null;
      bound?.off("movestart", onMoveStart);
      bound?.off("resize", onResize);
    },
    update: (next: MapCameraOptions) => {
      latest = next;
      if (aimOf(next) !== aim) {
        held = true;
        move(next, true);
      }
    },
  };
};
