import * as THREE from 'three';
import { Threebox } from 'threebox-plugin';

let buildingMaterial = new THREE.MeshPhongMaterial({
    color: 0x660000,
    side: THREE.DoubleSide,
    flatShading: true,
});

function animate(){
    requestAnimationFrame(animate);
}

let moveCount = 0;

export function initializeThreeJS(map) {
    // Initialize Threebox
    const tb = new Threebox(
        map,
        map.getCanvas().getContext('webgl'),
        {
            realSunlight: true,
            defaultLights: true,
            enableSelectingObjects: true,
            enableTooltips: false,
            enableDraggingObjects: true,
        }
    );

    // Make Threebox instance globally available for debugging and further use
    window.tb = tb;
    // Adapt the queryBuildingFeatures function to include Threebox extrusion
    queryBuildingFeatures(map, tb);
}

function calculatePolygonCenter(coordinates) {
    // Initialize sums and count of points
    let xSum = 0, ySum = 0, pointCount = 0;

    // Assume the first array is the outer boundary if it's a multi-dimensional array
    const points = coordinates[0] ? coordinates[0] : coordinates;


    // Sum up all x (longitude) and y (latitude) coordinates
    points.forEach(point => {
        xSum += point[0];
        ySum += point[1];
        pointCount++;
    });

    // Calculate the mean for x and y
    const centerX = xSum / pointCount;
    const centerY = ySum / pointCount;

    // Return the center as an object with longitude and latitude
    return { longitude: centerX, latitude: centerY };
}

function queryBuildingFeatures(map, tb) {
    map.on('load', function() {
        map.addLayer({
            id: 'buildings_on_load',
            type: 'custom',
            renderingMode: '3d',
            onAdd: function(map) {
                const renderedBuildings = map.queryRenderedFeatures({ layers: ['building'] });
                addRenderedBuildings(renderedBuildings);
            },
            render: function(gl, matrix) {
                tb.update();
            }
        });
    });
    // map.on('moveend', function() {
    //     moveCount++;
    //     map.addLayer({
    //         id: 'buildings_moved_' + moveCount,
    //         type: 'custom',
    //         renderingMode: '3d',
    //         onAdd: function(map) {
    //             const renderedBuildings = map.queryRenderedFeatures({ layers: ['building'] });
    //             addRenderedBuildings(renderedBuildings);
    //         },
    //         render: function(gl, matrix) {
    //             tb.update();
    //         }
    //     });
    // });
}
    

function addRenderedBuildings(renderedBuildings) {
    renderedBuildings.forEach((feature) => {
        let center = calculatePolygonCenter(feature.geometry.coordinates);
        let s = tb.projectedUnitsPerMeter(center.latitude);
        let extrusions = tb.extrusion({
            coordinates: feature.geometry.coordinates,
            geometryOptions:
            { 
                curveSegments: 1, 
                bevelEnabled: false,
                depth: (feature.properties.height || 5) * s,
            },
            materials: buildingMaterial
        });
        extrusions.setCoords([center.longitude, center.latitude, 0]);
        tb.add(extrusions);
        animate();
    });
}