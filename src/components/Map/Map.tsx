import {
    MapControls,
    MapMarker,
    MapMarkerContent,
    MapMarkerPopup,
    MapMarkerTooltip,
    MapView,
} from "@/components/ui/map";

const PLACES = [
    {
        description: "The world's most visited museum, in a former royal palace.",
        id: "louvre",
        latitude: 48.8606,
        longitude: 2.3376,
        name: "Louvre Museum",
    },
    {
        description: "Gothic cathedral on the Île de la Cité, reopened in 2024.",
        id: "notre-dame",
        latitude: 48.853,
        longitude: 2.3499,
        name: "Notre-Dame",
    },
    {
        description: "Impressionist paintings in a Beaux-Arts railway station.",
        id: "orsay",
        latitude: 48.86,
        longitude: 2.3266,
        name: "Musée d'Orsay",
    },
    {
        description: "A 17th-century garden of lawns, fountains and statues.",
        id: "luxembourg",
        latitude: 48.8462,
        longitude: 2.3371,
        name: "Jardin du Luxembourg",
    },
];

interface MapDemoProps {
    className?: string;
}

const MapDemo = ({ className = "h-96 rounded-lg border" }: MapDemoProps) => (
    <MapView
        className={className}
        defaultViewport={{ center: [2.3376, 48.8545], zoom: 13 }}
    >
        {PLACES.map((place) => (
            <MapMarker
                key={place.id}
                label={place.name}
                latitude={place.latitude}
                longitude={place.longitude}
            >
                <MapMarkerContent />
                <MapMarkerTooltip>{place.name}</MapMarkerTooltip>
                <MapMarkerPopup>
                    <p className="font-medium">{place.name}</p>
                    <p className="text-muted-foreground">{place.description}</p>
                </MapMarkerPopup>
            </MapMarker>
        ))}
        <MapControls />
    </MapView>
);

export default MapDemo;
export { MapDemo };