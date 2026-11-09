"use client";

import {
  LocateFixedIcon,
  MaximizeIcon,
  MinimizeIcon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import {
  type ComponentProps,
  type CSSProperties,
  createContext,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Spinner } from "@/components/ui/spinner";
import {
  addMapArcs,
  addMapCamera,
  addMapClusters,
  addMapGeoJSON,
  addMapHeatmap,
  addMapRoute,
  createMapController,
  type MapAnchor,
  type MapArcDatum,
  type MapArcEvent,
  type MapBasemap,
  type MapCirclePaint,
  type MapController,
  type MapCoordinate,
  type MapEngineOptions,
  type MapFeatureEvent,
  type MapFillPaint,
  type MapGeoJSONData,
  type MapGeoJSONFeature,
  type MapGeoJSONFeatureCollection,
  type MapGeoJSONPoint,
  type MapInstance,
  type MapLineLayout,
  type MapLinePaint,
  type MapLngLat,
  type MapOverlay,
  type MapPadding,
  type MapProjection,
  type MapRouteAnchor,
  type MapRouteLayer,
  type MapSide,
  type MapSnapshot,
  type MapStyles,
  type MapTheme,
  type MapViewport,
  mapLocate,
  mapResetNorth,
  mapRoutePoint,
  mapWatchRotation,
  mapWatchZoomLimit,
  mapZoomBy,
} from "@/lib/map-runtime";

export type {
  MapAnchor,
  MapArcDatum,
  MapArcEvent,
  MapBasemap,
  MapCirclePaint,
  MapController,
  MapCoordinate,
  MapEngineOptions,
  MapFeatureEvent,
  MapFillPaint,
  MapGeoJSONData,
  MapGeoJSONFeature,
  MapGeoJSONFeatureCollection,
  MapGeoJSONGeometry,
  MapGeoJSONLineString,
  MapGeoJSONPoint,
  MapGeoJSONPosition,
  MapInstance,
  MapLineLayout,
  MapLinePaint,
  MapLngLat,
  MapPadding,
  MapProjection,
  MapRouteAnchor,
  MapSide,
  MapStyles,
  MapTheme,
  MapViewport,
} from "@/lib/map-runtime";

interface MapContextValue {
  controller: MapController | null;
  map: MapInstance | null;
  /** The style has drawn: sources and layers can go on. */
  ready: boolean;
  theme: MapTheme;
}

const MapContext = createContext<MapContextValue>({
  controller: null,
  map: null,
  ready: false,
  theme: "light",
});

/**
 * The map inside `MapView`: `map`, MapLibre's map once it exists (`null`
 * before), `ready` once its style has drawn (and again after each theme's
 * basemap swap), the `theme` its basemap follows, and `controller`, the
 * engine the parts are drawn with (`resolveColor` turns a theme variable
 * into a color MapLibre can paint).
 */
export const useMap = () => useContext(MapContext);

export interface MapViewProps extends ComponentProps<"div"> {
  /** `theme` draws the basemap in your theme's colors (land, water, roads and labels from its background, muted and foreground tokens), through dark mode and preset changes; `original` keeps the style's own colors. @default "theme" */
  basemap?: MapBasemap;
  /** A clear basemap with no tiles, for your own layers on the page's ground. @default false */
  blank?: boolean;
  /** Where the camera starts, when `viewport` isn't given. */
  defaultViewport?: Partial<MapViewport>;
  /** Shows the loading indicator over the map, as while it first draws. @default false */
  loading?: boolean;
  /** Called on a click on the map itself (not on a marker or a popup), with where. */
  onMapClick?: (position: MapLngLat) => void;
  /** Called once the map has drawn, with MapLibre's map. */
  onReady?: (map: MapInstance) => void;
  /** Called on every frame the camera moves. */
  onViewportChange?: (viewport: MapViewport) => void;
  /** Called when the camera comes to rest. */
  onViewportChangeEnd?: (viewport: MapViewport) => void;
  /** MapLibre's own options, such as `minZoom`, `maxBounds` or `cooperativeGestures`. */
  options?: MapEngineOptions;
  /** `mercator` (flat) or `globe`. @default "mercator" */
  projection?: MapProjection;
  /** The basemap for each theme, a style URL or object. CARTO Positron and Dark Matter by default. */
  styles?: MapStyles;
  /** The basemap's theme; followed from the page when not given. */
  theme?: MapTheme;
  /** The camera, held where you say (with `onViewportChange`). */
  viewport?: Partial<MapViewport>;
}

/**
 * A MapLibre map that follows the page's theme. Its markers, popups,
 * layers and controls are its children; they render once the map exists,
 * on the client.
 */
export const MapView = (props: MapViewProps) => {
  const {
    basemap = "theme",
    blank = false,
    children,
    className,
    defaultViewport,
    loading = false,
    onMapClick,
    onReady,
    onViewportChange,
    onViewportChangeEnd,
    options,
    projection,
    styles,
    theme,
    viewport,
    ...rest
  } = props;
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [controller, setController] = useState<MapController | null>(null);
  const [snapshot, setSnapshot] = useState<MapSnapshot | null>(null);
  const settings = {
    basemap,
    blank,
    defaultViewport,
    onClick: onMapClick,
    onReady,
    onViewportChange,
    onViewportChangeEnd,
    options,
    projection,
    styles,
    theme,
    viewport,
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: built once; later props go through `update`.
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!(root && canvas)) {
      return;
    }
    const next = createMapController(root, canvas, settings, setSnapshot);
    setController(next);
    return () => {
      next.destroy();
      setController(null);
      setSnapshot(null);
    };
  }, []);

  useEffect(() => {
    controller?.update(settings);
  });

  const status = snapshot?.status ?? "loading";
  return (
    <MapContext.Provider
      value={{
        controller,
        map: snapshot?.map ?? null,
        ready: snapshot?.ready ?? false,
        theme: snapshot?.theme ?? "light",
      }}
    >
      <div
        className={cn(
          "relative isolate h-96 w-full overflow-clip bg-muted text-foreground has-[.maplibregl-canvas:focus-visible]:ring-[3px] has-[.maplibregl-canvas:focus-visible]:ring-ring/50",
          className
        )}
        data-slot="map"
        data-state={status}
        {...rest}
        ref={rootRef}
      >
        <div
          className="absolute inset-0 outline-none"
          data-slot="map-canvas"
          ref={canvasRef}
        />
        {snapshot?.map ? children : null}
        {loading || status === "loading" ? (
          <div
            className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-background/40 backdrop-blur-[2px]"
            data-slot="map-loader"
          >
            <Spinner
              aria-label="Loading map"
              className="size-5 text-muted-foreground motion-reduce:animate-none"
            />
          </div>
        ) : null}
        {status === "error" ? (
          <div
            className="absolute inset-0 z-40 flex items-center justify-center p-6 text-center text-muted-foreground text-sm"
            data-slot="map-error"
            role="alert"
          >
            The map couldn't load. It needs WebGL2 and a connection to its map
            tiles.
          </div>
        ) : null}
      </div>
    </MapContext.Provider>
  );
};

// =============================================================================
// Markers
// =============================================================================

interface MarkerContextValue {
  draggable: boolean;
  /** A popup is among the marker's parts: its content opens it. */
  hasPopup: boolean;
  /** A tooltip is among the marker's parts: its content is described by it. */
  hasTooltip: boolean;
  label: string | undefined;
  open: boolean;
  overlay: MapOverlay | null;
  popupId: string;
  setOpen: (open: boolean) => void;
  tooltipId: string;
}

const MarkerContext = createContext<MarkerContextValue>({
  draggable: false,
  hasPopup: false,
  hasTooltip: false,
  label: undefined,
  open: false,
  overlay: null,
  popupId: "",
  setOpen: () => undefined,
  tooltipId: "",
});

export interface MapMarkerProps extends ComponentProps<"div"> {
  /** Which point of the marker sits on its coordinate. @default "center" */
  anchor?: MapAnchor;
  /** Whether its popup starts open. @default false */
  defaultOpen?: boolean;
  /** Drag it with a pointer, or move it with the arrow keys once focused. @default false */
  draggable?: boolean;
  /** Its name for assistive tech, such as the place it marks. */
  label?: string;
  /** Where it stands: degrees north (negative for south). */
  latitude: number;
  /** Where it stands: degrees east (negative for west). */
  longitude: number;
  /** Pixels from the anchor, `[x, y]`. */
  offset?: [number, number];
  /** Called when its popup opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Called as a drag moves it. */
  onPositionChange?: (position: MapLngLat) => void;
  /** Called where a drag (or an arrow key) leaves it. */
  onPositionChangeEnd?: (position: MapLngLat) => void;
  /** Whether its popup is open. */
  open?: boolean;
  /** Turns its content, in degrees clockwise, round its anchor: a heading, the way a vehicle faces. */
  rotation?: number;
  /** `map` turns it with the map, as a heading on the ground does; `viewport` keeps it as it is on the screen. @default "viewport" */
  rotationAlignment?: "map" | "viewport";
}

/**
 * Your element on a coordinate, kept there as the map moves and hidden
 * behind the globe. It holds the marker's parts: its content, a tooltip,
 * a popup, a label.
 */
export const MapMarker = (props: MapMarkerProps) => {
  const {
    anchor = "center",
    children,
    className,
    defaultOpen = false,
    draggable = false,
    label,
    latitude,
    longitude,
    offset,
    onOpenChange,
    onPositionChange,
    onPositionChangeEnd,
    open: openProp,
    rotation,
    rotationAlignment = "viewport",
    ...rest
  } = props;
  const context = useContext(MapContext);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const [overlay, setOverlay] = useState<MapOverlay | null>(null);
  const [openState, setOpenState] = useState(defaultOpen);
  const [hasPopup, setHasPopup] = useState(false);
  const [hasTooltip, setHasTooltip] = useState(false);
  const open = (openProp ?? openState) && hasPopup;
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };
  const settings = {
    anchor,
    draggable,
    latitude,
    longitude,
    offset,
    onDrag: onPositionChange,
    onDragEnd: onPositionChangeEnd,
    rotation,
    rotationAlignment,
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: placed once; later props go through `update`.
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const next = context.controller?.addOverlay(element, settings);
    if (!next) {
      return;
    }
    setOverlay(next);
    return () => {
      next.remove();
      setOverlay(null);
    };
  }, [context.controller]);

  useEffect(() => {
    overlay?.update(settings);
  });

  // Which parts it has, read from its own elements, as they come and go.
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const read = () => {
      setHasPopup(
        element.querySelector('[data-slot="map-marker-popup"]') !== null
      );
      setHasTooltip(
        element.querySelector('[data-slot="map-marker-tooltip"]') !== null
      );
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(element, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // An open popup closes on a click on the map, or on Escape, which hands
  // focus back to the marker.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `setOpen` reads the latest props when it runs.
  useEffect(() => {
    const element = ref.current;
    if (!(open && element)) {
      return;
    }
    const close = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.stopPropagation();
      setOpen(false);
      element
        .querySelector<HTMLElement>('[data-slot="map-marker-content"]')
        ?.focus();
    };
    element.addEventListener("keydown", close);
    const stop = context.controller?.onClick(() => setOpen(false));
    return () => {
      element.removeEventListener("keydown", close);
      stop?.();
    };
  }, [open, context.controller]);

  return (
    <MarkerContext.Provider
      value={{
        draggable,
        hasPopup,
        hasTooltip,
        label,
        open,
        overlay,
        popupId: `${id}-popup`,
        setOpen,
        tooltipId: `${id}-tooltip`,
      }}
    >
      <div
        className={cn(
          "group/map-marker invisible absolute top-0 left-0 z-10 hover:z-20 has-focus-visible:z-20 data-[state=open]:z-30 data-dragging:z-30",
          draggable &&
            "cursor-grab touch-none select-none data-dragging:cursor-grabbing",
          className
        )}
        data-slot="map-marker"
        data-state={open ? "open" : "closed"}
        {...rest}
        ref={ref}
      >
        {children}
      </div>
    </MarkerContext.Provider>
  );
};

/** How far each arrow key moves a draggable marker, in pixels (Shift for four times as far). */
const ARROWS: Record<string, [number, number]> = {
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
};
const NUDGE = 10;

/**
 * What the marker shows: your element, or a dot in the primary color.
 * It opens the popup on a click or Enter, and moves a draggable marker
 * with the arrow keys.
 */
export const MapMarkerContent = (props: ComponentProps<"div">) => {
  const { children, className, onClick, onKeyDown, ...rest } = props;
  const marker = useContext(MarkerContext);
  const interactive = marker.hasPopup || marker.draggable;
  // Your handlers run first; `preventDefault()` in one skips the marker's own.
  const toggle = (event: MouseEvent<HTMLDivElement>) => {
    onClick?.(event);
    if (marker.hasPopup && !event.defaultPrevented) {
      marker.setOpen(!marker.open);
    }
  };
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) {
      return;
    }
    if (marker.hasPopup && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      marker.setOpen(!marker.open);
      return;
    }
    const arrow = ARROWS[event.key];
    if (marker.draggable && arrow) {
      event.preventDefault();
      const step = event.shiftKey ? NUDGE * 4 : NUDGE;
      marker.overlay?.nudge(arrow[0] * step, arrow[1] * step);
    }
  };
  let role: "button" | "img" | undefined;
  if (interactive) {
    role = "button";
  } else if (marker.label) {
    role = "img";
  }
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a marker's content is any element; it's a button only when it opens a popup or moves.
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: its handlers act only when it's a button (`role` follows).
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: the popup's aria props are set only when it's a button.
    <div
      aria-controls={marker.open ? marker.popupId : undefined}
      aria-describedby={marker.hasTooltip ? marker.tooltipId : undefined}
      aria-expanded={marker.hasPopup ? marker.open : undefined}
      aria-haspopup={marker.hasPopup ? "dialog" : undefined}
      aria-label={marker.label}
      aria-roledescription={marker.draggable ? "draggable marker" : undefined}
      className={cn(
        "relative flex items-center justify-center rounded-full outline-none [rotate:var(--map-marker-rotation)] [transform-origin:var(--map-marker-origin)] focus-visible:ring-[3px] focus-visible:ring-ring/50",
        marker.hasPopup && "cursor-pointer",
        className
      )}
      data-slot="map-marker-content"
      onClick={toggle}
      onKeyDown={keyDown}
      role={role}
      tabIndex={interactive ? 0 : undefined}
      {...rest}
    >
      {children ?? (
        <span
          className="block size-4 rounded-full border-2 border-background bg-primary shadow-md ring-1 ring-foreground/10"
          data-slot="map-marker-dot"
        />
      )}
    </div>
  );
};

/** Where a tooltip or label sits beside the marker: map sides are physical. */
const SIDE: Record<MapSide, string> = {
  bottom: "top-full left-1/2 mt-(--map-offset) -translate-x-1/2",
  left: "top-1/2 right-full mr-(--map-offset) -translate-y-1/2",
  right: "top-1/2 left-full ml-(--map-offset) -translate-y-1/2",
  top: "bottom-full left-1/2 mb-(--map-offset) -translate-x-1/2",
};

export interface MapMarkerTooltipProps extends ComponentProps<"div"> {
  /** The side of the marker it shows on. @default "top" */
  side?: MapSide;
  /** Pixels between the marker and the tooltip. @default 8 */
  sideOffset?: number;
}

/**
 * A short line over the marker while a pointer rests on it, or while it has
 * keyboard focus (a marker with a popup, or a draggable one). Put the same
 * words in the marker's `label` for keyboard and screen reader users.
 */
export const MapMarkerTooltip = (props: MapMarkerTooltipProps) => {
  const { children, className, side = "top", sideOffset = 8, ...rest } = props;
  const marker = useContext(MarkerContext);
  return (
    <div
      className={cn(
        "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs has-data-[slot=kbd]:pe-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm pointer-events-none absolute w-max max-w-56 bg-foreground text-background opacity-0 transition-opacity duration-150 group-hover/map-marker:opacity-100 group-has-focus-visible/map-marker:opacity-100 group-data-[state=open]/map-marker:hidden group-data-dragging/map-marker:hidden motion-reduce:transition-none",
        SIDE[side],
        className
      )}
      data-side={side}
      data-slot="map-marker-tooltip"
      id={marker.tooltipId}
      role="tooltip"
      style={{ "--map-offset": `${sideOffset}px` } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
};

export interface MapMarkerLabelProps extends ComponentProps<"div"> {
  /** Under the marker or over it. @default "bottom" */
  position?: "bottom" | "top";
}

/** Text that stays beside the marker, haloed so it reads on any basemap. */
export const MapMarkerLabel = (props: MapMarkerLabelProps) => {
  const { children, className, position = "bottom", ...rest } = props;
  return (
    <div
      className={cn(
        "pointer-events-none absolute w-max max-w-40 text-center font-medium text-[0.6875rem] text-foreground leading-tight [text-shadow:0_0_2px_var(--background),0_0_3px_var(--background),0_0_6px_var(--background)]",
        SIDE[position],
        className
      )}
      data-position={position}
      data-slot="map-marker-label"
      style={{ "--map-offset": "4px" } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
};

/** A popup's surface: the popover's look, placed by the map on the side with room. */
const POPUP =
  "bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 flex flex-col gap-2.5 rounded-lg p-2.5 text-sm shadow-md ring-1 duration-100 data-[side=inline-start]:slide-in-from-end-2 data-[side=inline-end]:slide-in-from-start-2 absolute top-0 left-0 w-max max-w-72 outline-none transition-none not-data-placement:invisible data-[placement=bottom]:origin-top data-[placement=left]:origin-right data-[placement=right]:origin-left data-[placement=top]:origin-bottom motion-reduce:animate-none";

/** Room for the close button beside the popup's first line, not its whole height. */
const CLOSE_ROOM = "[&>[data-slot=map-popup-close]+*]:pe-7";

const PopupClose = (props: { onClose: () => void }) => (
  <Button
    aria-label="Close"
    className="absolute end-1.5 top-1.5 opacity-70 hover:opacity-100"
    data-slot="map-popup-close"
    onClick={props.onClose}
    size="icon-xs"
    variant="ghost"
  >
    <XIcon aria-hidden="true" />
  </Button>
);

export interface MapMarkerPopupProps extends ComponentProps<"div"> {
  /** Shows a close button in the corner. @default false */
  closeButton?: boolean;
  /** The side it opens on when there's room; it flips when there isn't. @default "top" */
  side?: MapSide;
  /** Pixels between the marker and the popup. @default 12 */
  sideOffset?: number;
}

/**
 * Details that open from the marker on a click or Enter, and close on
 * Escape, a click on the map, or the close button. Opened from the marker,
 * it takes focus, and Escape hands it back.
 */
export const MapMarkerPopup = (props: MapMarkerPopupProps) => {
  const {
    children,
    className,
    closeButton = false,
    side = "top",
    sideOffset = 12,
    ...rest
  } = props;
  const marker = useContext(MarkerContext);
  const ref = useRef<HTMLDivElement>(null);
  // The close button hands focus back to the marker, as Escape does: closed,
  // the popup takes the focused button with it.
  const close = () => {
    ref.current
      ?.closest('[data-slot="map-marker"]')
      ?.querySelector<HTMLElement>('[data-slot="map-marker-content"]')
      ?.focus();
    marker.setOpen(false);
  };

  useEffect(() => {
    const element = ref.current;
    if (!(marker.open && element)) {
      return;
    }
    const detach = marker.overlay?.attachFloating(element, side, sideOffset);
    // Opened from the marker (a click or Enter): focus follows it in. Open
    // from the start, or from your code, it leaves focus where it is.
    const markerElement = element.closest('[data-slot="map-marker"]');
    if (markerElement?.contains(document.activeElement)) {
      element.focus({ preventScroll: true });
    }
    return () => detach?.();
  }, [marker.open, marker.overlay, side, sideOffset]);

  // Closed, it leaves a placeholder: the marker finds its popup by it.
  if (!marker.open) {
    return <span data-slot="map-marker-popup" data-state="closed" hidden />;
  }
  return (
    <div
      aria-label={marker.label}
      className={cn(POPUP, closeButton && CLOSE_ROOM, className)}
      data-open=""
      data-side={side}
      data-slot="map-marker-popup"
      data-state="open"
      id={marker.popupId}
      role="dialog"
      tabIndex={-1}
      {...rest}
      ref={ref}
    >
      {closeButton ? <PopupClose onClose={close} /> : null}
      {children}
    </div>
  );
};

export interface MapPopupProps extends ComponentProps<"div"> {
  /** Shows a close button in the corner. @default false */
  closeButton?: boolean;
  /** Closes on a click on the map. @default true */
  closeOnClick?: boolean;
  /** Whether it starts open. @default true */
  defaultOpen?: boolean;
  /** Its name for assistive tech. */
  label?: string;
  /** Where it points: degrees north (negative for south). */
  latitude: number;
  /** Where it points: degrees east (negative for west). */
  longitude: number;
  /** Called when it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Whether it's open. */
  open?: boolean;
  /** The side it opens on when there's room; it flips when there isn't. @default "top" */
  side?: MapSide;
  /** Pixels between the point and the popup. @default 8 */
  sideOffset?: number;
}

/**
 * A popup on a coordinate of its own, not a marker's: for a place picked
 * on a layer, or a note at a point. Escape in the map, a click on the map
 * (unless `closeOnClick` is false) or the close button close it. It leaves
 * focus where it is as it opens. For a popup that follows clicks, set
 * `closeOnClick={false}` and drive `open` yourself.
 */
export const MapPopup = (props: MapPopupProps) => {
  const {
    children,
    className,
    closeButton = false,
    closeOnClick = true,
    defaultOpen = true,
    label,
    latitude,
    longitude,
    onOpenChange,
    open: openProp,
    side = "top",
    sideOffset = 8,
    ...rest
  } = props;
  const context = useContext(MapContext);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [overlay, setOverlay] = useState<MapOverlay | null>(null);
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };
  const settings = {
    latitude,
    longitude,
    passThrough: false,
  };
  // The close button hands focus to the map, as Escape does.
  const dismiss = () => {
    if (popupRef.current?.contains(document.activeElement)) {
      context.controller?.root
        .querySelector<HTMLElement>(".maplibregl-canvas")
        ?.focus();
    }
    setOpen(false);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: placed while open; later props go through `update`.
  useEffect(() => {
    const element = anchorRef.current;
    if (!(open && element)) {
      return;
    }
    const next = context.controller?.addOverlay(element, settings);
    if (!next) {
      return;
    }
    setOverlay(next);
    return () => {
      next.remove();
      setOverlay(null);
    };
  }, [open, context.controller]);

  useEffect(() => {
    overlay?.update(settings);
  });

  useEffect(() => {
    const element = popupRef.current;
    if (!element) {
      return;
    }
    const detach = overlay?.attachFloating(element, side, sideOffset);
    return () => detach?.();
  }, [overlay, side, sideOffset]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `setOpen` reads the latest props when it runs.
  useEffect(() => {
    const element = popupRef.current;
    const root = context.controller?.root;
    if (!(open && element && root)) {
      return;
    }
    // Escape anywhere in the map closes it; focus inside goes back to the map.
    const close = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.stopPropagation();
      if (element.contains(document.activeElement)) {
        root.querySelector<HTMLElement>(".maplibregl-canvas")?.focus();
      }
      setOpen(false);
    };
    root.addEventListener("keydown", close);
    const stop = closeOnClick
      ? context.controller?.onClick(() => setOpen(false))
      : undefined;
    return () => {
      root.removeEventListener("keydown", close);
      stop?.();
    };
  }, [open, context.controller, closeOnClick]);

  if (!open) {
    return null;
  }
  return (
    <div
      className="invisible absolute top-0 left-0 z-30 size-0"
      data-slot="map-popup-anchor"
      ref={anchorRef}
    >
      <div
        aria-label={label}
        className={cn(POPUP, closeButton && CLOSE_ROOM, className)}
        data-open=""
        data-side={side}
        data-slot="map-popup"
        data-state="open"
        role="dialog"
        tabIndex={-1}
        {...rest}
        ref={popupRef}
      >
        {closeButton ? <PopupClose onClose={dismiss} /> : null}
        {children}
      </div>
    </div>
  );
};

// =============================================================================
// Controls
// =============================================================================

const CONTROLS_POSITION = {
  "bottom-end": "end-2 bottom-9",
  "bottom-start": "start-2 bottom-2",
  "top-end": "end-2 top-2",
  "top-start": "start-2 top-2",
};

export interface MapControlsProps extends ComponentProps<"div"> {
  /** The corner, at the end of the line or its start. @default "bottom-end" */
  position?: keyof typeof CONTROLS_POSITION;
}

/**
 * A corner of buttons over the map. Without children it shows zoom in and
 * zoom out; give it control groups to choose your own.
 */
export const MapControls = (props: MapControlsProps) => {
  const { children, className, position = "bottom-end", ...rest } = props;
  return (
    <div
      className={cn(
        "absolute z-40 flex flex-col gap-2",
        CONTROLS_POSITION[position],
        className
      )}
      data-position={position}
      data-slot="map-controls"
      {...rest}
    >
      {children ?? (
        <MapControlGroup>
          <MapZoomIn />
          <MapZoomOut />
        </MapControlGroup>
      )}
    </div>
  );
};

/** A stack of control buttons that read as one. */
export const MapControlGroup = (props: ComponentProps<typeof ButtonGroup>) => {
  const { className, ...rest } = props;
  return (
    <ButtonGroup
      aria-label="Map controls"
      className={cn("shadow-xs empty:hidden", className)}
      data-slot="map-control-group"
      orientation="vertical"
      {...rest}
    />
  );
};

const CONTROL = "bg-background dark:bg-background dark:hover:bg-muted";

interface ZoomButtonProps extends ComponentProps<typeof Button> {
  direction: "in" | "out";
}

/** A zoom step, turned off at the map's limit. */
const ZoomButton = (props: ZoomButtonProps) => {
  const { className, direction, ...rest } = props;
  const context = useContext(MapContext);
  const [atLimit, setAtLimit] = useState(false);
  useEffect(() => {
    const stop = mapWatchZoomLimit(context.map, direction, setAtLimit);
    return () => stop?.();
  }, [context.map, direction]);
  return (
    <Button
      aria-label={direction === "in" ? "Zoom in" : "Zoom out"}
      className={cn(CONTROL, className)}
      data-slot={direction === "in" ? "map-zoom-in" : "map-zoom-out"}
      disabled={atLimit}
      onClick={() => mapZoomBy(context.map, direction === "in" ? 1 : -1)}
      size="icon"
      variant="outline"
      {...rest}
    >
      {direction === "in" ? (
        <PlusIcon aria-hidden="true" />
      ) : (
        <MinusIcon aria-hidden="true" />
      )}
    </Button>
  );
};

export const MapZoomIn = (props: ComponentProps<typeof Button>) => (
  <ZoomButton direction="in" {...props} />
);

export const MapZoomOut = (props: ComponentProps<typeof Button>) => (
  <ZoomButton direction="out" {...props} />
);

/**
 * A needle that turns and tilts with the map; a click turns it back to
 * north and looks straight down.
 */
export const MapCompass = (props: ComponentProps<typeof Button>) => {
  const { className, ...rest } = props;
  const context = useContext(MapContext);
  const needleRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const needle = needleRef.current;
    if (!needle) {
      return;
    }
    const stop = mapWatchRotation(context.map, (bearing, pitch) => {
      // Tilted with the map, and scaled up as MapLibre's own compass is, so it
      // doesn't flatten away.
      const scale = 1 / Math.sqrt(Math.cos((pitch * Math.PI) / 180));
      needle.style.transform = `scale(${scale}) rotateX(${pitch}deg) rotateZ(${-bearing}deg)`;
    });
    return () => stop?.();
  }, [context.map]);
  return (
    <Button
      aria-label="Reset bearing to north"
      className={cn(CONTROL, className)}
      data-slot="map-compass"
      onClick={() => mapResetNorth(context.map)}
      size="icon"
      variant="outline"
      {...rest}
    >
      <svg
        aria-hidden="true"
        className="size-5 [transform-style:preserve-3d]"
        ref={needleRef}
        viewBox="0 0 24 24"
      >
        <path className="fill-primary" d="M12 2 16 12H12Z" />
        <path className="fill-primary/60" d="M12 2 8 12H12Z" />
        <path className="fill-muted-foreground/50" d="M12 22 16 12H12Z" />
        <path className="fill-muted-foreground/30" d="M12 22 8 12H12Z" />
      </svg>
    </Button>
  );
};

export interface MapLocateProps extends ComponentProps<typeof Button> {
  /** Called with the device's position once the map flies there. */
  onLocate?: (position: MapLngLat) => void;
  /** Called when there's no position: permission refused, or no fix in 10 seconds. */
  onLocateError?: (error: unknown) => void;
  /** The zoom it flies to, unless the map is closer already. @default 14 */
  zoom?: number;
}

/** Asks for the device's position and flies there. */
export const MapLocate = (props: MapLocateProps) => {
  const { className, onLocate, onLocateError, zoom = 14, ...rest } = props;
  const context = useContext(MapContext);
  const [busy, setBusy] = useState(false);
  const locate = () => {
    setBusy(true);
    mapLocate(context.map, zoom)
      .then((position) => onLocate?.(position))
      .catch((error: unknown) => onLocateError?.(error))
      .finally(() => setBusy(false));
  };
  return (
    <Button
      aria-label="Find my location"
      className={cn(CONTROL, className)}
      data-slot="map-locate"
      disabled={busy}
      onClick={locate}
      size="icon"
      variant="outline"
      {...rest}
    >
      {busy ? (
        <Spinner
          aria-label="Finding your location"
          className="motion-reduce:animate-none"
        />
      ) : (
        <LocateFixedIcon aria-hidden="true" />
      )}
    </Button>
  );
};

/** Fills the screen with the map, markers and controls included, and back. Hidden where the browser can't. */
export const MapFullscreen = (props: ComponentProps<typeof Button>) => {
  const { className, ...rest } = props;
  const context = useContext(MapContext);
  const [fullscreen, setFullscreen] = useState(false);
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(document.fullscreenEnabled);
    const stop = context.controller?.watchFullscreen(setFullscreen);
    return () => stop?.();
  }, [context.controller]);
  if (!supported) {
    return null;
  }
  return (
    <Button
      aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      aria-pressed={fullscreen}
      className={cn(CONTROL, className)}
      data-slot="map-fullscreen"
      onClick={() => context.controller?.toggleFullscreen()}
      size="icon"
      variant="outline"
      {...rest}
    >
      {fullscreen ? (
        <MinimizeIcon aria-hidden="true" />
      ) : (
        <MaximizeIcon aria-hidden="true" />
      )}
    </Button>
  );
};

// =============================================================================
// Routes
// =============================================================================

interface RouteContextValue {
  coordinates: MapCoordinate[];
  layer: MapRouteLayer | null;
  progress: number | undefined;
}

const RouteContext = createContext<RouteContextValue>({
  coordinates: [],
  layer: null,
  progress: undefined,
});

export interface MapRouteProps {
  /** Raises the route over its siblings and draws it with the `active*` styles. @default false */
  active?: boolean;
  /** The color while `active`; `color` when not given. */
  activeColor?: string;
  /** The dashes while `active`; `dashArray` when not given. */
  activeDashArray?: [number, number];
  /** The opacity while `active`; `opacity` when not given. */
  activeOpacity?: number;
  /** The width while `active`, in pixels; `width` when not given. */
  activeWidth?: number;
  /** A MapLibre layer to draw under, such as the basemap's labels. */
  beforeId?: string;
  /** Its progress line and markers. */
  children?: ReactNode;
  /** Any CSS color, theme variables included. @default "var(--primary)" */
  color?: string;
  /** The route, as `[longitude, latitude]` pairs, from any routing service. */
  coordinates: MapCoordinate[];
  /** `[dash, gap]`, in line widths. */
  dashArray?: [number, number];
  /** Answers the pointer: a pointer cursor, `onRouteClick` and `onHoverChange`. @default false */
  interactive?: boolean;
  /** Called with `true` as the pointer comes onto the line, `false` as it leaves (with `interactive`). */
  onHoverChange?: (hovered: boolean) => void;
  /** Called on a click on the line (with `interactive`). */
  onRouteClick?: () => void;
  /** The line's opacity, from 0 to 1. @default 1 */
  opacity?: number;
  /** How much of the route is done, from 0 to 1: drives `MapRouteProgress` and the `progress` marker. */
  progress?: number;
  /** In pixels. @default 4 */
  width?: number;
}

/** A line along coordinates: a trip, a delivery, a run. */
export const MapRoute = (props: MapRouteProps) => {
  const {
    active = false,
    activeColor,
    activeDashArray,
    activeOpacity,
    activeWidth,
    beforeId,
    children,
    color = "var(--primary)",
    coordinates,
    dashArray,
    interactive = false,
    onHoverChange,
    onRouteClick,
    opacity = 1,
    progress,
    width = 4,
  } = props;
  const context = useContext(MapContext);
  const [layer, setLayer] = useState<MapRouteLayer | null>(null);
  const settings = {
    active,
    beforeId,
    color: active ? (activeColor ?? color) : color,
    coordinates,
    dashArray: active ? (activeDashArray ?? dashArray) : dashArray,
    interactive,
    onClick: onRouteClick,
    onHoverChange,
    opacity: active ? (activeOpacity ?? opacity) : opacity,
    progress,
    width: active ? (activeWidth ?? width) : width,
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: drawn once; later props go through `update`.
  useEffect(() => {
    const next = addMapRoute(context.controller, settings);
    if (!next) {
      return;
    }
    setLayer(next);
    return () => {
      next.remove();
      setLayer(null);
    };
  }, [context.controller]);

  useEffect(() => {
    layer?.update(settings);
  });

  return (
    <RouteContext.Provider value={{ coordinates, layer, progress }}>
      {children}
    </RouteContext.Provider>
  );
};

export interface MapRouteProgressProps {
  /** The covered part's color, any CSS color. @default the route's color */
  color?: string;
  /** `[dash, gap]` for the covered part, in line widths; solid when not given. */
  dashArray?: [number, number];
  /** The covered part's opacity, from 0 to 1. @default the route's opacity */
  opacity?: number;
  /** The covered part's width, in pixels. @default the route's width */
  width?: number;
}

/** The part of the route already covered (its `progress`), drawn over it. */
export const MapRouteProgress = (props: MapRouteProgressProps) => {
  const { color, dashArray, opacity, width } = props;
  const route = useContext(RouteContext);
  const [line, setLine] = useState<ReturnType<
    MapRouteLayer["addProgress"]
  > | null>(null);
  const settings = { color, dashArray, opacity, width };

  // biome-ignore lint/correctness/useExhaustiveDependencies: drawn once; later props go through `update`.
  useEffect(() => {
    const next = route.layer?.addProgress(settings);
    if (!next) {
      return;
    }
    setLine(next);
    return () => {
      next.remove();
      setLine(null);
    };
  }, [route.layer]);

  useEffect(() => {
    line?.update(settings);
  });

  return <span data-slot="map-route-progress" hidden />;
};

export interface MapRouteMarkerProps
  extends Omit<MapMarkerProps, "latitude" | "longitude"> {
  /** Where on the route: `start`, `end`, `progress`, or a fraction from 0 to 1. */
  at: MapRouteAnchor;
}

/** A marker on the route: its ends, the progress point, or any fraction along it. */
export const MapRouteMarker = (props: MapRouteMarkerProps) => {
  const { at, ...rest } = props;
  const route = useContext(RouteContext);
  const point = mapRoutePoint(route.coordinates, at, route.progress);
  if (!point) {
    return null;
  }
  return <MapMarker latitude={point[1]} longitude={point[0]} {...rest} />;
};

// =============================================================================
// Data layers
// =============================================================================

export interface MapGeoJSONProps {
  /** A MapLibre layer to draw under. */
  beforeId?: string;
  /** Paint for the point under the pointer (needs feature ids). */
  circleHoverPaint?: MapCirclePaint;
  /** Points' paint, merged over a primary dot; `false` draws no points. */
  circlePaint?: MapCirclePaint | false;
  /** A FeatureCollection, a Feature, a Geometry, or a URL to fetch one from. */
  data: MapGeoJSONData;
  /** Paint for the polygon under the pointer (needs feature ids). */
  fillHoverPaint?: MapFillPaint;
  /** Polygons' paint, merged over a light primary tint; `false` draws no fill. */
  fillPaint?: MapFillPaint | false;
  /** Answers the pointer. @default true with `onFeatureClick` or `onFeatureHover` */
  interactive?: boolean;
  /** Paint for the line or the outline under the pointer (needs feature ids). */
  lineHoverPaint?: MapLinePaint;
  /** Lines' and outlines' paint, merged over a primary hairline; `false` draws none. */
  linePaint?: MapLinePaint | false;
  /** Called with the feature clicked, and where. */
  onFeatureClick?: (event: MapFeatureEvent) => void;
  /** Called as the feature under the pointer changes; `null` when it leaves them. */
  onFeatureHover?: (event: MapFeatureEvent | null) => void;
  /** The property that is each feature's id, for hover and stable events. */
  promoteId?: string;
}

/**
 * Any GeoJSON: polygons filled and outlined, lines drawn, points as dots,
 * each feature answering the pointer. Colors may be theme variables.
 */
export const MapGeoJSON = (props: MapGeoJSONProps) => {
  const {
    beforeId,
    circleHoverPaint,
    circlePaint,
    data,
    fillHoverPaint,
    fillPaint,
    interactive,
    lineHoverPaint,
    linePaint,
    onFeatureClick,
    onFeatureHover,
    promoteId,
  } = props;
  const context = useContext(MapContext);
  const [layer, setLayer] = useState<ReturnType<typeof addMapGeoJSON>>(null);
  const settings = {
    beforeId,
    circleHoverPaint,
    circlePaint,
    data,
    fillHoverPaint,
    fillPaint,
    interactive: interactive ?? Boolean(onFeatureClick || onFeatureHover),
    lineHoverPaint,
    linePaint,
    onFeatureClick,
    onFeatureHover,
    promoteId,
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: drawn once; later props go through `update`.
  useEffect(() => {
    const next = addMapGeoJSON(context.controller, settings);
    if (!next) {
      return;
    }
    setLayer(next);
    return () => {
      next.remove();
      setLayer(null);
    };
  }, [context.controller]);

  useEffect(() => {
    layer?.update(settings);
  });

  return <span data-slot="map-geojson" hidden />;
};

export interface MapArcProps {
  /** A MapLibre layer to draw under. */
  beforeId?: string;
  /** How far each arc bows: 0 is straight, negative bows the other way. @default 0.2 */
  curvature?: number;
  /** The arcs, each with a unique `id`, `from` and `to`. */
  data: MapArcDatum[];
  /** Paint for the arc under the pointer. */
  hoverPaint?: MapLinePaint;
  /** Answers the pointer: hover, clicks and a pointer cursor. @default true */
  interactive?: boolean;
  /** MapLibre line layout, merged over round joins and caps. */
  layout?: MapLineLayout;
  /** Called with the arc clicked, and where. */
  onArcClick?: (event: MapArcEvent) => void;
  /** Called as the arc under the pointer changes; `null` when it leaves them. */
  onArcHover?: (event: MapArcEvent | null) => void;
  /** Paint merged over a primary line; expressions can read each arc's fields. */
  paint?: MapLinePaint;
  /** Points along each curve. @default 64 */
  samples?: number;
}

/** Curved lines between pairs of points: flights, transfers, connections. */
export const MapArc = (props: MapArcProps) => {
  const {
    beforeId,
    curvature = 0.2,
    data,
    hoverPaint,
    interactive = true,
    layout,
    onArcClick,
    onArcHover,
    paint,
    samples = 64,
  } = props;
  const context = useContext(MapContext);
  const [layer, setLayer] = useState<ReturnType<typeof addMapArcs>>(null);
  const settings = {
    beforeId,
    curvature,
    data,
    hoverPaint,
    interactive,
    layout,
    onArcClick,
    onArcHover,
    paint,
    samples,
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: drawn once; later props go through `update`.
  useEffect(() => {
    const next = addMapArcs(context.controller, settings);
    if (!next) {
      return;
    }
    setLayer(next);
    return () => {
      next.remove();
      setLayer(null);
    };
  }, [context.controller]);

  useEffect(() => {
    layer?.update(settings);
  });

  return <span data-slot="map-arc" hidden />;
};

export interface MapClusterLayerProps {
  /** Colors for small, medium and large clusters. @default the primary color for all three */
  clusterColors?: [string, string, string];
  /** The zoom past which points stop clustering. @default 14 */
  clusterMaxZoom?: number;
  /** How near points cluster, in pixels. @default 50 */
  clusterRadius?: number;
  /** Point counts where a cluster turns medium, then large. @default [100, 750] */
  clusterThresholds?: [number, number];
  /** Points, as a FeatureCollection or a URL to fetch one from. */
  data: MapGeoJSONFeatureCollection<MapGeoJSONPoint> | string;
  /** Called on a cluster; without it, a click zooms into the cluster. */
  onClusterClick?: (
    clusterId: number,
    coordinates: MapCoordinate,
    pointCount: number
  ) => void;
  /** Called on a single point. */
  onPointClick?: (
    feature: MapGeoJSONFeature<MapGeoJSONPoint>,
    coordinates: MapCoordinate
  ) => void;
  /** The color of a point on its own, out of every cluster. @default "var(--primary)" */
  pointColor?: string;
  /** The counts' color. @default "var(--primary-foreground)" */
  textColor?: string;
}

/** Many points grouped into counted circles that split as the map zooms in. */
export const MapClusterLayer = (props: MapClusterLayerProps) => {
  const {
    clusterColors = ["var(--primary)", "var(--primary)", "var(--primary)"],
    clusterMaxZoom = 14,
    clusterRadius = 50,
    clusterThresholds = [100, 750],
    data,
    onClusterClick,
    onPointClick,
    pointColor = "var(--primary)",
    textColor = "var(--primary-foreground)",
  } = props;
  const context = useContext(MapContext);
  const [layer, setLayer] = useState<ReturnType<typeof addMapClusters>>(null);
  const settings = {
    clusterColors,
    clusterMaxZoom,
    clusterRadius,
    clusterThresholds,
    data,
    onClusterClick,
    onPointClick,
    pointColor,
    textColor,
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: drawn once; later props go through `update`.
  useEffect(() => {
    const next = addMapClusters(context.controller, settings);
    if (!next) {
      return;
    }
    setLayer(next);
    return () => {
      next.remove();
      setLayer(null);
    };
  }, [context.controller]);

  useEffect(() => {
    layer?.update(settings);
  });

  return <span data-slot="map-cluster-layer" hidden />;
};

export interface MapHeatmapProps {
  /** A MapLibre layer to draw under, such as the basemap's labels. */
  beforeId?: string;
  /** From the least density to the most, any CSS colors. @default the theme's chart colors, hottest away from the background */
  colors?: string[];
  /** Points, as a FeatureCollection or a URL to fetch one from. */
  data: MapGeoJSONFeatureCollection<MapGeoJSONPoint> | string;
  /** How hot the heat runs: 2 is twice as hot. @default 1 */
  intensity?: number;
  /** Past this zoom the heat fades out and each point shows instead; heat at every zoom when not given. */
  maxZoom?: number;
  /** The heat's opacity, from 0 to 1. @default 0.85 */
  opacity?: number;
  /** Each point's reach in pixels at zoom 10; half at zoom 5, twice at 15. @default 24 */
  radius?: number;
  /** The highest weight: a point weighing this counts fully. @default 1 */
  weightMax?: number;
  /** The property each point is weighted by, from 0 to `weightMax`; every point counts the same when not given. */
  weightProperty?: string;
}

/** Many points as heat: hottest where they crowd, in the theme's chart colors. */
export const MapHeatmap = (props: MapHeatmapProps) => {
  const {
    beforeId,
    colors,
    data,
    intensity = 1,
    maxZoom,
    opacity = 0.85,
    radius = 24,
    weightMax = 1,
    weightProperty,
  } = props;
  const context = useContext(MapContext);
  const [layer, setLayer] = useState<ReturnType<typeof addMapHeatmap>>(null);
  const settings = {
    beforeId,
    colors,
    data,
    intensity,
    maxZoom,
    opacity,
    radius,
    weightMax,
    weightProperty,
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: drawn once; later props go through `update`.
  useEffect(() => {
    const next = addMapHeatmap(context.controller, settings);
    if (!next) {
      return;
    }
    setLayer(next);
    return () => {
      next.remove();
      setLayer(null);
    };
  }, [context.controller]);

  useEffect(() => {
    layer?.update(settings);
  });

  return <span data-slot="map-heatmap" hidden />;
};

// =============================================================================
// Camera
// =============================================================================

export interface MapCameraProps {
  /** Rotation, in degrees clockwise from north. */
  bearing?: number;
  /** Frames these corners, `[[west, south], [east, north]]`, instead of `center` and `zoom`. */
  bounds?: [MapCoordinate, MapCoordinate];
  /** Where it looks, as `[longitude, latitude]`. */
  center?: MapCoordinate;
  /** How long a flight to a new aim takes, in ms; none where motion is reduced. @default 1200 */
  duration?: number;
  /** The closest it comes when framing `bounds`, and how close it looks at `bounds` round a single point. */
  maxZoom?: number;
  /** Room round what it frames, in pixels: a number, or one per side (for a panel over the map), with `start` and `end` following the direction (RTL) or `left` and `right`. @default 48 */
  padding?: MapPadding;
  /** Tilt, in degrees from looking straight down. */
  pitch?: number;
  /** Change it to fly to the same aim again, as when the place already chosen is pressed after the map was moved. */
  revision?: number | string;
  /** How close it is. */
  zoom?: number;
}

/**
 * Aims the camera: it starts where this says, and flies to each new aim
 * after (the place picked in a list, the matches of a filter). The
 * visitor's own pans and zooms stay until the aim changes.
 */
export const MapCamera = (props: MapCameraProps) => {
  const {
    bearing,
    bounds,
    center,
    duration = 1200,
    maxZoom,
    padding = 48,
    pitch,
    revision,
    zoom,
  } = props;
  const context = useContext(MapContext);
  const [camera, setCamera] = useState<ReturnType<typeof addMapCamera>>(null);
  const settings = {
    bearing,
    bounds,
    center,
    duration,
    maxZoom,
    padding,
    pitch,
    revision,
    zoom,
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: aimed once; later props go through `update`.
  useEffect(() => {
    const next = addMapCamera(context.controller, settings);
    if (!next) {
      return;
    }
    setCamera(next);
    return () => {
      next.remove();
      setCamera(null);
    };
  }, [context.controller]);

  useEffect(() => {
    camera?.update(settings);
  });

  return <span data-slot="map-camera" hidden />;
};
