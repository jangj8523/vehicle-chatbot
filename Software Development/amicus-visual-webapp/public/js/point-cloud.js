(function() {
    'use strict';
    // 'To actually be able to display anything with Three.js, we need three things:
    // A scene, a camera, and a renderer so we can render the scene with the camera.'
    // - https://threejs.org/docs/#Manual/Introduction/Creating_a_scene

    var scene, camera, renderer;

    var container, HEIGHT,
        WIDTH, fieldOfView, aspectRatio,
        nearPlane, farPlane, stats,
        geometry, particleCount,
        i, h, color, size,
        materials = [],
        mouseX = 0,
        mouseY = 0,
        windowHalfX, windowHalfY, cameraZ,
        fogHex, fogDensity, parameters = {},
        parameterCount, particles,
        rem, secondDown;

    init();
    animate();

    function init() {

        HEIGHT = window.innerHeight;
        WIDTH = window.innerWidth;
        windowHalfX = WIDTH / 2;
        windowHalfY = HEIGHT / 2;

        fieldOfView = 75;
        aspectRatio = WIDTH / HEIGHT;
        nearPlane = 100;
        farPlane = 3000;

        rem = false;
        secondDown = false;

        /*  fieldOfView — Camera frustum vertical field of view.
    aspectRatio — Camera frustum aspect ratio.
    nearPlane — Camera frustum near plane.
    farPlane — Camera frustum far plane.

    - https://threejs.org/docs/#Reference/Cameras/PerspectiveCamera

    In geometry, a frustum (plural: frusta or frustums)
    is the portion of a solid (normally a cone or pyramid)
    that lies between two parallel planes cutting it. - wikipedia.      */

        cameraZ = farPlane / 3;
        fogHex = 0x000000; 
        fogDensity = 0.0007;

        camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
        camera.position.z = cameraZ;

        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(fogHex, fogDensity);

        container = document.createElement('div');
        document.body.appendChild(container);
        document.body.style.margin = 0;
        document.body.style.overflow = 'hidden';

        geometry = new THREE.Geometry();

        particleCount = 5000;

        for (i = 0; i < particleCount; i++) {

            var vertex = new THREE.Vector3();
            vertex.x = Math.random() * 2000 - 1000;
            vertex.y = Math.random() * 2000 - 1000;
            vertex.z = Math.random() * 2000 - 1000;
            geometry.vertices.push(vertex);
        }

        parameters = [
            [
                [0.1, 1, 0.5], 1
            ],
            [
                [0.1, 1, 0.5], 2
            ],
            [
                [0.1, 1, 0.5], 2
            ],
            [
                [0.1, 1, 1], 1
            ],
            [
                [0.1, 1, 1], 1
            ]
        ];
        parameterCount = parameters.length;

        for (i = 0; i < parameterCount; i++) {

            color = parameters[i][0];
            size = parameters[i][1];

            materials[i] = new THREE.PointCloudMaterial({
                size: size
            });
            particles = new THREE.PointCloud(geometry, materials[i]);
            particles.rotation.x = Math.random() * 6;
            particles.rotation.y = Math.random() * 6;
            particles.rotation.z = Math.random() * 6;
            scene.add(particles);
        }

        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(WIDTH, HEIGHT);

        container.appendChild(renderer.domElement);

        window.addEventListener('resize', onWindowResize, false);
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('keydown', onDocumentKeyDown, false);
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function render() {
        var time = Date.now() * 0.00005;

        camera.position.x += (mouseX - camera.position.x) * 0.05;
        camera.position.y += (-mouseY - camera.position.y) * 0.05;
        // if (rem == true) {
        //     camera.position.x = 0;
        //     camera.position.y = 0;
        // } else {
        //     camera.position.x += (mouseX - camera.position.x) * 0.05;
        //     camera.position.y += (-mouseY - camera.position.y) * 0.05;
        // }
        console.log("Camera X:")
        console.log(camera.position.x);
        console.log("Camera Y:");
        console.log(camera.position.y);
        camera.lookAt(scene.position);

        if (rem == true && secondDown == false) {
            for (i = 0; i < scene.children.length; i++) {
                var object = scene.children[i];
                if (object instanceof THREE.PointCloud) {
                    scene.remove(object);
                }
            }
            scene.children = [];
            geometry = new THREE.Geometry();

            particleCount = 5000;

            for (i = 0; i < particleCount; i++) {

                var vertex = new THREE.Vector3();
                vertex.x = Math.random() * 2000 - 1000;
                // vertex.y = Math.random() * 2000 - 1000;
                // vertex.z = Math.random() * 2000 - 1000;
                // vertex.x = 100;
                // vertex.y = 100;
                // vertex.z = 100;

                geometry.vertices.push(vertex);
            }

            parameters = [
                [
                    [0.1, 1, 0.5], 1
                ],
                [
                    [0.1, 1, 0.5], 2
                ],
                [
                    [0.1, 1, 0.5], 2
                ],
                [
                    [0.1, 1, 1], 1
                ],
                [
                    [0.1, 1, 1], 1
                ]
            ];
            parameterCount = parameters.length;

            for (i = 0; i < parameterCount; i++) {

                color = parameters[i][0];
                size = parameters[i][1];

                materials[i] = new THREE.PointCloudMaterial({
                    size: size
                });

                particles = new THREE.PointCloud(geometry, materials[i]);
                scene.add(particles);
            }
        } else if (secondDown == true && rem == true) {
            rem = false;
            secondDown = false;
            for (i = 0; i < scene.children.length; i++) {

                var object = scene.children[i];
                if (object instanceof THREE.PointCloud) {
                    scene.remove(object);
                }
            }
            scene.children = [];
            geometry = new THREE.Geometry();

            particleCount = 5000;

            for (i = 0; i < particleCount; i++) {

                var vertex = new THREE.Vector3();
                vertex.x = Math.random() * 2000 - 1000;
                vertex.y = Math.random() * 2000 - 1000;
                vertex.z = Math.random() * 2000 - 1000;
                // vertex.x = 100;
                // vertex.y = 100;
                // vertex.z = 100;

                geometry.vertices.push(vertex);
            }

            parameters = [
                [
                    [0.1, 1, 0.5], 1
                ],
                [
                    [0.1, 1, 0.5], 2
                ],
                [
                    [0.1, 1, 0.5], 2
                ],
                [
                    [0.1, 1, 1], 1
                ],
                [
                    [0.1, 1, 1], 1
                ]
            ];
            parameterCount = parameters.length;

            for (i = 0; i < parameterCount; i++) {

                color = parameters[i][0];
                size = parameters[i][1];

                materials[i] = new THREE.PointCloudMaterial({
                    size: size
                });

                particles = new THREE.PointCloud(geometry, materials[i]);
                scene.add(particles);
            }
        }

        for (i = 0; i < scene.children.length; i++) {

            var object = scene.children[i];

            if (object instanceof THREE.PointCloud) {
                // if (rem == true) {
                //     object.x = 100;
                //     object.y = 100;
                //     object.z = 100;
                // } else {
                    object.rotation.y = time * (i < 4 ? i + 1 : -(i + 1));
                //}
            }
        }

        for (i = 0; i < materials.length; i++) {

            color = parameters[i][0];

            h = (360 * (color[0] + time) % 360) / 360;
            materials[i].color.setHSL(h, color[1], color[2]);
        }

        renderer.render(scene, camera);
    }

    function onDocumentMouseMove(e) {
        mouseX = e.clientX - windowHalfX;
        mouseY = e.clientY - windowHalfY;
        //console.log(mouseX);
    }

    function onWindowResize() {

        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onDocumentKeyDown() {
        if (rem == false) {
            rem = true;
        } else if (secondDown == false) {
            secondDown = true;
        }
    }
})();
