import "./style.scss";
import * as THREE from "three";
import * as dat from "dat.gui";
import { OrbitControls } from "https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import { Float32BufferAttribute, StaticReadUsage } from "three";

//this is to edit the plane
const gui = new dat.GUI();

const world = {
  plane: {
    width: 400,
    height: 400,
    widthSegments: 50,
    heightSegments: 50,
  },
};

//this continues the texts and default values for the gui, with 2 values it becomes a slider
//when we change the slider, we call the function, and we connect it with our plane
gui.add(world.plane, "width", 1, 500).onChange(generatePlane);
gui.add(world.plane, "height", 1, 500).onChange(generatePlane);
gui.add(world.plane, "widthSegments", 1, 100).onChange(generatePlane);
gui.add(world.plane, "heightSegments", 1, 100).onChange(generatePlane);

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
  const randomValues = [];
  //the random value and array did not match up, if we only loop thorugh every 3rd value, we only will have randomized positions for x
  for (let i = 0; i < array.length; i++) {
    //here we only activate this if it is the 3rd value- because this part is dependent on it
    if (i % 3 === 0) {
      const x = array[i];
      const y = array[i + 1];
      const z = array[i + 2];

      array[i] = x + (Math.random() - 0.5) * 3;
      array[i + 1] = y + (Math.random() - 0.5) * 3;
      array[i + 2] = z + (Math.random() - 0.5) * 3;
    }
    randomValues.push(Math.random() * Math.PI * 2);
  }

  //duplicating the array it with a new property
  planeMesh.geometry.attributes.position.randomValues = randomValues;
  planeMesh.geometry.attributes.position.originalPosition =
    planeMesh.geometry.attributes.position.array;

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
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();

new OrbitControls(camera, renderer.domElement);

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
//this stops the jaggyness- it recognizes automatically the pixel ratio
document.body.appendChild(renderer.domElement);

camera.position.z = 50;
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

const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(planeMesh); // planeMesh.rotation.x += 0.01;
generatePlane();

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 1, -1);
scene.add(light);

const backLight = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 0, 1);
scene.add(backLight);

const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });

const starVertices = [];
for (let i = 0; i < 10000; i++) {
  //gets a range from -1000 to 1000, and for 10000 stars from all dimensions
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = (Math.random() - 0.5) * 2000;
  starVertices.push(x, y, z);
}
//here we set it as an attribute to the object
starGeometry.setAttribute(
  "position",
  new Float32BufferAttribute(starVertices, 3)
);

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

//they are undefined in the beginning
const mouse = {
  x: undefined,
  y: undefined,
};

let frame = 0;

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  raycaster.setFromCamera(mouse, camera);
  frame += 0.01;
  const { array, originalPosition, randomValues } =
    planeMesh.geometry.attributes.position;

  for (let i = 0; i < array.length; i += 3) {
    //to create a pulse effet,   we need this to alter an alternative value, not the og value. the cos always returns a value between -1 to 1. if we keep adding to it, we will have a movement effect

    //x
    array[i] = originalPosition[i] + Math.cos(frame + randomValues[i]) * 0.01;
    //y
    array[i + 1] =
      originalPosition[i + 1] + Math.sin(frame + randomValues[i + 1]) * 0.001;
  }

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
  stars.rotation.x += 0.0005;
}

//docs: https://greensock.com/
gsap.to("#maria", {
  opacity: 1,
  duration: 1.5,
  y: 0,
  ease: "expo",
});

gsap.to("#paragraph", {
  opacity: 1,
  duration: 1.5,
  delay: 0.3,
  y: 0,
  ease: "expo",
});

gsap.to("#projectButton", {
  opacity: 1,
  duration: 1.5,
  delay: 0.6,
  y: 0,
  ease: "expo",
});

document.querySelector("#projectButton");
addEventListener("click", (e) => {
  e.preventDefault();
  gsap.to("#container", {
    opacity: 0,
  });
  gsap.to(camera.position, {
    z: 25,
    ease: "power3.inOut",
    duration: 2,
  });
  gsap.to(camera.rotation, {
    x: 1.57,
    ease: "power3.inOut",
    duration: 2,
  });
  gsap.to(camera.position, {
    y: 1000,
    ease: "power3.in",
    duration: 1,
    delay: 2,
    //change this at the end!!!
    onComplete: () => {
      window.location = "https://chriscourses.com/";
    },
  });
});
//to maintain the perfect aspect ratio
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
//this runs a loop
animate();

addEventListener("mousemove", (event) => {
  //this is needed to have a normalised coordinate as an integer
  mouse.x = (event.clientX / innerWidth) * 2 - 1;
  //here we need to reverse the direction
  mouse.y = -(event.clientY / innerHeight) * 2 + 1;
});
