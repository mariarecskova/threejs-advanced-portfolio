import "./style.css";
import * as THREE from "three";
import * as dat from "dat.gui";
import { OrbitControls } from "https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";

//this is to edit the plane
const gui = new dat.GUI();

const world = {
  plane: {
    width: 19,
    height: 19,
    widthSegments: 17,
    heightSegments: 17,
  },
};

//this continues the texts and default values for the gui, with 2 values it becomes a slider
//when we change the slider, we call the function, and we connect it with our plane
gui.add(world.plane, "width", 1, 50).onChange(generatePlane);
gui.add(world.plane, "height", 1, 50).onChange(generatePlane);
gui.add(world.plane, "widthSegments", 1, 50).onChange(generatePlane);
gui.add(world.plane, "heightSegments", 1, 50).onChange(generatePlane);

function generatePlane() {
  planeMesh.geometry.dispose();
  planeMesh.geometry = new THREE.PlaneGeometry(
    world.plane.width,
    world.plane.height,
    world.plane.widthSegments,
    world.plane.heightSegments
  );

  // vertice position randomization
  const { array } = planeMesh.geometry.attributes.position;
  //we are looping through every 3 value, because otherwise they are too many values
  //they come after each other in the array: x,y,z- each x,y,z is one invididual vertice
  for (let i = 0; i < array.length; i += 3) {
    const x = array[i];
    const y = array[i + 1];
    const z = array[i + 2];

    array[i + 2] = z + Math.random();
  }

  const colors = [];
  for (let i = 0; i < planeMesh.geometry.attributes.position.count; i++) {
    colors.push(0, 0.19, 0.4);
  }
  //we added a new attribute to the geometry object
  planeMesh.geometry.setAttribute(
    "color",
    //random numbers, but it needs to have this specific type
    new THREE.BufferAttribute(new Float32Array(colors), 3) //array is RGB code, 3- grouping number- every 3 datapiece represents one vertice color
  );
}
//with x this we tranlate to the right (+) or the left (-) of the screen
// z modifies the object itself, with this it gets jagged

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  // near clipping plain
  1000
  // far clipping plain
);
//laser pointer monitoring
const raycaster = new THREE.Raycaster();

const renderer = new THREE.WebGLRenderer();

new OrbitControls(camera, renderer.domElement);

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
//this stops the jaggyness- it recognizes automatically the pixel ratio
document.body.appendChild(renderer.domElement);

camera.position.z = 5;
//this cannot be located in the center. it has its units for measurement

const planeGeometry = new THREE.PlaneGeometry(
  world.plane.width,
  world.plane.height,
  world.plane.widthSegments,
  world.plane.heightSegments
);
//width, height, widthsegment, heightsegment

const planeMaterial = new THREE.MeshPhongMaterial({
  //this makes both sides of the mesh visible, while it flips
  side: THREE.DoubleSide,
  flatShading: true,
  vertexColors: true,
});

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 0, -1);
scene.add(light);

const backLight = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 0, 1);
scene.add(backLight);

const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(planeMesh); // planeMesh.rotation.x += 0.01;
generatePlane();

//here we do the object destructuring
const { array } = planeMesh.geometry.attributes.position;
//we are looping through every 3 value, because otherwise they are too many values
//they come after each other in the array: x,y,z- each x,y,z is one invididual vertice
for (let i = 0; i < array.length; i += 3) {
  const x = array[i];
  const y = array[i + 1];
  const z = array[i + 2];

  //with x this we tranlate to the right (+) or the left (-) of the screen
  // z modifies the object itself, with this it gets jagged
  array[i + 2] = z + Math.random();
}

const colors = [];
for (let i = 0; i < planeMesh.geometry.attributes.position.count; i++) {
  colors.push(0, 0.19, 0.4);
}
//we added a new attribute to the geometry object
planeMesh.geometry.setAttribute(
  "color",
  //random numbers, but it needs to have this specific type
  new THREE.BufferAttribute(new Float32Array(colors), 3) //array is RGB code, 3- grouping number- every 3 datapiece represents one vertice color
);
//they are undefined in the beginning
const mouse = {
  x: undefined,
  y: undefined,
};

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  raycaster.setFromCamera(mouse, camera);

  planeMesh.geometry.attributes.position.needsUpdate = true;

  const interSects = raycaster.intersectObject(planeMesh);
  if (interSects.length > 0) {
    const { color } = interSects[0].object.geometry.attributes;
    //vertice 1
    color.setX(interSects[0].face.a, 0.1);
    color.setY(interSects[0].face.a, 0.5);
    color.setZ(interSects[0].face.a, 1);

    //vertice 2
    color.setX(interSects[0].face.b, 0.1);
    color.setY(interSects[0].face.b, 0.5);
    color.setZ(interSects[0].face.b, 1);

    //vertice 3
    color.setX(interSects[0].face.c, 0.1);
    color.setY(interSects[0].face.c, 0.5);
    color.setZ(interSects[0].face.c, 1);

    interSects[0].object.geometry.attributes.color.needsUpdate = true;

    const initialColor = {
      r: 0,
      g: 0.19,
      b: 0.4,
    };

    const hoverColor = {
      r: 0.1,
      g: 0.5,
      b: 1,
    };

    gsap.to(hoverColor, {
      r: initialColor.r,
      g: initialColor.g,
      b: initialColor.b,
      duration: 1,
      onUpdate: () => {
        color.setX(interSects[0].face.a, hoverColor.r);
        color.setY(interSects[0].face.a, hoverColor.g);
        color.setZ(interSects[0].face.a, hoverColor.b);

        //vertice 2
        color.setX(interSects[0].face.b, hoverColor.r);
        color.setY(interSects[0].face.b, hoverColor.g);
        color.setZ(interSects[0].face.b, hoverColor.b);

        //vertice 3
        color.setX(interSects[0].face.c, hoverColor.r);
        color.setY(interSects[0].face.c, hoverColor.g);
        color.setZ(interSects[0].face.c, hoverColor.b);
        color.needsUpdate = true;
      },
    });
  }
}
//this makes the box spin
// planeMesh.rotation.x += 0.01;

//this runs a loop
animate();
//here we get the x and y coordinates- by default, the coordinates start in the left corner. although, for three it needs to be 0 in the center, left: -1, right: 1
addEventListener("mousemove", (event) => {
  //this is needed to have a normalised coordinate as an integer
  mouse.x = (event.clientX / innerWidth) * 2 - 1;
  //here we need to reverse the direction
  mouse.y = (event.clientY / innerHeight) * 2 + 1;
});

renderer.render(scene, camera);
