# gl-render-cubemap

Renders a scene into a cubemap.

## Install

```sh
npm install gl-render-cubemap
```

## Example

```js
var mat4 = require('gl-mat4')
var Geometry = require('gl-geometry')
var glShader = require('gl-shader')
var glslify = require('glslify')
var createTextureCube = require('gl-texture-cube')
var CubemapRenderer = require('gl-render-cubemap')

var cmr = new CubemapRenderer(1024)

var program = glShader(cmr.gl, glslify('./noise.vert'), glslify('./noise.frag'))

var canvases = cmr.render(function renderFace(params) {
  var geometry = Geometry(cmr.gl)
    .attr('aPosition', params.quad)

  var view = mat4.create()
  mat4.lookAt(view, [0, 0, 0], params.forward, params.up)

  var projection = mat4.create()
  mat4.perspective(projection, params.fov, params.aspect, 0.01, 10.0)

  program.bind()
  geometry.bind(program)
  program.uniforms.uView = view
  program.uniforms.uProjection = projection
  geometry.draw()
})

var cubemap = createTextureCube(gl, canvases)
```

The general workflow is to:

1. Create a CubemapRenderer object.
2. Use the CubemapRenderer object's WebGL context to perform any needed
   preparations for rendering.
3. Call the CubemapRenderer object's `render` function with a function
   that will render your scene.

## API

```js
var CubemapRenderer = require('gl-render-cubemap')
```

#### `var cmr = new CubemapRenderer(resolution)`

Returns a CubemapRenderer object. This object has an attached `gl` field
which should be used (independent of any non-cubemap rendering) to set up
and render your cubemap.

Takes an integer `resolution` which defines the resolution of each face
of the cubemap.

#### `var canvases = cmr.render(function renderScene() {...})`

Returns a set of canvas objects:
```js
{
  pos: {
    x: canvas,
    y: canvas,
    z: canvas
  },
  neg: {
    x: canvas,
    y: canvas,
    z: canvas
  }
}
```

...which can be immediately consumed by
[gl-texture-cube](https://github.com/wwwtyro/gl-texture-cube).

Takes a `renderScene` function that is used to render your scene into the cubemap.
It is called six times (once for each cubemap face) and is provided with a `params`
object.

The `params` object contains the following fields:

```js
{
  fov: float, radians       // field of view you should use in your projection matrix
  resolution: integer       // resolution you provided to renderCubemap
  aspect: float             // aspect ratio you should use in your projection matrix
  forward: vec3             // direction you should set your view matrix to face
  up: vec3                  // up direction for your view matrix
  quad: flat position array // convenience geometry for rendering with raycasting techniques
}
```

With the exception of `quad`, most of the above should be pretty clear.
The `quad` object is a flat array of positions that represent the face
of the cubemap being rendered. You can use this to create a
[gl-geometry](https://github.com/hughsk/gl-geometry) for use in your
`glsl` program to easily calculate a ray from the origin into your
scene.

This pattern is used in the included starfield example:

#### Javascript
```js
var canvases = cmr.render(function (params) {
  var geometry = Geometry(params.gl)
    .attr('aPosition', params.quad)

  program.bind()
  geometry.bind(program)
  program.uniforms.uView = view
  program.uniforms.uProjection = projection
  geometry.draw()
});
```

#### Vertex Shader
```glsl
attribute vec3 aPosition;

uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 vPosition;

void main() {
    gl_Position = uProjection * uView * vec4(aPosition, 1.0);
    vPosition = aPosition;
}
```

#### Fragment Shader
```glsl
varying vec3 vPosition;

void main() {
    vec3 p = normalize(vPosition); // <-- This is the ray direction
                                   //     derived from the quad geometry.

    float n = 0.5 * snoise3(p * 128.0) + 0.5;
    n = pow(n, 24.0);
    gl_FragColor = vec4(n*0.5,n*0.75,n, 1.0);
}
```
