import './style.css'
import gsap from 'gsap'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Guify from 'guify'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { BokehPass } from './Passes/BokehPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import terrainVertexShader from './shaders/terrain/vertex.glsl'
import terrainFragmentShader from './shaders/terrain/fragment.glsl'
import terrainDepthVertexShader from './shaders/terrainDepth/vertex.glsl'
import terrainDepthFragmentShader from './shaders/terrainDepth/fragment.glsl'
import overlayVertexShader from './shaders/overlay/vertex.glsl'
import overlayFragmentShader from './shaders/overlay/fragment.glsl'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Debug
 */
const gui = new Guify({
    align: 'right',
    theme: 'dark',
    width: '300px',
    barMode: 'none'
})
// gui.panel.ToggleVisible()

const guiDummy = {}
guiDummy.clearColor = '#080024'

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Update camera
    camera.instance.aspect = sizes.width / sizes.height
    camera.instance.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
    
    // Update effect composer
    effectComposer.setSize(sizes.width, sizes.height)
    effectComposer.setPixelRatio(sizes.pixelRatio)

    // Update passes
    bokehPass.renderTargetDepth.width = sizes.width * sizes.pixelRatio
    bokehPass.renderTargetDepth.height = sizes.height * sizes.pixelRatio
})

/**
 * Camera
 */
const camera = {}
camera.position = new THREE.Vector3()
camera.rotation = new THREE.Euler()
camera.rotation.reorder('YXZ')

// Base camera
camera.instance = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.instance.rotation.reorder('YXZ')
scene.add(camera.instance)

// Orbit controls
const orbitControls = new OrbitControls(camera.instance, canvas)
orbitControls.enabled = false
orbitControls.enableDamping = true

gui
    .Register({
        type: 'folder',
        label: 'camera',
        open: false
    })

gui
    .Register({
        folder: 'camera',
        object: orbitControls,
        property: 'enabled',
        type: 'checkbox',
        label: 'orbitControls.enabled'
    })

/**
 * Terrain
 */
gui
    .Register({
        type: 'folder',
        label: 'terrain',
        open: false
    })

const terrain = {}

// Texture
terrain.texture = {}
terrain.texture.visible = false
terrain.texture.linesCount = 5
terrain.texture.bigLineWidth = 0.08
terrain.texture.smallLineWidth = 0.01
terrain.texture.smallLineAlpha = 0.5
terrain.texture.width = 1
terrain.texture.height = 128
terrain.texture.canvas = document.createElement('canvas')
terrain.texture.canvas.width = terrain.texture.width
terrain.texture.canvas.height = terrain.texture.height
terrain.texture.canvas.style.position = 'fixed'
terrain.texture.canvas.style.top = 0
terrain.texture.canvas.style.left = 0
terrain.texture.canvas.style.width = '50px'
terrain.texture.canvas.style.height = `${terrain.texture.height}px`
terrain.texture.canvas.style.zIndex = 1

if(terrain.texture.visible)
{
    document.body.append(terrain.texture.canvas)
}

terrain.texture.context = terrain.texture.canvas.getContext('2d')

terrain.texture.instance = new THREE.CanvasTexture(terrain.texture.canvas)
terrain.texture.instance.wrapS = THREE.RepeatWrapping
terrain.texture.instance.wrapT = THREE.RepeatWrapping
terrain.texture.instance.magFilter = THREE.NearestFilter

terrain.texture.update = () =>
{
    terrain.texture.context.clearRect(0, 0, terrain.texture.width, terrain.texture.height)   

    // Big line
    const actualBigLineWidth = Math.round(terrain.texture.height * terrain.texture.bigLineWidth)
    terrain.texture.context.globalAlpha = 1
    terrain.texture.context.fillStyle = '#ffffff'

    terrain.texture.context.fillRect(
        0,
        0,
        terrain.texture.width,
        actualBigLineWidth
    )

    // Small lines
    const actualSmallLineWidth = Math.round(terrain.texture.height * terrain.texture.smallLineWidth)
    const smallLinesCount = terrain.texture.linesCount - 1

    for(let i = 0; i < smallLinesCount; i++)
    {
        terrain.texture.context.globalAlpha = terrain.texture.smallLineAlpha
        terrain.texture.context.fillStyle = '#00ffff'
        terrain.texture.context.fillRect(
            0,
            actualBigLineWidth + Math.round((terrain.texture.height - actualBigLineWidth) / terrain.texture.linesCount) * (i + 1),
            terrain.texture.width,
            actualSmallLineWidth
        )
    }

    // Update texture instance
    terrain.texture.instance.needsUpdate = true
}

terrain.texture.update()

gui
    .Register({
        folder: 'terrain',
        type: 'folder',
        label: 'terrainTexture',
        open: true
    })
    
gui
    .Register({
        folder: 'terrainTexture',
        object: terrain.texture,
        property: 'visible',
        type: 'checkbox',
        label: 'visible',
        onChange: () =>
        {
            if(terrain.texture.visible)
            {
                document.body.append(terrain.texture.canvas)
            }
            else
            {
                document.body.removeChild(terrain.texture.canvas)
            }
        }
    })

gui
    .Register({
        folder: 'terrainTexture',
        object: terrain.texture,
        property: 'linesCount',
        type: 'range',
        label: 'linesCount',
        min: 1,
        max: 10,
        step: 1,
        onChange: terrain.texture.update
    })

gui
    .Register({
        folder: 'terrainTexture',
        object: terrain.texture,
        property: 'bigLineWidth',
        type: 'range',
        label: 'bigLineWidth',
        min: 0,
        max: 0.5,
        step: 0.0001,
        onChange: terrain.texture.update
    })

gui
    .Register({
        folder: 'terrainTexture',
        object: terrain.texture,
        property: 'smallLineWidth',
        type: 'range',
        label: 'smallLineWidth',
        min: 0,
        max: 0.1,
        step: 0.0001,
        onChange: terrain.texture.update
    })

gui
    .Register({
        folder: 'terrainTexture',
        object: terrain.texture,
        property: 'smallLineAlpha',
        type: 'range',
        label: 'smallLineAlpha',
        min: 0,
        max: 1,
        step: 0.001,
        onChange: terrain.texture.update
    })

// Geometry
terrain.geometry = new THREE.PlaneGeometry(1, 1, 1000, 1000)
terrain.geometry.rotateX(- Math.PI * 0.5)

// Uniforms
terrain.uniforms = {
    uTexture: { value: terrain.texture.instance },
    uElevation: { value: 2 },
    uElevationValley: { value: 0.4 },
    uElevationValleyFrequency: { value: 1.5 },
    uElevationGeneral: { value: 0.2 },
    uElevationGeneralFrequency: { value: 0.2 },
    uElevationDetails: { value: 0.2 },
    uElevationDetailsFrequency: { value: 2.012 },
    uTextureFrequency: { value: 10 },
    uTextureOffset: { value: 0.585 },
    uTime: { value: 0 },
    uHslHue: { value: 1.0 },
    uHslHueOffset: { value: 0.0 },
    uHslHueFrequency: { value: 10.0 },
    uHslTimeFrequency: { value: 0.05 },
    uHslLightness: { value: 0.75 },
    uHslLightnessVariation: { value: 0.25 },
    uHslLightnessFrequency: { value: 20.0 }
}

gui
    .Register({
        folder: 'terrain',
        type: 'folder',
        label: 'terrainMaterial',
        open: true
    })

gui
    .Register({
        folder: 'terrainMaterial',
        object: terrain.uniforms.uElevation,
        property: 'value',
        type: 'range',
        label: 'uElevation',
        min: 0,
        max: 5,
        step: 0.001
    })

gui
    .Register({
        folder: 'terrainMaterial',
        object: terrain.uniforms.uElevationValley,
        property: 'value',
        type: 'range',
        label: 'uElevationValley',
        min: 0,
        max: 1,
        step: 0.001
    })

gui
    .Register({
        folder: 'terrainMaterial',
        object: terrain.uniforms.uElevationValleyFrequency,
        property: 'value',
        type: 'range',
        label: 'uElevationValleyFrequency',
        min: 0,
        max: 10,
        step: 0.001
    })

gui
    .Register({
        folder: 'terrainMaterial',
        object: terrain.uniforms.uElevationGeneral,
        property: 'value',
        type: 'range',
        label: 'uElevationGeneral',
        min: 0,
        max: 1,
        step: 0.001
    })

gui
    .Register({
        folder: 'terrainMaterial',
        object: terrain.uniforms.uElevationGeneralFrequency,
        property: 'value',
        type: 'range',
        label: 'uElevationGeneralFrequency',
        min: 0,
        max: 10,
        step: 0.001
    })

gui
    .Register({
        folder: 'terrainMaterial',
        object: terrain.uniforms.uElevationDetails,
        property: 'value',
        type: 'range',
        label: 'uElevationDetails',
        min: 0,
        max: 1,
        step: 0.001
    })

gui
    .Register({
        folder: 'terrainMaterial',
        object: terrain.uniforms.uElevationDetailsFrequency,
        property: 'value',
        type: 'range',
        label: 'uElevationDetailsFrequency',
        min: 0,
        max: 10,
        step: 0.001
    })

gui
    .Register({
        folder: 'terrainMaterial',
        object: terrain.uniforms.uTextureFrequency,
        property: 'value',
        type: 'range',
        label: 'uTextureFrequency',
        min: 0.01,
        max: 50,
        step: 0.01
    })

gui
    .Register({
        folder: 'terrainMaterial',
        object: terrain.uniforms.uTextureOffset,
        property: 'value',
        type: 'range',
        label: 'uTextureOffset',
        min: 0,
        max: 1,
        step: 0.001
    })

gui
    .Register({
        folder: 'terrainMaterial',
        object: terrain.uniforms.uHslHue,
        property: 'value',
        type: 'range',
        label: 'uHslHue',
        min: 0,
        max: 1,
        step: 0.001
    })

gui
    .Register({
        folder: 'terrainMaterial',
        object: terrain.uniforms.uHslHueOffset,
        property: 'value',
        type: 'range',
        label: 'uHslHueOffset',
        min: 0,
        max: 1,
        step: 0.001
    })

gui
    .Register({
        folder: 'terrainMaterial',
        object: terrain.uniforms.uHslHueFrequency,
        property: 'value',
        type: 'range',
        label: 'uHslHueFrequency',
        min: 0,
        max: 50,
        step: 0.01
    })
gui
    .Register({
        folder: 'terrainMaterial',
        object: terrain.uniforms.uHslTimeFrequency,
        property: 'value',
        type: 'range',
        label: 'uHslTimeFrequency',
        min: 0,
        max: 0.2,
        step: 0.001
    })
    
gui
    .Register({
        folder: 'terrainMaterial',
        object: terrain.uniforms.uHslLightness,
        property: 'value',
        type: 'range',
        label: 'uHslLightness',
        min: 0,
        max: 1,
        step: 0.001
    })
 
gui
    .Register({
        folder: 'terrainMaterial',
        object: terrain.uniforms.uHslLightnessVariation,
        property: 'value',
        type: 'range',
        label: 'uHslLightnessVariation',
        min: 0,
        max: 1,
        step: 0.001
    })
gui
    .Register({
        folder: 'terrainMaterial',
        object: terrain.uniforms.uHslLightnessFrequency,
        property: 'value',
        type: 'range',
        label: 'uHslLightnessFrequency',
        min: 0,
        max: 50,
        step: 0.01
    })

// Material
terrain.material = new THREE.ShaderMaterial({
    transparent: true,
    // blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
    uniforms: terrain.uniforms
})

// Depth material
const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.common,
    THREE.UniformsLib.displacementmap
])
for(const uniformKey in terrain.uniforms)
{
    uniforms[uniformKey] = terrain.uniforms[uniformKey]
}

terrain.depthMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: terrainDepthVertexShader,
    fragmentShader: terrainDepthFragmentShader
})

terrain.depthMaterial.depthPacking = THREE.RGBADepthPacking
terrain.depthMaterial.blending = THREE.NoBlending

// Mesh
terrain.mesh = new THREE.Mesh(terrain.geometry, terrain.material)
terrain.mesh.scale.set(10, 10, 10)
terrain.mesh.userData.depthMaterial = terrain.depthMaterial
scene.add(terrain.mesh)

/**
 * Overlay
 */
const overlay = {}

overlay.vignetteColor = {}
overlay.vignetteColor.value = '#4f1f96'
overlay.vignetteColor.instance = new THREE.Color(overlay.vignetteColor.value)

overlay.overlayColor = {}
overlay.overlayColor.value = '#130621'
overlay.overlayColor.instance = new THREE.Color(overlay.overlayColor.value)

overlay.geometry = new THREE.PlaneGeometry(2, 2)

overlay.material = new THREE.ShaderMaterial({
    uniforms:
    {
        uVignetteColor: { value: overlay.vignetteColor.instance },
        uVignetteMultiplier: { value: 1.16 },
        uVignetteOffset: { value: - 1 },
        uOverlayColor: { value: overlay.overlayColor.instance },
        uOverlayAlpha: { value: 1 }
    },
    vertexShader: overlayVertexShader,
    fragmentShader: overlayFragmentShader,
    transparent: true,
    depthTest: false
})
overlay.mesh = new THREE.Mesh(overlay.geometry, overlay.material)
overlay.mesh.userData.noBokeh = true
overlay.mesh.frustumCulled = false
scene.add(overlay.mesh)

window.requestAnimationFrame(() =>
{
    gsap.to(overlay.material.uniforms.uOverlayAlpha, { delay: 0.4, duration: 3, value: 0, ease: 'power2.out' })
    gsap.to(overlay.material.uniforms.uVignetteOffset, { delay: 0.4, duration: 3, value: - 0.165, ease: 'power2.out' })
})

gui
    .Register({
        type: 'folder',
        label: 'overlay',
        open: true
    })

gui
    .Register({
        folder: 'overlay',
        object: overlay.vignetteColor,
        property: 'value',
        type: 'color',
        label: 'vignetteColor',
        format: 'hex',
        onChange: () =>
        {
            overlay.vignetteColor.instance.set(overlay.vignetteColor.value)
        }
    })

gui
    .Register({
        folder: 'overlay',
        object: overlay.material.uniforms.uVignetteMultiplier,
        property: 'value',
        type: 'range',
        label: 'uVignetteMultiplier',
        min: 0,
        max: 5,
        step: 0.001
    })

gui
    .Register({
        folder: 'overlay',
        object: overlay.material.uniforms.uVignetteOffset,
        property: 'value',
        type: 'range',
        label: 'uVignetteOffset',
        min: - 2,
        max: 2,
        step: 0.001
    })

gui
    .Register({
        folder: 'overlay',
        object: overlay.overlayColor,
        property: 'value',
        type: 'color',
        label: 'overlayColor',
        format: 'hex',
        onChange: () =>
        {
            overlay.overlayColor.instance.set(overlay.overlayColor.value)
        }
    })

gui
    .Register({
        folder: 'overlay',
        object: overlay.material.uniforms.uOverlayAlpha,
        property: 'value',
        type: 'range',
        label: 'uOverlayAlpha',
        min: 0,
        max: 1,
        step: 0.001
    })

/**
 * Renderer
 */
// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    // antialias: true,
})
renderer.setClearColor(guiDummy.clearColor, 1)
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

gui
    .Register({
        type: 'folder',
        label: 'renderer',
        open: true
    })

gui
    .Register({
        folder: 'renderer',
        object: guiDummy,
        property: 'clearColor',
        type: 'color',
        label: 'clearColor',
        format: 'hex',
        onChange: () =>
        {
            renderer.setClearColor(guiDummy.clearColor, 1)
        }
    })

// Effect composer
const renderTarget = new THREE.WebGLMultisampleRenderTarget(800, 600, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    encoding: THREE.sRGBEncoding
})
const effectComposer = new EffectComposer(renderer)
effectComposer.setSize(sizes.width, sizes.height)
effectComposer.setPixelRatio(sizes.pixelRatio)

// Render pass
const renderPass = new RenderPass(scene, camera.instance)
effectComposer.addPass(renderPass)

// Bokeh pass
const bokehPass = new BokehPass(
    scene,
    camera.instance,
    {
        focus: 1.0,
        aperture: 0.015,
        maxblur: 0.01,

        width: sizes.width * sizes.pixelRatio,
        height: sizes.height * sizes.pixelRatio
    }
)

// bokehPass.enabled = false
effectComposer.addPass(bokehPass)

gui
    .Register({
        type: 'folder',
        label: 'bokehPass',
        open: true
    })

gui
    .Register({
        folder: 'bokehPass',
        object: bokehPass,
        property: 'enabled',
        type: 'checkbox',
        label: 'bokehPass'
    })
    
gui
    .Register({
        folder: 'bokehPass',
        object: bokehPass.materialBokeh.uniforms.focus,
        property: 'value',
        type: 'range',
        label: 'focus',
        min: 0,
        max: 10,
        step: 0.01
    })

gui
    .Register({
        folder: 'bokehPass',
        object: bokehPass.materialBokeh.uniforms.aperture,
        property: 'value',
        type: 'range',
        label: 'aperture',
        min: 0.0002,
        max: 0.1,
        step: 0.0001
    })

gui
    .Register({
        folder: 'bokehPass',
        object: bokehPass.materialBokeh.uniforms.maxblur,
        property: 'value',
        type: 'range',
        label: 'maxblur',
        min: 0,
        max: 0.02,
        step: 0.0001
    })

// Unreal bloom pass
const unrealBloomPass = new UnrealBloomPass(new THREE.Vector2(sizes.width, sizes.height), 1.5, 0.4, 0.85)
unrealBloomPass.enabled = false
effectComposer.addPass(unrealBloomPass)

gui
    .Register({
        type: 'folder',
        label: 'unrealBloomPass',
        open: true
    })

gui
    .Register({
        folder: 'unrealBloomPass',
        object: unrealBloomPass,
        property: 'enabled',
        type: 'checkbox',
        label: 'unrealBloomPass'
    })

gui
    .Register({
        folder: 'unrealBloomPass',
        object: unrealBloomPass,
        property: 'threshold',
        type: 'range',
        label: 'threshold',
        min: 0,
        max: 1,
        step: 0.0001
    })

gui
    .Register({
        folder: 'unrealBloomPass',
        object: unrealBloomPass,
        property: 'strength',
        type: 'range',
        label: 'strength',
        min: 0,
        max: 3,
        step: 0.0001
    })

gui
    .Register({
        folder: 'unrealBloomPass',
        object: unrealBloomPass,
        property: 'radius',
        type: 'range',
        label: 'radius',
        min: 0,
        max: 1,
        step: 0.0001
    })


/**
 * View
 */
const view = {}
view.index = 0
view.settings = [
    {
        position: { x: 0, y: 2.124, z: - 0.172 },
        rotation: { x: -1.489, y: - Math.PI, z: 0 },
        focus: 2.14,
        parallaxMultiplier: 0.25
    },
    {
        position: { x: 1, y: 1.1, z: 0 },
        rotation: { x: -0.833, y: 1.596, z: 1.651 },
        focus: 1.1,
        parallaxMultiplier: 0.12
    },
    {
        position: { x: 1, y: 0.87, z: - 0.97 },
        rotation: { x: - 0.638, y: 2.33, z: 0 },
        focus: 1.36,
        parallaxMultiplier: 0.12
    },
    {
        position: { x: -1.43, y: 0.33, z: -0.144 },
        rotation: { x: -0.312, y: -1.67, z: 0 },
        focus: 1.25,
        parallaxMultiplier: 0.12
    }
]
view.current = view.settings[view.index]

// Parallax
view.parallax = {}
view.parallax.target = {}
view.parallax.target.x = 0
view.parallax.target.y = 0
view.parallax.eased = {}
view.parallax.eased.x = 0
view.parallax.eased.y = 0
view.parallax.eased.multiplier = 4

window.addEventListener('mousemove', (_event) =>
{
    view.parallax.target.x = (_event.clientX / sizes.width - 0.5) * view.parallax.multiplier
    view.parallax.target.y = - (_event.clientY / sizes.height - 0.5) * view.parallax.multiplier
})

// Apply
view.apply = () =>
{
    // Camera
    camera.position.copy(view.current.position)
    camera.rotation.x = view.current.rotation.x
    camera.rotation.y = view.current.rotation.y
    
    // Bokeh
    bokehPass.materialBokeh.uniforms.focus.value = view.current.focus
    
    // Parallax
    view.parallax.multiplier = view.current.parallaxMultiplier    
}

// Change
view.change = (_index) =>
{
    view.index = _index
    view.current = view.settings[_index]

    // Show overlay
    gsap.to(
        overlay.material.uniforms.uOverlayAlpha,
        {
            duration: 1.25,
            value: 1,
            ease: 'power2.inOut',
            onComplete: () =>
            {
                view.apply()

                // Hide overlay
                gsap.to(
                    overlay.material.uniforms.uOverlayAlpha,
                    {
                        duration: 1,
                        value: 0,
                        ease: 'power2.inOut'
                    }
                )
            }
        }
    )
}

view.apply()

window.setInterval(() =>
{
    view.change((view.index + 1) % view.settings.length)
}, 7500)

gui
    .Register({
        type: 'folder',
        label: 'view',
        open: true
    })

for(const _settingIndex in view.settings)
{
    gui
        .Register({
            type: 'button',
            folder: 'view',
            label: `change(${_settingIndex})`,
            action: () =>
            {
                view.change(_settingIndex)
            }
        })
}

// Focus animation
const changeFocus = () =>
{
    gsap.to(
        bokehPass.materialBokeh.uniforms.focus,
        {
            duration: 0.5 + Math.random() * 3,
            delay: 0.5 + Math.random() * 1,
            ease: 'power2.inOut',
            onComplete: changeFocus,
            value: view.current.focus + Math.random() - 0.2
        }
    )
}

changeFocus()

/**
 * Presets
 */
const presets = {}
presets.settings = [
    {
        vignetteColor: '#4f1f96',
        overlayColor: '#130621',
        clearColor: '#080024',
        terrainHue: 1,
        terrainHueOffset: 0
    },
    {
        vignetteColor: '#590826',
        overlayColor: '#21060b',
        clearColor: '#240004',
        terrainHue: 0.145,
        terrainHueOffset: 0.86
    },
    {
        vignetteColor: '#1f6a96',
        overlayColor: '#050e1c',
        clearColor: '#000324',
        terrainHue: 0.12,
        terrainHueOffset: 0.5
    },
    {
        vignetteColor: '#1f9682',
        overlayColor: '#02100c',
        clearColor: '#00240c',
        terrainHue: 0.12,
        terrainHueOffset: 0.2
    }
]

presets.apply = (_index) =>
{
    const presetsSettings = presets.settings[_index]

    overlay.vignetteColor.instance.set(presetsSettings.vignetteColor)

    overlay.overlayColor.instance.set(presetsSettings.overlayColor)

    terrain.uniforms.uHslHue.value = presetsSettings.terrainHue
    terrain.uniforms.uHslHueOffset.value = presetsSettings.terrainHueOffset

    renderer.setClearColor(presetsSettings.clearColor, 1)
}

gui
    .Register({
        type: 'folder',
        label: 'presets',
        open: true
    })

for(const _presetsIndex in presets.settings)
{
    gui
        .Register({
            type: 'button',
            folder: 'presets',
            label: `apply(${_presetsIndex})`,
            action: () =>
            {
                presets.apply(_presetsIndex)
            }
        })
}

/**
 * Animate
 */
const clock = new THREE.Clock()
let lastElapsedTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - lastElapsedTime
    lastElapsedTime = elapsedTime

    // Update terrain
    terrain.uniforms.uTime.value = elapsedTime

    // Update controls
    if(orbitControls.enabled)
    {
        orbitControls.update()
    }

    // Camera
    camera.instance.position.copy(camera.position)

    view.parallax.eased.x += (view.parallax.target.x - view.parallax.eased.x) * deltaTime * view.parallax.eased.multiplier
    view.parallax.eased.y += (view.parallax.target.y - view.parallax.eased.y) * deltaTime * view.parallax.eased.multiplier
    camera.instance.translateX(view.parallax.eased.x)
    camera.instance.translateY(view.parallax.eased.y)

    camera.instance.rotation.x = camera.rotation.x
    camera.instance.rotation.y = camera.rotation.y

    // Render
    // renderer.render(scene, camera.instance)
    effectComposer.render()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()