uniform float uElevation;

#pragma glslify: getPerlinNoise3d = require('../partials/getPerlinNoise3d.glsl')

float getElevation(vec2 _position)
{
    float elevation = 0.0;

    // General elevation
    elevation += getPerlinNoise3d(vec3(
        _position * 0.3,
        0.0
    )) * 0.5;
    
    // Smaller details
    elevation += getPerlinNoise3d(vec3(
        (_position + 123.0) * 1.0,
        0.0
    )) * 0.2;

    elevation *= uElevation;

    return elevation;
}

#pragma glslify: export(getElevation)