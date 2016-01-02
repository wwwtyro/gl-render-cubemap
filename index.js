'use strict'

var mat4 = require('gl-mat4')
var tform = require('geo-3d-transform-mat4')

module.exports = renderCubemap

function renderCubemap (opts) {
  var canvas = document.createElement('canvas')
  canvas.width = canvas.height = opts.resolution
  var gl = canvas.getContext('webgl')

  var params = {
    gl: gl,
    fov: Math.PI / 2,
    resolution: opts.resolution,
    aspect: 1
  }

  var data = opts.initialize(params)

  var canvases = {
    pos: {},
    neg: {}
  }

  var signs = ['pos', 'neg']
  var axes = ['x', 'y', 'z']

  // Create the six canvases and their contexts.
  for (var i = 0; i < signs.length; i++) {
    var sign = signs[i]
    for (var j = 0; j < axes.length; j++) {
      var axis = axes[j]
      var c = document.createElement('canvas')
      c.width = c.height = opts.resolution
      c.ctx = c.getContext('2d')
      canvases[sign][axis] = c
    }
  }

  // Create a set of rotations to apply to the
  // quad geometry to define the six cubemap
  // faces.
  var rots = {
    pos: {},
    neg: {}
  }

  var rot

  rot = mat4.create()
  rots.pos.x = mat4.rotateY(rot, rot, -Math.PI / 2)
  rot = mat4.create()
  rots.pos.y = mat4.rotateX(rot, rot, Math.PI / 2)
  rot = mat4.create()
  rots.pos.z = mat4.rotateY(rot, rot, Math.PI)
  rot = mat4.create()
  rots.neg.x = mat4.rotateY(rot, rot, Math.PI / 2)
  rot = mat4.create()
  rots.neg.y = mat4.rotateX(rot, rot, -Math.PI / 2)
  rots.neg.z = mat4.create()

  // This is the quad geometry we'll be rotating
  // and passing to the user's render function
  // to ease raycasting techniques.
  var positions = [
    -1, -1, -1,
    1, -1, -1,
    1, 1, -1,
    -1, -1, -1,
    1, 1, -1,
    -1, 1, -1
  ]

  // Define the set of orientations and quad geometries
  // that we'll be passing to the user's render function.
  var configs = {
    pos: {
      x: {
        forward: [1, 0, 0],
        up: [0, 1, 0],
        quad: tform(positions, rots.pos.x)
      },
      y: {
        forward: [0, 1, 0],
        up: [0, 0, 1],
        quad: tform(positions, rots.pos.y)
      },
      z: {
        forward: [0, 0, 1],
        up: [0, 1, 0],
        quad: tform(positions, rots.pos.z)
      }
    },
    neg: {
      x: {
        forward: [-1, 0, 0],
        up: [0, 1, 0],
        quad: tform(positions, rots.neg.x)
      },
      y: {
        forward: [0, -1, 0],
        up: [0, 0, -1],
        quad: tform(positions, rots.neg.y)
      },
      z: {
        forward: [0, 0, -1],
        up: [0, 1, 0],
        quad: tform(positions, rots.neg.z)
      }
    }
  }

  // Call the user's render function and store
  // the canvases.
  for (i = 0; i < signs.length; i++) {
    sign = signs[i]
    for (j = 0; j < axes.length; j++) {
      axis = axes[j]
      var config = configs[sign][axis]
      params.forward = config.forward
      params.up = config.up
      params.quad = config.quad
      opts.render(params, data)
      c = canvases[sign][axis]
      // Rotate some of the canvases unintuitively
      // to comply with WebGL's (Renderman's?)
      // cubemap layout.
      if (axis === 'x' || axis === 'z') {
        c.ctx.translate(opts.resolution, opts.resolution)
        c.ctx.rotate(Math.PI)
      }
      c.ctx.drawImage(canvas, 0, 0)
    }
  }

  return canvases
}
