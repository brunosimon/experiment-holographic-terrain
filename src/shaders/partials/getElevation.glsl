uniform float uElevation;
uniform float uElevationValleyFrequency;
uniform float uElevationValley;
uniform float uElevationGeneral;
uniform float uElevationGeneralFrequency;
uniform float uElevationDetails;
uniform float uElevationDetailsFrequency;

#pragma glslify: getPerlinNoise2d = require('../partials/getPerlinNoise2d.glsl')

float getElevation(vec2 _position)
{
    float elevation = 0.0;

    // Valley
    float valleyStrength = cos(_position.y * uElevationValleyFrequency + 3.1415) * 0.5 + 0.5;
    elevation += valleyStrength * uElevationValley;

    // General elevation
    elevation += getPerlinNoise2d(_position * uElevationGeneralFrequency) * uElevationGeneral * (valleyStrength + 0.1);
    
    // Smaller details
    elevation += getPerlinNoise2d(_position * uElevationDetailsFrequency + 123.0) * uElevationDetails * (valleyStrength + 0.1);

    elevation *= uElevation;

    return elevation;
}

#pragma glslify: export(getElevation)