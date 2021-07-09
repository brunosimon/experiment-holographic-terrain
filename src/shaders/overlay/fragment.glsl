uniform vec3 uVignetteColor;
uniform float uVignetteMultiplier;
uniform float uVignetteOffset;
uniform vec3 uOverlayColor;
uniform float uOverlayAlpha;

varying vec2 vUv;

void main()
{
    float distanceToCenter = smoothstep(0.0, 1.0, length(vUv - 0.5));

    float vignetteStrength = clamp(distanceToCenter * uVignetteMultiplier + uVignetteOffset, 0.0, 1.0);

    vec3 color = mix(uVignetteColor, uOverlayColor, (1.0 - vignetteStrength) * uOverlayAlpha);

    float alpha = vignetteStrength + uOverlayAlpha;

    gl_FragColor = vec4(color, alpha);
}