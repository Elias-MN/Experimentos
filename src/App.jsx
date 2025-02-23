import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { ConvexObjectBreaker } from 'three/addons/misc/ConvexObjectBreaker.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import Hero from "./components/Hero";
import Footer from "./components/Footer";

import Ammo from "./ammo";

function CreateCubes(mountRef){

  useEffect(() => {
    let camera, scene, raycaster, renderer;
    let theta = 0;
    let INTERSECTED;
    const pointer = new THREE.Vector2();
    const radius = 25;
    const frustumSize = 50;

    // Configuración de la cámara
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      100
    );

    // Crear la escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    // Agregar cubos aleatorios
    const geometry = new THREE.BoxGeometry();
    for (let i = 0; i < 2000; i++) {
      const object = new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff })
      );

      object.position.x = Math.random() * 40 - 20;
      object.position.y = Math.random() * 40 - 20;
      object.position.z = Math.random() * 40 - 20;

      object.rotation.x = Math.random() * 2 * Math.PI;
      object.rotation.y = Math.random() * 2 * Math.PI;
      object.rotation.z = Math.random() * 2 * Math.PI;

      object.scale.x = Math.random() + 0.5;
      object.scale.y = Math.random() + 0.5;
      object.scale.z = Math.random() + 0.5;

      scene.add(object);
    }

    raycaster = new THREE.Raycaster();

    // Crear el renderer y agregarlo al DOM
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    mountRef.current.appendChild(renderer.domElement);

    // Eventos
    window.addEventListener("resize", onWindowResize);
    document.addEventListener("pointermove", onPointerMove);

    function onWindowResize() {
      const aspect = window.innerWidth / window.innerHeight;
      camera.left = (-frustumSize * aspect) / 2;
      camera.right = (frustumSize * aspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onPointerMove(event) {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    function animate() {
      render();
    }

    function render() {
      theta += 0.1;

      camera.position.x = radius * Math.sin(THREE.MathUtils.degToRad(theta));
      camera.position.y = radius * Math.sin(THREE.MathUtils.degToRad(theta));
      camera.position.z = radius * Math.cos(THREE.MathUtils.degToRad(theta));
      camera.lookAt(scene.position);
      camera.updateMatrixWorld();

      // Detección de intersecciones con raycaster
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(scene.children, false);

      if (intersects.length > 0) {
        if (INTERSECTED !== intersects[0].object) {
          if (INTERSECTED)
            INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

          INTERSECTED = intersects[0].object;
          INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
          INTERSECTED.material.emissive.setHex(0xff0000);
        }
      } else {
        if (INTERSECTED)
          INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
        INTERSECTED = null;
      }

      renderer.render(scene, camera);
    }

    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener("resize", onWindowResize);
      document.removeEventListener("pointermove", onPointerMove);
      renderer.dispose();
    };
  }, []);
}

function SimcityBuilder(mountRef){

  useEffect(() => {
  let camera, scene, renderer;
  let plane;
  let pointer, raycaster, isShiftDown = false;

  let rollOverMesh, rollOverMaterial;
  let cubeGeo, cubeMaterial;

  const objects = [];

  init();
  render();

  function init() {
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set( 500, 800, 1300 );
    camera.lookAt( 0, 0, 0 );
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf0f0f0 );

    // roll-over helpers
    const rollOverGeo = new THREE.BoxGeometry( 50, 50, 50 );
    rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
    rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
    scene.add( rollOverMesh );

    // cubes
    cubeGeo = new THREE.BoxGeometry( 50, 50, 50 );
    cubeMaterial = new THREE.MeshLambertMaterial( { color: 0xfeb74c } );

    // grid
    const gridHelper = new THREE.GridHelper( 1000, 20 );
    scene.add( gridHelper );
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();
    const geometry = new THREE.PlaneGeometry( 1000, 1000 );
    geometry.rotateX( - Math.PI / 2 );
    plane = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { visible: false } ) );
    scene.add( plane );
    objects.push( plane );

    // lights
    const ambientLight = new THREE.AmbientLight( 0x606060, 3 );
    scene.add( ambientLight );
    const directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
    directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
    scene.add( directionalLight );
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    document.addEventListener( 'pointermove', onPointerMove );
    document.addEventListener( 'pointerdown', onPointerDown );
    document.addEventListener( 'keydown', onDocumentKeyDown );
    document.addEventListener( 'keyup', onDocumentKeyUp );
    window.addEventListener( 'resize', onWindowResize );
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    render();
  }

  function onPointerMove( event ) {
    pointer.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
    raycaster.setFromCamera( pointer, camera );
    const intersects = raycaster.intersectObjects( objects, false );

    if ( intersects.length > 0 ) {
      const intersect = intersects[ 0 ];
      rollOverMesh.position.copy( intersect.point ).add( intersect.face.normal );
      rollOverMesh.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
      render();
    }
  }

  function onPointerDown( event ) {
    pointer.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
    raycaster.setFromCamera( pointer, camera );
    const intersects = raycaster.intersectObjects( objects, false );

    if ( intersects.length > 0 ) {
      const intersect = intersects[ 0 ];
      // delete cube
      if ( isShiftDown ) {
        if ( intersect.object !== plane ) {
          scene.remove( intersect.object );
          objects.splice( objects.indexOf( intersect.object ), 1 );
        }
        // create cube
      } else {
        const voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
        voxel.position.copy( intersect.point ).add( intersect.face.normal );
        voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
        scene.add( voxel );
        objects.push( voxel );
      }
      render();
    }
  }

  function onDocumentKeyDown( event ) {
    switch ( event.keyCode ) {
      case 16: isShiftDown = true; break;
    }
  }

  function onDocumentKeyUp( event ) {
    switch ( event.keyCode ) {
      case 16: isShiftDown = false; break;
    }
  }

  function render() {
    renderer.render( scene, camera );
    mountRef.current.appendChild(renderer.domElement);
  }

  }, []);
}

function Aula(){
  useEffect(() => {
    let camera, scene, renderer;

    init();
    render();

    function init() {
      camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 100 );
      camera.position.set( 1.5, 4, 9 );
      scene = new THREE.Scene();
      scene.background = new THREE.Color( 0xf6eedc );

      const loader = new FBXLoader();

      loader.load('./Aula.fbx', function (object) {
        scene.add(object);
        render();
      });

      renderer = new THREE.WebGLRenderer( { antialias: true } );
      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setSize( window.innerWidth, window.innerHeight );
      document.body.appendChild( renderer.domElement );

      const controls = new OrbitControls( camera, renderer.domElement );
      controls.addEventListener( 'change', render );
      controls.target.set( 0, 2, 0 );
      controls.update();
      window.addEventListener( 'resize', onWindowResize );
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize( window.innerWidth, window.innerHeight );
      render();
    }

    function render() {
      renderer.render( scene, camera );
    }

  }, []);
}

function Valorant(){
  useEffect(() => {
// Graphics variables
		let container, stats;
		let camera, controls, scene, renderer;
		let textureLoader;
		const clock = new THREE.Clock();

		const mouseCoords = new THREE.Vector2();
		const raycaster = new THREE.Raycaster();
		const ballMaterial = new THREE.MeshPhongMaterial( { color: 0x202020 } );

		// Physics variables
		const gravityConstant = 7.8;
		let collisionConfiguration;
		let dispatcher;
		let broadphase;
		let solver;
		let physicsWorld;
		const margin = 0.05;

		const convexBreaker = new ConvexObjectBreaker();

		// Rigid bodies include all movable objects
		const rigidBodies = [];

		const pos = new THREE.Vector3();
		const quat = new THREE.Quaternion();
		let transformAux1;
		let tempBtVec3_1;

		const objectsToRemove = [];

		for ( let i = 0; i < 500; i ++ ) {

			objectsToRemove[ i ] = null;

		}

		let numObjectsToRemove = 0;

		const impactPoint = new THREE.Vector3();
		const impactNormal = new THREE.Vector3();

		// - Main code -

		Ammo().then( ( AmmoLib ) => {

			Ammo = AmmoLib;

			init();

		} );


		// - Functions -

		function init() {

			initGraphics();

			initPhysics();

			createObjects();

			initInput();

		}

		function initGraphics() {

			container = document.getElementById( 'container' );

			camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );

			scene = new THREE.Scene();
			scene.background = new THREE.Color( 0xbfd1e5 );

			camera.position.set( - 14, 8, 16 );

			renderer = new THREE.WebGLRenderer( { antialias: true } );
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setSize( window.innerWidth, window.innerHeight );
			renderer.setAnimationLoop( animate );
			renderer.shadowMap.enabled = true;
			container.appendChild( renderer.domElement );

			controls = new OrbitControls( camera, renderer.domElement );
			controls.target.set( 0, 2, 0 );
			controls.update();

			textureLoader = new THREE.TextureLoader();

			const ambientLight = new THREE.AmbientLight( 0xbbbbbb );
			scene.add( ambientLight );

			const light = new THREE.DirectionalLight( 0xffffff, 3 );
			light.position.set( - 10, 18, 5 );
			light.castShadow = true;
			const d = 14;
			light.shadow.camera.left = - d;
			light.shadow.camera.right = d;
			light.shadow.camera.top = d;
			light.shadow.camera.bottom = - d;

			light.shadow.camera.near = 2;
			light.shadow.camera.far = 50;

			light.shadow.mapSize.x = 1024;
			light.shadow.mapSize.y = 1024;

			scene.add( light );

			stats = new Stats();
			stats.domElement.style.position = 'absolute';
			stats.domElement.style.top = '0px';
			container.appendChild( stats.domElement );

			//

			window.addEventListener( 'resize', onWindowResize );

		}

		function initPhysics() {

			// Physics configuration

			collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
			dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
			broadphase = new Ammo.btDbvtBroadphase();
			solver = new Ammo.btSequentialImpulseConstraintSolver();
			physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
			physicsWorld.setGravity( new Ammo.btVector3( 0, - gravityConstant, 0 ) );

			transformAux1 = new Ammo.btTransform();
			tempBtVec3_1 = new Ammo.btVector3( 0, 0, 0 );

		}

		function createObject( mass, halfExtents, pos, quat, material ) {

			const object = new THREE.Mesh( new THREE.BoxGeometry( halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2 ), material );
			object.position.copy( pos );
			object.quaternion.copy( quat );
			convexBreaker.prepareBreakableObject( object, mass, new THREE.Vector3(), new THREE.Vector3(), true );
			createDebrisFromBreakableObject( object );

		}

		function createObjects() {

			// Ground
			pos.set( 0, - 0.5, 0 );
			quat.set( 0, 0, 0, 1 );
			const ground = createParalellepipedWithPhysics( 40, 1, 40, 0, pos, quat, new THREE.MeshPhongMaterial( { color: 0xFFFFFF } ) );
			ground.receiveShadow = true;
			textureLoader.load( 'textures/grid.png', function ( texture ) {

				texture.wrapS = THREE.RepeatWrapping;
				texture.wrapT = THREE.RepeatWrapping;
				texture.repeat.set( 40, 40 );
				ground.material.map = texture;
				ground.material.needsUpdate = true;

			} );

			// Tower 1
			const towerMass = 1000;
			const towerHalfExtents = new THREE.Vector3( 2, 5, 2 );
			pos.set( - 8, 5, 0 );
			quat.set( 0, 0, 0, 1 );
			createObject( towerMass, towerHalfExtents, pos, quat, createMaterial( 0xB03014 ) );

			// Tower 2
			pos.set( 8, 5, 0 );
			quat.set( 0, 0, 0, 1 );
			createObject( towerMass, towerHalfExtents, pos, quat, createMaterial( 0xB03214 ) );

			//Bridge
			const bridgeMass = 100;
			const bridgeHalfExtents = new THREE.Vector3( 7, 0.2, 1.5 );
			pos.set( 0, 10.2, 0 );
			quat.set( 0, 0, 0, 1 );
			createObject( bridgeMass, bridgeHalfExtents, pos, quat, createMaterial( 0xB3B865 ) );

			// Stones
			const stoneMass = 120;
			const stoneHalfExtents = new THREE.Vector3( 1, 2, 0.15 );
			const numStones = 8;
			quat.set( 0, 0, 0, 1 );
			for ( let i = 0; i < numStones; i ++ ) {

				pos.set( 0, 2, 15 * ( 0.5 - i / ( numStones + 1 ) ) );

				createObject( stoneMass, stoneHalfExtents, pos, quat, createMaterial( 0xB0B0B0 ) );

			}

			// Mountain
			const mountainMass = 860;
			const mountainHalfExtents = new THREE.Vector3( 4, 5, 4 );
			pos.set( 5, mountainHalfExtents.y * 0.5, - 7 );
			quat.set( 0, 0, 0, 1 );
			const mountainPoints = [];
			mountainPoints.push( new THREE.Vector3( mountainHalfExtents.x, - mountainHalfExtents.y, mountainHalfExtents.z ) );
			mountainPoints.push( new THREE.Vector3( - mountainHalfExtents.x, - mountainHalfExtents.y, mountainHalfExtents.z ) );
			mountainPoints.push( new THREE.Vector3( mountainHalfExtents.x, - mountainHalfExtents.y, - mountainHalfExtents.z ) );
			mountainPoints.push( new THREE.Vector3( - mountainHalfExtents.x, - mountainHalfExtents.y, - mountainHalfExtents.z ) );
			mountainPoints.push( new THREE.Vector3( 0, mountainHalfExtents.y, 0 ) );
			const mountain = new THREE.Mesh( new ConvexGeometry( mountainPoints ), createMaterial( 0xB03814 ) );
			mountain.position.copy( pos );
			mountain.quaternion.copy( quat );
			convexBreaker.prepareBreakableObject( mountain, mountainMass, new THREE.Vector3(), new THREE.Vector3(), true );
			createDebrisFromBreakableObject( mountain );

		}

		function createParalellepipedWithPhysics( sx, sy, sz, mass, pos, quat, material ) {

			const object = new THREE.Mesh( new THREE.BoxGeometry( sx, sy, sz, 1, 1, 1 ), material );
			const shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
			shape.setMargin( margin );

			createRigidBody( object, shape, mass, pos, quat );

			return object;

		}

		function createDebrisFromBreakableObject( object ) {

			object.castShadow = true;
			object.receiveShadow = true;

			const shape = createConvexHullPhysicsShape( object.geometry.attributes.position.array );
			shape.setMargin( margin );

			const body = createRigidBody( object, shape, object.userData.mass, null, null, object.userData.velocity, object.userData.angularVelocity );

			// Set pointer back to the three object only in the debris objects
			const btVecUserData = new Ammo.btVector3( 0, 0, 0 );
			btVecUserData.threeObject = object;
			body.setUserPointer( btVecUserData );

		}

		function removeDebris( object ) {

			scene.remove( object );

			physicsWorld.removeRigidBody( object.userData.physicsBody );

		}

		function createConvexHullPhysicsShape( coords ) {

			const shape = new Ammo.btConvexHullShape();

			for ( let i = 0, il = coords.length; i < il; i += 3 ) {

				tempBtVec3_1.setValue( coords[ i ], coords[ i + 1 ], coords[ i + 2 ] );
				const lastOne = ( i >= ( il - 3 ) );
				shape.addPoint( tempBtVec3_1, lastOne );

			}

			return shape;

		}

		function createRigidBody( object, physicsShape, mass, pos, quat, vel, angVel ) {

			if ( pos ) {

				object.position.copy( pos );

			} else {

				pos = object.position;

			}

			if ( quat ) {

				object.quaternion.copy( quat );

			} else {

				quat = object.quaternion;

			}

			const transform = new Ammo.btTransform();
			transform.setIdentity();
			transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
			transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
			const motionState = new Ammo.btDefaultMotionState( transform );

			const localInertia = new Ammo.btVector3( 0, 0, 0 );
			physicsShape.calculateLocalInertia( mass, localInertia );

			const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
			const body = new Ammo.btRigidBody( rbInfo );

			body.setFriction( 0.5 );

			if ( vel ) {

				body.setLinearVelocity( new Ammo.btVector3( vel.x, vel.y, vel.z ) );

			}

			if ( angVel ) {

				body.setAngularVelocity( new Ammo.btVector3( angVel.x, angVel.y, angVel.z ) );

			}

			object.userData.physicsBody = body;
			object.userData.collided = false;

			scene.add( object );

			if ( mass > 0 ) {

				rigidBodies.push( object );

				// Disable deactivation
				body.setActivationState( 4 );

			}

			physicsWorld.addRigidBody( body );

			return body;

		}

		function createRandomColor() {

			return Math.floor( Math.random() * ( 1 << 24 ) );

		}

		function createMaterial( color ) {

			color = color || createRandomColor();
			return new THREE.MeshPhongMaterial( { color: color } );

		}

		function initInput() {

			window.addEventListener( 'pointerdown', function ( event ) {

				mouseCoords.set(
					( event.clientX / window.innerWidth ) * 2 - 1,
					- ( event.clientY / window.innerHeight ) * 2 + 1
				);

				raycaster.setFromCamera( mouseCoords, camera );

				// Creates a ball and throws it
				const ballMass = 35;
				const ballRadius = 0.4;

				const ball = new THREE.Mesh( new THREE.SphereGeometry( ballRadius, 14, 10 ), ballMaterial );
				ball.castShadow = true;
				ball.receiveShadow = true;
				const ballShape = new Ammo.btSphereShape( ballRadius );
				ballShape.setMargin( margin );
				pos.copy( raycaster.ray.direction );
				pos.add( raycaster.ray.origin );
				quat.set( 0, 0, 0, 1 );
				const ballBody = createRigidBody( ball, ballShape, ballMass, pos, quat );

				pos.copy( raycaster.ray.direction );
				pos.multiplyScalar( 24 );
				ballBody.setLinearVelocity( new Ammo.btVector3( pos.x, pos.y, pos.z ) );

			} );

		}

		function onWindowResize() {

			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();

			renderer.setSize( window.innerWidth, window.innerHeight );

		}

		function animate() {

			render();
			stats.update();

		}

		function render() {

			const deltaTime = clock.getDelta();

			updatePhysics( deltaTime );

			renderer.render( scene, camera );

		}

		function updatePhysics( deltaTime ) {

			// Step world
			physicsWorld.stepSimulation( deltaTime, 10 );

			// Update rigid bodies
			for ( let i = 0, il = rigidBodies.length; i < il; i ++ ) {

				const objThree = rigidBodies[ i ];
				const objPhys = objThree.userData.physicsBody;
				const ms = objPhys.getMotionState();

				if ( ms ) {

					ms.getWorldTransform( transformAux1 );
					const p = transformAux1.getOrigin();
					const q = transformAux1.getRotation();
					objThree.position.set( p.x(), p.y(), p.z() );
					objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

					objThree.userData.collided = false;

				}

			}

			for ( let i = 0, il = dispatcher.getNumManifolds(); i < il; i ++ ) {

				const contactManifold = dispatcher.getManifoldByIndexInternal( i );
				const rb0 = Ammo.castObject( contactManifold.getBody0(), Ammo.btRigidBody );
				const rb1 = Ammo.castObject( contactManifold.getBody1(), Ammo.btRigidBody );

				const threeObject0 = Ammo.castObject( rb0.getUserPointer(), Ammo.btVector3 ).threeObject;
				const threeObject1 = Ammo.castObject( rb1.getUserPointer(), Ammo.btVector3 ).threeObject;

				if ( ! threeObject0 && ! threeObject1 ) {

					continue;

				}

				const userData0 = threeObject0 ? threeObject0.userData : null;
				const userData1 = threeObject1 ? threeObject1.userData : null;

				const breakable0 = userData0 ? userData0.breakable : false;
				const breakable1 = userData1 ? userData1.breakable : false;

				const collided0 = userData0 ? userData0.collided : false;
				const collided1 = userData1 ? userData1.collided : false;

				if ( ( ! breakable0 && ! breakable1 ) || ( collided0 && collided1 ) ) {

					continue;

				}

				let contact = false;
				let maxImpulse = 0;
				for ( let j = 0, jl = contactManifold.getNumContacts(); j < jl; j ++ ) {

					const contactPoint = contactManifold.getContactPoint( j );

					if ( contactPoint.getDistance() < 0 ) {

						contact = true;
						const impulse = contactPoint.getAppliedImpulse();

						if ( impulse > maxImpulse ) {

							maxImpulse = impulse;
							const pos = contactPoint.get_m_positionWorldOnB();
							const normal = contactPoint.get_m_normalWorldOnB();
							impactPoint.set( pos.x(), pos.y(), pos.z() );
							impactNormal.set( normal.x(), normal.y(), normal.z() );

						}

						break;

					}

				}

				// If no point has contact, abort
				if ( ! contact ) continue;

				// Subdivision

				const fractureImpulse = 250;

				if ( breakable0 && ! collided0 && maxImpulse > fractureImpulse ) {

					const debris = convexBreaker.subdivideByImpact( threeObject0, impactPoint, impactNormal, 1, 2, 1.5 );

					const numObjects = debris.length;
					for ( let j = 0; j < numObjects; j ++ ) {

						const vel = rb0.getLinearVelocity();
						const angVel = rb0.getAngularVelocity();
						const fragment = debris[ j ];
						fragment.userData.velocity.set( vel.x(), vel.y(), vel.z() );
						fragment.userData.angularVelocity.set( angVel.x(), angVel.y(), angVel.z() );

						createDebrisFromBreakableObject( fragment );

					}

					objectsToRemove[ numObjectsToRemove ++ ] = threeObject0;
					userData0.collided = true;

				}

				if ( breakable1 && ! collided1 && maxImpulse > fractureImpulse ) {

					const debris = convexBreaker.subdivideByImpact( threeObject1, impactPoint, impactNormal, 1, 2, 1.5 );

					const numObjects = debris.length;
					for ( let j = 0; j < numObjects; j ++ ) {

						const vel = rb1.getLinearVelocity();
						const angVel = rb1.getAngularVelocity();
						const fragment = debris[ j ];
						fragment.userData.velocity.set( vel.x(), vel.y(), vel.z() );
						fragment.userData.angularVelocity.set( angVel.x(), angVel.y(), angVel.z() );

						createDebrisFromBreakableObject( fragment );

					}

					objectsToRemove[ numObjectsToRemove ++ ] = threeObject1;
					userData1.collided = true;

				}

			}

			for ( let i = 0; i < numObjectsToRemove; i ++ ) {

				removeDebris( objectsToRemove[ i ] );

			}

			numObjectsToRemove = 0;

		}
  }, []);
}

function Span(){
  useEffect(()=>{
    let container, gui, guiStatsEl;
		let camera, controls, scene, renderer, material;

		// gui

		const Method = {
			INSTANCED: 'INSTANCED',
			MERGED: 'MERGED',
			NAIVE: 'NAIVE'
		};

		const api = {
			method: Method.INSTANCED,
			count: 50
		};

		//

		init();
		//initMesh();
    initMeshFBX();

		//

		function clean() {

			const meshes = [];

			scene.traverse( function ( object ) {

				if ( object.isMesh ) meshes.push( object );

			} );

			for ( let i = 0; i < meshes.length; i ++ ) {

				const mesh = meshes[ i ];
				mesh.material.dispose();
				mesh.geometry.dispose();

				scene.remove( mesh );

			}

		}

		const randomizeMatrix = function () {

			const position = new THREE.Vector3();
			const quaternion = new THREE.Quaternion();
			const scale = new THREE.Vector3();

			return function ( matrix ) {

				position.x = Math.random() * 40 - 20;
				position.y = Math.random() * 40 - 20;
				position.z = Math.random() * 40 - 20;

				quaternion.random();

				scale.x = scale.y = scale.z = Math.random() * 1;

				matrix.compose( position, quaternion, scale );

			};

		}();

    function initMeshFBX() {
      clean();

      // Cargar el archivo FBX
      const loader = new FBXLoader();
      loader.load('./Silla.fbx', function (object) { // Cambia la ruta a tu archivo .fbx
          // El objeto cargado puede ser un Group o Mesh, dependiendo del FBX
          let geometry;
          let mesh;

          // Si el FBX contiene un solo Mesh, lo tomamos directamente
          if (object.isMesh) {
              mesh = object;
              geometry = mesh.geometry;
          } else {
              // Si es un Group, buscamos el primer Mesh dentro
              mesh = object.children.find(child => child.isMesh);
              if (mesh) {
                  geometry = mesh.geometry;
              } else {
                  console.error('No se encontró un Mesh en el archivo FBX');
                  return;
              }
          }

          // Material por defecto si no viene en el FBX o quieres sobrescribirlo
          material = new THREE.MeshNormalMaterial();
          mesh.material = material;

          // Asegurarse de que las normales estén calculadas
          geometry.computeVertexNormals();

          console.time(api.method + ' (build)');

          console.log(geometry)

          switch (api.method) {
              case Method.INSTANCED:
                  makeInstanced(geometry);
                  break;
              case Method.MERGED:
                  makeMerged(geometry);
                  break;
              case Method.NAIVE:
                  makeNaive(geometry);
                  break;
          }

          console.timeEnd(api.method + ' (build)');
      }, undefined, function (error) {
          console.error('Error al cargar el archivo FBX:', error);
      });
    }

		function initMesh() {

			clean();

			// make instances
			new THREE.BufferGeometryLoader()
				.load( 'suzanne_buffergeometry.json', function ( geometry ) {

					material = new THREE.MeshNormalMaterial();

					geometry.computeVertexNormals();

					console.time( api.method + ' (build)' );

					switch ( api.method ) {

						case Method.INSTANCED:
							makeInstanced( geometry );
							break;

						case Method.MERGED:
							makeMerged( geometry );
							break;

						case Method.NAIVE:
							makeNaive( geometry );
							break;

					}

					console.timeEnd( api.method + ' (build)' );

				} );

		}

		function makeInstanced( geometry ) {

			const matrix = new THREE.Matrix4();
			const mesh = new THREE.InstancedMesh( geometry, material, api.count );

			for ( let i = 0; i < api.count; i ++ ) {

				randomizeMatrix( matrix );
				mesh.setMatrixAt( i, matrix );

			}

      console.log(mesh)
			scene.add( mesh );

			//

			const geometryByteLength = getGeometryByteLength( geometry );

			guiStatsEl.innerHTML = [

				'<i>GPU draw calls</i>: 1',
				'<i>GPU memory</i>: ' + formatBytes( api.count * 16 + geometryByteLength, 2 )

			].join( '<br/>' );

		}

		function makeMerged( geometry ) {

			const geometries = [];
			const matrix = new THREE.Matrix4();

			for ( let i = 0; i < api.count; i ++ ) {

				randomizeMatrix( matrix );

				const instanceGeometry = geometry.clone();
				instanceGeometry.applyMatrix4( matrix );

				geometries.push( instanceGeometry );

			}

			const mergedGeometry = BufferGeometryUtils.mergeGeometries( geometries );

			scene.add( new THREE.Mesh( mergedGeometry, material ) );

			//

			guiStatsEl.innerHTML = [

				'<i>GPU draw calls</i>: 1',
				'<i>GPU memory</i>: ' + formatBytes( getGeometryByteLength( mergedGeometry ), 2 )

			].join( '<br/>' );

		}

		function makeNaive( geometry ) {

			const matrix = new THREE.Matrix4();

			for ( let i = 0; i < api.count; i ++ ) {

				randomizeMatrix( matrix );

				const mesh = new THREE.Mesh( geometry, material );
				mesh.applyMatrix4( matrix );

				scene.add( mesh );

			}

			//

			const geometryByteLength = getGeometryByteLength( geometry );

			guiStatsEl.innerHTML = [

				'<i>GPU draw calls</i>: ' + api.count,
				'<i>GPU memory</i>: ' + formatBytes( api.count * 16 + geometryByteLength, 2 )

			].join( '<br/>' );

		}

		function init() {

			const width = window.innerWidth;
			const height = window.innerHeight;

			// camera

			camera = new THREE.PerspectiveCamera( 70, width / height, 1, 100 );
			camera.position.z = 30;

			// renderer

			renderer = new THREE.WebGLRenderer( { antialias: true } );
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setSize( width, height );
			renderer.setAnimationLoop( animate );
			container = document.getElementById( 'container' );
			container.appendChild( renderer.domElement );

			// scene

			scene = new THREE.Scene();
			scene.background = new THREE.Color( 0xffffff );

			// controls

			controls = new OrbitControls( camera, renderer.domElement );
			controls.autoRotate = true;
      controls.enableZoom = false;
      controls.maxTargetRadius = 10;

			// gui

			gui = new GUI();
			gui.add( api, 'method', Method ).onChange( initMeshFBX );
			gui.add( api, 'count', 1, 100 ).step( 1 ).onChange( initMeshFBX );

			const perfFolder = gui.addFolder( 'Performance' );

			guiStatsEl = document.createElement( 'div' );
			guiStatsEl.classList.add( 'gui-stats' );

			perfFolder.$children.appendChild( guiStatsEl );
			perfFolder.open();

			// listeners

			window.addEventListener( 'resize', onWindowResize );

			Object.assign( window, { scene } );

		}

		//

		function onWindowResize() {

			const width = window.innerWidth;
			const height = window.innerHeight;

			camera.aspect = width / height;
			camera.updateProjectionMatrix();

			renderer.setSize( width, height );

		}

		function animate() {

			controls.update();

			renderer.render( scene, camera );

		}

		//

		function getGeometryByteLength( geometry ) {

			let total = 0;

			if ( geometry.index ) total += geometry.index.array.byteLength;

			for ( const name in geometry.attributes ) {

				total += geometry.attributes[ name ].array.byteLength;

			}

			return total;

		}

		// Source: https://stackoverflow.com/a/18650828/1314762
		function formatBytes( bytes, decimals ) {

			if ( bytes === 0 ) return '0 bytes';

			const k = 1024;
			const dm = decimals < 0 ? 0 : decimals;
			const sizes = [ 'bytes', 'KB', 'MB' ];

			const i = Math.floor( Math.log( bytes ) / Math.log( k ) );

			return parseFloat( ( bytes / Math.pow( k, i ) ).toFixed( dm ) ) + ' ' + sizes[ i ];

		}
  }, [])
}

export default function App() {
  const mountRef = useRef(null);
  CreateCubes(mountRef)
  Span()

  const mountRef2 = useRef(null);
  SimcityBuilder(mountRef2)
  //Aula()
  //Valorant()

  return (
    <>
      <Hero />
      <div id="container"></div>
      <Footer />
      <div ref={mountRef} />
      <Footer />
      <div ref={mountRef2} />
    </>
  )
}
