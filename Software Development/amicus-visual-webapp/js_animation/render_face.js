var THREE = require('three');
var OBJLoader = require('three-obj-loader');

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
var loader = new THREE.OBJLoader();
//-- ADD Objects here
var faceObject = loader.load(
// resource URL
    'models/justinbieber/GoodBieber.obj',
    // called when resource is loaded
    function ( object ) {
      scene.add( object );
    },
    // called when loading is in progresses
    function ( xhr ) {
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    // called when loading has errors
    function ( error ) {
      console.log( 'An error happened' );
    }
);
//

faceObject.material.color = 0xffffff;
scene.add( faceObject );
scene.add( cube );
camera.position.z = 500;
function animate() {
  requestAnimationFrame( animate );
  renderer.render( scene, camera );
}
animate();
