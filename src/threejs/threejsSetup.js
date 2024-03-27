import * as THREE from 'three';
import { Threebox } from 'threebox-plugin';

const buildingsGroup = new THREE.Group();
const generatedBuildings = new Set();

let buildingMaterial = new THREE.MeshPhongMaterial({
    color: 0x660000,
    side: THREE.DoubleSide,
    flatShading: true,
});

function animate(){
    requestAnimationFrame(animate);
}


export function initializeThreeJS(map) {
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

    window.tb = tb;
    queryBuildingFeatures(map, tb);
}

function calculatePolygonCenter(coordinates) {
    let xSum = 0, ySum = 0, pointCount = 0;

    const points = coordinates[0] ? coordinates[0] : coordinates;

    points.forEach(point => {
        xSum += point[0];
        ySum += point[1];
        pointCount++;
    });

    const centerX = xSum / pointCount;
    const centerY = ySum / pointCount;

    return { longitude: centerX, latitude: centerY };
}

function queryBuildingFeatures(map, tb) {
    map.on('load', function() {
        map.addLayer({
            id: 'buildings',
            type: 'custom',
            renderingMode: '3d',
            onAdd: function(map, gl) {
                const renderedBuildings = map.queryRenderedFeatures({ layers: ['building'] });
                addRenderedBuildings(renderedBuildings, tb);
                generateCubeAndRaycast(tb, map);
            },
            render: function(gl, matrix) {
                tb.update();
            }
        });
    });
    map.on('moveend', function() {
        const newRenderedBuildings = map.queryRenderedFeatures({ layers: ['building'] });
        addRenderedBuildings(newRenderedBuildings, tb);
    });
}

function addRenderedBuildings(renderedBuildings) {
    renderedBuildings.forEach((feature) => {
        let center = calculatePolygonCenter(feature.geometry.coordinates);
        const id = `${center.longitude},${center.latitude}`;
        if (generatedBuildings.has(id)){
            return;
        }
        generatedBuildings.add(id);
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
        buildingsGroup.add(extrusions);
    });
    tb.add(buildingsGroup);
    console.log(buildingsGroup);
    animate();
}

function generateCubeAndRaycast(tb, map) {
    // change the altitude to the height of the building
    const origin = [-118.14884916, 34.06649850, 0];
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    const material = new THREE.MeshPhongMaterial({ color: 0x007700, side: THREE.DoubleSide });
    let cube = new THREE.Mesh(geometry, material);
    cube = tb.Object3D({obj: cube, units: 'meters', bbox: false}).setCoords(origin);
    tb.add(cube);

    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3(0, -1 , 0);
    raycaster.set(cube.position, direction.normalize());

    const intersects = raycaster.intersectObjects(buildingsGroup.children, true);

    console.log(intersects);
    if (intersects.length > 0) {
        intersects[0].object.material.color.set(0x000099);
    }
}