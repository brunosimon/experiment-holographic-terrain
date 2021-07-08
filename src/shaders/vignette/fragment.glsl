uniform vec3 uColor;
uniform float uMultiplier;
uniform float uOffset;

varying vec2 vUv;

void main()
{
    float distanceToCenter = smoothstep(0.0, 1.0, length(vUv - 0.5));
    float alpha = distanceToCenter * uMultiplier + uOffset;
    gl_FragColor = vec4(uColor, alpha);
}