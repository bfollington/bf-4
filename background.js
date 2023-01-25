function fxhash() {
  return window.fxhash
}

function fxrand() {
  return Math.random()
}

function registerFeatures(features) {
  window.$fxhashFeatures = features
}

const alpha = fxrand()
const beta = fxrand()
const gamma = fxrand()

console.log(alpha, beta, gamma)

function setupCanvas(canvas) {
  // Get the device pixel ratio, falling back to 1.
  var dpr = window.devicePixelRatio || 1
  if (window.innerWidth / dpr < 600) dpr = 1
  // Get the size of the canvas in CSS pixels.
  var rect = canvas.getBoundingClientRect()
  // Give the canvas pixel dimensions of their CSS
  // size * the device pixel ratio.
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  var ctx = canvas.getContext("webgl")
  // Scale all drawing operations by the dpr, so you
  // don't have to worry about the difference.
  // ctx.scale(dpr, dpr);
  return ctx
}

fetch("shader.glsl")
  .then((res) => res.text())
  .then((fragCode) => {
    const canvas = document.querySelector("#shader")
    const gl = setupCanvas(canvas)

    const verts = [-1, 1, 1, 1, 1, -1, -1, -1]

    const indices = [0, 1, 3, 1, 2, 3]
    const vbuf = gl.createBuffer()

    gl.bindBuffer(gl.ARRAY_BUFFER, vbuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    const ibuf = gl.createBuffer()

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

    const vertCode =
      "attribute vec2 v_pos;" +
      "varying vec2 a_pos;" +
      "void main(void) {" +
      "a_pos = v_pos;" +
      "gl_Position = vec4(v_pos, 0.0, 1.0);" +
      "}"

    const vertShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertShader, vertCode)
    gl.compileShader(vertShader)

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragShader, fragCode)
    gl.compileShader(fragShader)

    const msg = gl.getShaderInfoLog(fragShader)

    if (msg) console.error(msg)

    const prog = gl.createProgram()

    gl.attachShader(prog, vertShader)
    gl.attachShader(prog, fragShader)
    gl.linkProgram(prog)
    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, vbuf)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf)
    const coord = gl.getAttribLocation(prog, "v_pos")
    gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(coord)

    gl.clearColor(0, 0, 0, 1)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.enable(gl.DEPTH_TEST)

    const alphaLoc = gl.getUniformLocation(prog, "iAlpha")
    const betaLoc = gl.getUniformLocation(prog, "iBeta")
    const gammaLoc = gl.getUniformLocation(prog, "iGamma")
    const timeLoc = gl.getUniformLocation(prog, "iTime")
    const mouseLoc = gl.getUniformLocation(prog, "iMouse")
    const gyroLoc = gl.getUniformLocation(prog, "iGyro")
    const resolutionLoc = gl.getUniformLocation(prog, "iResolution")

    const frame = (t) => {
      gl.uniform1f(alphaLoc, alpha)
      gl.uniform1f(betaLoc, beta)
      gl.uniform1f(gammaLoc, gamma)

      gl.uniform1f(timeLoc, t / 1000)
      gl.uniform2f(mouseLoc, window._shaderParams.mouseX, window._shaderParams.mouseY)
      gl.uniform3f(
        gyroLoc,
        window._shaderParams.gyroX,
        window._shaderParams.gyroY,
        window._shaderParams.gyroZ
      )
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)
      requestAnimationFrame(frame)
    }

    frame()
  })
  .catch(console.error)
