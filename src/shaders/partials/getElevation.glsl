uniform float uElevation;

#pragma glslify: getPerlinNoise2d = require('../partials/getPerlinNoise2d.glsl')

float getElevation(vec2 _position)
{
    float elevation = 0.0;

    // General elevation
    elevation += getPerlinNoise2d(_position * 0.3) * 0.5;
    
    // Smaller details
    elevation += getPerlinNoise2d(_position + 123.0) * 0.2;

    elevation *= uElevation;

    return elevation;
}

#pragma glslify: export(getElevation)