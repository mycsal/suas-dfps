import mapboxgl from 'mapbox-gl';
import { initializeThreeJS } from '../threejs/threejsSetup';

mapboxgl.accessToken = 'pk.eyJ1IjoibXljc2FsIiwiYSI6ImNsc2RtM2tvdzEyNnIybXQwcjI5d2tqcjAifQ.SqGe3A-JLNSkTCYluSpRnA';

export function initializeMap() {
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/outdoors-v12',
        projection: 'globe',
        center: [-118.148451, 34.066285],
        // center: [139.745438, 35.658581],
        zoom: 19,
        pitch: 40,
        bearing: 20,
        antialias: true
    });
    map.addControl(new mapboxgl.ScaleControl());
    initializeThreeJS(map);
}

