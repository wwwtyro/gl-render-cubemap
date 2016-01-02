#define SHADER_NAME noise.vert

attribute vec3 aPosition;

uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 vPosition;

void main() {
    gl_Position = uProjection * uView * vec4(aPosition, 1.0);
    vPosition = aPosition;
}
