import React from 'react';
import * as THREE from 'three';
import PropTypes from 'prop-types';

import { WEBGL } from '../js/WebGL.js';
//import { GLTFLoader } from '../js/GLTFLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
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

    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(75, this.state.width / this.state.height, 0.25, 100);
    this.camera.position.set( -2, 3, 4 );
		this.camera.lookAt( new THREE.Vector3( 0, 2, 0 ) );

    this.hemisphereLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
    this.hemisphereLight.position.set( 0, 20, 0 );
    this.scene.add( this.hemisphereLight );

    this.directionalLight = new THREE.DirectionalLight( 0xffffff );
    this.directionalLight.position.set( 0, 20, 10 );
    this.scene.add( this.directionalLight );

    this.api = { state: 'Walking' };
    var loader = new GLTFLoader();
		loader.load('./models/gltf/RobotExpressive/RobotExpressive.glb', ( gltf ) => {
			var model = gltf.scene;
			this.scene.add(model);
			this.createGUI(model, gltf.animations);
		}, undefined, function( e ) {
			console.error( e );
		});

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.gammaOutput = true;
		this.renderer.gammaFactor = 2.2;
    this.renderer.setSize(this.state.width, this.state.height);
    this.three.appendChild(this.renderer.domElement);

    this.animate();
  }

  createGUI = ( model, animations ) => {
    var states = [ 'Idle', 'Walking', 'Running', 'Dance', 'Death', 'Sitting', 'Standing' ];
		var emotes = [ 'Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp' ];
		this.gui = new dat.GUI();
		this.mixer = new THREE.AnimationMixer( model );

    this.actions = {};
		for ( var i = 0; i < animations.length; i++ ) {
			var clip = animations[ i ];
			var action = this.mixer.clipAction( clip );
			this.actions[ clip.name ] = action;
			if ( emotes.indexOf( clip.name ) >= 0 || states.indexOf( clip.name ) >= 4 ) {
					action.clampWhenFinished = true;
					action.loop = THREE.LoopOnce;
			}
		}

		// states
		var statesFolder = this.gui.addFolder( 'States' );
		var clipCtrl = statesFolder.add( this.api, 'state' ).options( states );
		clipCtrl.onChange( () => {
			this.fadeToAction( this.api.state, 0.5 );
		} );
		statesFolder.open();

    // emotes
		var emoteFolder = this.gui.addFolder( 'Emotes' );

		this.createEmoteCallback = ( name ) => {
			this.api[ name ] = () => {
				this.fadeToAction( name, 0.2 );
				this.mixer.addEventListener( 'finished', this.restoreState );
			};
			emoteFolder.add( this.api, name );
		}

		this.restoreState = () => {
			this.mixer.removeEventListener( 'finished', this.restoreState );
			this.fadeToAction( this.api.state, 0.2 );
		}

		for ( var index = 0; index < emotes.length; index++ ) {
			this.createEmoteCallback( emotes[ index ] );
		}

		emoteFolder.open();

    // expressions
    var face = model.getObjectByName( 'Head_2' );
    var expressions = Object.keys( face.morphTargetDictionary );
    var expressionFolder = this.gui.addFolder('Expressions');
    for ( var ind = 0; ind < expressions.length; ind++ ) {
      expressionFolder.add( face.morphTargetInfluences, ind, 0, 1, 0.01 ).name( expressions[ ind ] );
    }

    this.activeAction = this.actions['Walking'];
    this.activeAction.play();
    expressionFolder.open();
  }

  fadeToAction( name, duration ) {
		this.previousAction = this.activeAction;
		this.activeAction = this.actions[ name ];
		if ( this.previousAction !== this.activeAction ) {
			this.previousAction.fadeOut( duration );
		}
		this.activeAction
			.reset()
			.setEffectiveTimeScale( 1 )
			.setEffectiveWeight( 1 )
			.fadeIn( duration )
			.play();
	}


  /**
   * Animation loop
   */
  animate() {
    var dt = this.clock.getDelta();
		if ( this.mixer ) this.mixer.update( dt );
		requestAnimationFrame( this.animate.bind(this) );
		this.renderer.render( this.scene, this.camera );
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
