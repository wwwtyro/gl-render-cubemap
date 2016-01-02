'use strict'

/* global requestAnimationFrame */

var mat4 = require('gl-mat4')
var Geometry = require('gl-geometry')
var glShader = require('gl-shader')
var glslify = require('glslify')
var createTextureCube = require('gl-texture-cube')
var createSkybox = require('gl-skybox')

var renderCubemap = require('../index.js')

window.onload = function () {
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

  var canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.left = '0px'
  canvas.style.top = '0px'
  canvas.style.width = canvas.style.height = '100%'
  document.body.appendChild(canvas)

  var gl = canvas.getContext('webgl')
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)
  gl.cullFace(gl.BACK)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

  var cubemap = createTextureCube(gl, canvases)
  cubemap.generateMipmap()
  cubemap.minFilter = gl.LINEAR_MIPMAP_LINEAR
  cubemap.magFilter = gl.LINEAR

  var skybox = createSkybox(gl, cubemap)

  var view = mat4.create()
  var projection = mat4.create()

  gl.clearColor(1, 0, 1, 1)

  var tick = 0

  function render () {
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.viewport(0, 0, canvas.width, canvas.height)

    tick += 0.001
    mat4.lookAt(view, [0, 0, 0], [Math.cos(tick), Math.sin(tick), Math.sin(tick)], [0, 1, 0])
    mat4.perspective(projection, Math.PI / 4, canvas.width / canvas.height, 0.1, 200.0)

    skybox.draw({
      view: view,
      projection: projection
    })

    requestAnimationFrame(render)
  }

  render()
}
