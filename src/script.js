import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Objects
 */
const object1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#ff0000' })
)
object1.position.x = - 2

const object2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#ff0000' })
)

const object3 = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#ff0000' })
)
object3.position.x = 2

const object4 = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#00ff00' })
)
scene.add(object4)

const player = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#0000bb' })
)
player.position.y = 1
player.position.z = 2
scene.add(player)

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(10,10),
    new THREE.MeshBasicMaterial({ color: '#bbbbbb' })
)
plane.position.y = 0
plane.rotation.x = - Math.PI * 0.5
scene.add(plane)
scene.add(object1, object2, object3)
/**
 * Raycaster
 */
const raycaster = new THREE.Raycaster()
// const rayOrigin = new THREE.Vector3(-3,0,0)
// const rayDir = new THREE.Vector3(1,0,0).normalize()
// raycaster.set(rayOrigin,rayDir)
// object1.updateMatrixWorld()
// object2.updateMatrixWorld()
// object3.updateMatrixWorld()
// const intersect = raycaster.intersectObjects([object1,object2,object3])
// console.log(intersect)
/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 5
camera.position.y = 5
camera.lookAt(plane.position)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Mouse and cursor
 */
let mouseX = 0
let mouseY = 0
window.addEventListener('mousemove',(event) =>{
    mouseX = event.clientX / sizes.width * 2 - 1
    mouseY = - (event.clientY / sizes.height) * 2 + 1
})


const generateCurvePoints = (initalPos,finalPos,angle,g,throwTime) =>{
    let points = []
    let velocity =  -(initalPos - finalPos)/throwTime - 1/2 * g * throwTime
    for (let t =0; t < 50;t++){
        const currTime = t/throwTime
        const point = initalPos + velocity * currTime + 1/2 * g * currTime * currTime
        
        points.push( new THREE.Vector3(point,0,0))
    }
    points = [new THREE.Vector3(initalPos,0,0),new THREE.Vector3(finalPos,0,0)]
    //console.log(points)
    var geometry = new THREE.BufferGeometry().setFromPoints(points);

    var material = new THREE.LineDashedMaterial({
        color: 0x00ffff,
        linewidth: 0.1,
        scale: 0.1,
        dashSize: 0.05,
        gapSize: 1
    });


    const curveObject = new THREE.Line(geometry, material);
    geometry.computeLineDistances()
    curveObject.computeLineDistances()
    
    return curveObject
}
const calc_parabola_vertex = (x1, y1, x2, y2, x3, y3) =>{

		var denom = (x1-x2) * (x1-x3) * (x2-x3);
		var A     = (x3 * (y2-y1) + x2 * (y1-y3) + x1 * (y3-y2)) / denom;
		var B     = (x3*x3 * (y1-y2) + x2*x2 * (y3-y1) + x1*x1 * (y2-y3)) / denom;
		var C     = (x2 * x3 * (x2-x3) * y1+x3 * x1 * (x3-x1) * y2+x1 * x2 * (x1-x2) * y3) / denom;

		return [A,B,C]
}

const generateCurvePointsInterpolation = (initalPos,finalPos,yMax,segments) =>{
    let points = []


    const coeff = calc_parabola_vertex(
        0,
        player.position.y,
        segments/2,
        yMax,
        segments,
        0
    )
    const a = coeff[0]
    const b = coeff[1]
    const c = coeff[2]
    for (let t =0; t < segments;t++){
        const displacementX = initalPos.x+((finalPos.x - initalPos.x)*t)/segments
        const displacementZ = initalPos.z+((finalPos.z - initalPos.z)*t)/segments
        
        let displacementY = 0
        displacementY = a * t*t + b * t + c
        points.push( new THREE.Vector3(displacementX,displacementY,displacementZ))
    }
    //console.log(points)
    var geometry = new THREE.BufferGeometry().setFromPoints(points);

    var material = new THREE.LineDashedMaterial({
        color: 0xffff00,
        linewidth: 5,
        scale: 1,
        dashSize: 3,
        gapSize: 1,

    });

    const curveObject = new THREE.LineSegments(geometry, material);
    curveObject.computeLineDistances()
    return curveObject
}

/**
 * 
 * Animate
 */
const clock = new THREE.Clock()
let curve = null
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Animate Objects
    object1.position.y = Math.sin(elapsedTime*0.3) * 1.5
    object2.position.y = Math.cos(elapsedTime*0.3) * 1.5
    object3.position.y = Math.sin(elapsedTime*0.7) * 1.5
    const objectsToTest = [object1,object2,object3]
    for (const objectTest of objectsToTest){
        objectTest.material.color.set('#ff0000')
    }
    // Raycast
    raycaster.setFromCamera(new THREE.Vector2(mouseX,mouseY),camera)
    //console.log(mouseX,mouseY)
    const intersects = raycaster.intersectObject(plane)
    //console.log(intersects)
    const initialPos = player.position
    const throwAngle = Math.PI/4
    const throwForce = 3
    const ballMass = 1
    let finalPos = 0
    for(const intersect of intersects){
        //intersect.object.material.color.set('#0000ff')
        
        finalPos = intersect.point 
        object4.position.set(finalPos.x,finalPos.y,finalPos.z)
    }
    if (curve){
        scene.remove(curve)
    }
    //curve = generateCurvePoints(initialPos.x,finalPos.x,throwAngle,-9.82,2)
    curve = generateCurvePointsInterpolation(initialPos,finalPos,3,50)
    curve.computeLineDistances()
    if (curve){
        scene.add(curve)
    }
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()