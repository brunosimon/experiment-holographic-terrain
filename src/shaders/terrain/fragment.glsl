uniform sampler2D uTexture;
uniform float uTime;
uniform float uTextureFrequency;
uniform float uTextureOffset;
uniform float uHslHue;
uniform float uHslHueOffset;
uniform float uHslHueFrequency;
uniform float uHslTimeFrequency;
uniform float uHslLightness;
uniform float uHslLightnessVariation;
uniform float uHslLightnessFrequency;

varying float vElevation;
varying vec2 vUv;

#pragma glslify: getElevation = require('../partials/getElevation.glsl')
#pragma glslify: hslToRgb = require('../partials/hslToRgb.glsl')
#pragma glslify: getPerlinNoise2d = require('../partials/getPerlinNoise2d.glsl')

vec3 getRainbowColor()
{
    vec2 uv = vUv;
    uv.y += uTime * uHslTimeFrequency;

    float hue = uHslHueOffset + getPerlinNoise2d(uv * uHslHueFrequency) * uHslHue;
    float lightness = uHslLightness + getPerlinNoise2d(uv * uHslLightnessFrequency + 1234.5) * uHslLightnessVariation;
    vec3 hslColor = vec3(hue, 1.0, lightness);
    vec3 rainbowColor = hslToRgb(hslColor);

    return rainbowColor;
}

void main()
{
    vec3 uColor = vec3(1.0, 1.0, 1.0);

    vec3 rainbowColor = getRainbowColor();
    vec4 textureColor = texture2D(uTexture, vec2(0.0, vElevation * uTextureFrequency + uTextureOffset));

    vec3 color = mix(uColor, rainbowColor, textureColor.r);

    float fadeSideAmplitude = 0.2;
    float sideAlpha = 1.0 - max(
        smoothstep(0.5 - fadeSideAmplitude, 0.5, abs(vUv.x - 0.5)),
        smoothstep(0.5 - fadeSideAmplitude, 0.5, abs(vUv.y - 0.5))
    );

    gl_FragColor = vec4(color, textureColor.a * sideAlpha);
}