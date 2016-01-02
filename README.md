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
var renderCubemap = require('gl-render-cubemap')

var canvases = renderCubemap({
  resolution: 1024,

  initialize: function (params) {
    return {
      program: glShader(params.gl, glslify('./noise.vert'), glslify('./noise.frag'))
    }
  },

  render: function (params, data) {
    var program = data.program

    var geometry = Geometry(params.gl)
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
  }
})

var cubemap = createTextureCube(gl, canvases)
```

## API

```js
var renderCubemap = require('gl-render-cubemap')
```

#### `var canvases = renderCubemap(params)`

Returns a set of canvas objects:
```
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

Takes an object `params`, which must contain the following fields:
```
{
  resolution: integer,

  initialize: function (params) {
    return {
      programs, geometries, textures, etc.
    }
  },

  render: function (params, data) {}
}
```

The `resolution` parameter defines the resolution of each square face of your cubemap.
This should be a power of two in most cases.

The `initialize` function is called by `renderCubemap` when it's ready for you to
initialize your scene. It will be called with an object that contains:

```
{
  gl: the gl context that will be used to render your scene,
  fov: (float, radians) the field of view you should use in your projection matrix,
  resolution: (integer) the resolution you provided to renderCubemap,
  aspect: (float) the aspect ratio you should use in your projection matrix
}
```

Use the `initialize` function to do all the setup for your scene, e.g., load
`glsl` programs, create geometries, prepare textures, etc. When you're done,
return all the state that you'll need for rendering your scene in an object.
In the example above, we create a program and return it for use later in the
`render` function.

The `render` function is used to render your scene into the cubemap. It is called
six times (once for each cubemap face) and is provided with a `params` and `data`
object. The `data` object is what you returned from the `initialize` function, and
so should contain all the objects you need to render your scene, like your programs,
geometries, textures, etc.

The `params` object contains the following fields:

```
{
  gl: the gl context that will be used to render your scene,
  fov: (float, radians) the field of view you should use in your projection matrix,
  resolution: (integer) the resolution you provided to renderCubemap,
  aspect: (float) the aspect ratio you should use in your projection matrix,
  forward: (vec3) the direction you should set your view matrix to face,
  up: (vec3) the up direction for your view matrix,
  quad: (flat position array) a convenience geometry for rendering with raycasting techniques
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
render: function (params, data) {
  var geometry = Geometry(params.gl)
    .attr('aPosition', params.quad)

  program.bind()
  geometry.bind(program)
  program.uniforms.uView = view
  program.uniforms.uProjection = projection
  geometry.draw()
}
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
