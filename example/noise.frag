#define SHADER_NAME noise.frag

precision highp float;

varying vec3 vPosition;

#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)

void main() {
    vec3 p = normalize(vPosition);
    float n = 0.5 * snoise3(p * 128.0) + 0.5;
    n = pow(n, 24.0);
    gl_FragColor = vec4(n*0.5,n*0.75,n, 1.0);
}
