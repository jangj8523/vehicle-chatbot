import React from 'react';
import * as THREE from 'three';
import PropTypes from 'prop-types';

import { WEBGL } from '../js/WebGL.js';
//import { GLTFLoader } from '../js/GLTFLoader.js';
import * as dat from 'dat.gui';

class ThreeAvatarComponent extends React.Component {

  /**
   * Constructor
   */
  constructor(props) {
    super(props);

    this.three = React.createRef();
    this.state = {
      width: window.innerWidth,
      height: window.innerWidth/4
    }
  }

  /**
   * Rendering
   */
  render() {
    return (
      <div className='three' ref={(el) => { this.three = el }}></div>
    );
  }

  /**
   * Initialization
   */
  componentDidMount() {

    if ( WEBGL.isWebGLAvailable() === false ) {
			document.body.appendChild( WEBGL.getWebGLErrorMessage() );
		}

    this.updateDimensions();
    window.addEventListener("resize", this.updateDimensions.bind(this));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.state.width / this.state.height, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.state.width, this.state.height);
    this.three.appendChild(this.renderer.domElement);

    this.directionalLight = new THREE.DirectionalLight(0x9090aa);
    this.directionalLight.position.set(-10, 10, -10).normalize();
    this.scene.add(this.directionalLight);

    this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    this.hemisphereLight.position.set(1, 1, 1);
    this.scene.add(this.hemisphereLight);

    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material = new THREE.MeshStandardMaterial({ color: 0x00ff00, metalness: 0.15 });
    this.cube = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.cube);

    this.camera.position.z = 5;

    this.animate();
  }

  /**
   * Animation loop
   */
  animate() {
    requestAnimationFrame(this.animate.bind(this));

    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Resize operation handler, updating dimensions.
   * Setting state will invalidate the component
   * and call `componentWillUpdate()`.
   */
  updateDimensions() {
    console.log(this.three);
    this.setState({
      width: window.innerWidth,
      height: window.innerWidth/4
    });
  }

  /**
   * Invalidation handler, updating layout
   */
  componentWillUpdate() {
    let width = this.state.width;
    let height = this.state.height;

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Dispose
   */
  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions.bind(this));
  }

}

ThreeAvatarComponent.propTypes = {
  emotion: PropTypes.number,
};

export default ThreeAvatarComponent;
