uniform sampler2D uTexture;
uniform float uTextureFrequency;

varying float vElevation;

void main()
{
    vec4 textureColor = texture2D(uTexture, vec2(0.0, vElevation * uTextureFrequency));

    // float alpha = mod(vElevation * 10.0, 1.0);
    // alpha = step(0.95, alpha);

    gl_FragColor = textureColor;
}