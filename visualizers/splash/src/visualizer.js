'use strict';

const canvas = document.querySelector('canvas')
canvas.width = canvas.clientWidth
canvas.height = canvas.clientHeight

Array.prototype.getRandom = function () {
  return this[Math.floor(Math.random() * this.length)]
}

let splatColors = [{r: 0, g: 0.15, b: 0}]

let idleSplats

function idleSplatsFunction() {
  multipleSplats(parseInt(Math.random() * config.random_amount) + (config.random_amount / 2) + 1)
}

let config = {
  sim_resolution: 256,
  dye_resolution: 1024,
  density_dissipation: 0.97,
  velocity_dissipation: 0.98,
  pressure_dissipation: 0.8,
  pressure_iterations: 20,
  curl: 30,
  splat_radius: 0.3,
  shading: true,
  colorful: true,
  paused: false,
  back_color: {r: 0, g: 0, b: 0},
  transparent: false,
  bloom: true,
  bloom_iterations: 8,
  bloom_resolution: 256,
  bloom_intensity: 0.8,
  bloom_threshold: 0.6,
  bloom_soft_knee: 0.7,
  pointer_color: [{r: 0, g: 0.15, b: 0}],
  sound_sensitivity: 1,
  audio_responsive: true,
  freq_range: 8,
  freq_range_start: 0,
  idle_splats: false,
  random_amount: 10,
  random_internal: 1,
};

document.addEventListener("DOMContentLoaded", () => {
  window.visualizerPropertyListener(properties => {
    if (properties.bloom_intensity) config.bloom_intensity = properties.bloom_intensity.value;
    if (properties.bloom_threshold) config.bloom_threshold = properties.bloom_threshold.value;
    if (properties.colorful) config.colorful = properties.colorful.value;
    if (properties.density_diffusion) config.density_dissipation = properties.density_diffusion.value;
    if (properties.enable_bloom) config.bloom = properties.enable_bloom.value;
    if (properties.paused) config.paused = properties.paused.value;
    if (properties.pressure_diffusion) config.pressure_dissipation = properties.pressure_diffusion.value;
    if (properties.shading) config.shading = properties.shading.value;
    if (properties.splat_radius) config.splat_radius = properties.splat_radius.value;
    if (properties.velocity_diffusion) config.velocity_dissipation = properties.velocity_diffusion.value;
    if (properties.vorticity) config.curl = properties.vorticity.value;
    if (properties.sound_sensitivity) config.sound_sensitivity = properties.sound_sensitivity.value;
    if (properties.audio_responsive) config.audio_responsive = properties.audio_responsive.value;
    if (properties.simulation_resolution) {
      config.sim_resolution = properties.simulation_resolution.value;
      initFramebuffers();
    }
    if (properties.dye_resolution) {
      config.dye_resolution = properties.dye_resolution.value;
      initFramebuffers();
    }
    if (properties.splat_color) {
      splatColors[0] = rgbToPointerColor(properties.splat_color.value);
      if (!config.colorful) config.pointer_color = [splatColors[0]];
    }
    if (properties.splat_color_2) splatColors[1] = rgbToPointerColor(properties.splat_color_2.value);
    if (properties.splat_color_3) splatColors[2] = rgbToPointerColor(properties.splat_color_3.value);
    if (properties.splat_color_4) splatColors[3] = rgbToPointerColor(properties.splat_color_4.value);
    if (properties.splat_color_5) splatColors[4] = rgbToPointerColor(properties.splat_color_5.value);
    if (properties.background_color) {
      let color = window.convertToRGB(properties.background_color),
      r = color.r,
      g = color.g,
      b = color.b
      document.body.style.backgroundColor = properties.background_color
      config.back_color.r = r
      config.back_color.g = g
      config.back_color.b = b
    }
    if (properties.more_colors && !properties.more_colors.value) {
      config.pointer_color = [splatColors[0]];
    } else if (properties.more_colors && properties.more_colors.value) {
      config.pointer_color = splatColors;
    }
    if (properties.use_background_image) config.transparent = properties.use_background_image.value;
    if (properties.background_image) canvas.style.backgroundImage = `url("file:///${properties.background_image.value}")`;
    if (properties.repeat_background) canvas.style.backgroundRepeat = properties.repeat_background.value ? "repeat" : "no-repeat";
    if (properties.background_image_size) canvas.style.backgroundSize = properties.background_image_size.value;
    if (properties.frequency_range) {
      config.freq_range = properties.frequency_range.value;

      if (config.freq_range + config.freq_range_start > 61) {
        config.freq_range_start = 62 - config.freq_range;
      }
    }
    if (properties.frequency_range_start) {
      if (config.freq_range + properties.frequency_range_start.value > 61) {
        config.freq_range_start = 62 - config.freq_range;
      } else {
        config.freq_range_start = properties.frequency_range_start.value;
      }
    }
    if (properties.idle_random_splats) {
      config.idle_splats = properties.idle_random_splats.value;
      if (properties.idle_random_splats.value) {
        idleSplats = setInterval(idleSplatsFunction, config.random_internal * 1000);
      } else {
        clearInterval(idleSplats);
      }
    }
    if (properties.random_splat_interval) {
      config.random_internal = properties.random_splat_interval.value;
      if (config.idle_splats) {
        clearInterval(idleSplats);
        idleSplats = setInterval(idleSplatsFunction, config.random_internal * 1000);
      }
    }
    if (properties.random_splat_amount) {
      config.random_amount = properties.random_splat_amount.value;
      if (config.idle_splats) {
        clearInterval(idleSplats);
        idleSplats = setInterval(idleSplatsFunction, config.random_internal * 1000);
      }
    }
  });

  window.registerFFTDataListener(audioArray => {
    if (!config.audio_responsive) return;
    if (audioArray[0] > 5) return;

    let bass = 0.0;
    let half = Math.floor(audioArray.length / 2);

    for (let i = 0; i <= config.freq_range; i++) {
      bass += audioArray[i + config.freq_range_start];
      bass += audioArray[half + (i + config.freq_range_start)];
    }
    bass /= (config.freq_range * 2);
    multipleSplats(Math.floor((bass * config.sound_sensitivity) * 10));
  })
});

function indexOfMax(arr) {
  if (arr.length === 0) {
    return -1;
  }

  var max = arr[0];
  var maxIndex = 0;

  for (var i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      maxIndex = i;
      max = arr[i];
    }
  }

  return maxIndex;
}

class pointerPrototype {
  constructor() {
    this.id = -1;
    this.x = 0;
    this.y = 0;
    this.dx = 0;
    this.dy = 0;
    this.down = false;
    this.moved = false;
    this.color = config.colorful ? generateColor() : config.pointer_color.getRandom();
  }
}

let pointers = [];
let splatStack = [];
let bloomFramebuffers = [];
pointers.push(new pointerPrototype());

const {gl, ext} = getWebGLContext(canvas);

if (isMobile())
  config.shading = false;
if (!ext.supportLinearFiltering) {
  config.shading = false;
  config.bloom = false;
}

function getWebGLContext(canvas) {
  const params = {alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false};

  let gl = canvas.getContext('webgl2', params);
  const isWebGL2 = !!gl;
  if (!isWebGL2)
    gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);

  let halfFloat;
  let supportLinearFiltering;
  if (isWebGL2) {
    gl.getExtension('EXT_color_buffer_float');
    supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
  } else {
    halfFloat = gl.getExtension('OES_texture_half_float');
    supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
  let formatRGBA;
  let formatRG;
  let formatR;

  if (isWebGL2) {
    formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
    formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
    formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
  }
  else {
    formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
  }

  return {
    gl,
    ext: {
      formatRGBA,
      formatRG,
      formatR,
      halfFloatTexType,
      supportLinearFiltering
    }
  };
}

function getSupportedFormat(gl, internalFormat, format, type) {
  if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
    switch (internalFormat) {
      case gl.R16F:
        return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
      case gl.RG16F:
        return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
      default:
        return null;
    }
  }

  return {
    internalFormat,
    format
  }
}

function supportRenderTextureFormat(gl, internalFormat, format, type) {
  let texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

  let fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status != gl.FRAMEBUFFER_COMPLETE)
    return false;
  return true;
}

function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent);
}

class GLProgram {
  constructor(vertexShader, fragmentShader) {
    this.uniforms = {};
    this.program = gl.createProgram();

    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
      throw gl.getProgramInfoLog(this.program);

    const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      const uniformName = gl.getActiveUniform(this.program, i).name;
      this.uniforms[uniformName] = gl.getUniformLocation(this.program, uniformName);
    }
  }

  bind() {
    gl.useProgram(this.program);
  }
}

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw gl.getShaderInfoLog(shader);

  return shader;
};

const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
    precision highp float;

    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;

    void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`);

const clearShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;

    void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
    }
`);

const colorShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;

    uniform vec4 color;

    void main () {
        gl_FragColor = color;
    }
`);

const backgroundShader = compileShader(gl.FRAGMENT_SHADER, `
    void main () {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
`);

const displayShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
        vec3 C = texture2D(uTexture, vUv).rgb;
        float a = max(C.r, max(C.g, C.b));
        gl_FragColor = vec4(C, a);
    }
`);

const displayBloomShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform sampler2D uBloom;
    uniform sampler2D uDithering;
    uniform vec2 ditherScale;

    void main () {
        vec3 C = texture2D(uTexture, vUv).rgb;
        vec3 bloom = texture2D(uBloom, vUv).rgb;
        bloom = pow(bloom.rgb, vec3(1.0 / 2.2));
        C += bloom;
        float a = max(C.r, max(C.g, C.b));
        gl_FragColor = vec4(C, a);
    }
`);

const displayShadingShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform vec2 texelSize;

    void main () {
        vec3 L = texture2D(uTexture, vL).rgb;
        vec3 R = texture2D(uTexture, vR).rgb;
        vec3 T = texture2D(uTexture, vT).rgb;
        vec3 B = texture2D(uTexture, vB).rgb;
        vec3 C = texture2D(uTexture, vUv).rgb;

        float dx = length(R) - length(L);
        float dy = length(T) - length(B);

        vec3 n = normalize(vec3(dx, dy, length(texelSize)));
        vec3 l = vec3(0.0, 0.0, 1.0);

        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
        C.rgb *= diffuse;

        float a = max(C.r, max(C.g, C.b));
        gl_FragColor = vec4(C, a);
    }
`);

const displayBloomShadingShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform sampler2D uBloom;
    uniform sampler2D uDithering;
    uniform vec2 ditherScale;
    uniform vec2 texelSize;

    void main () {
        vec3 L = texture2D(uTexture, vL).rgb;
        vec3 R = texture2D(uTexture, vR).rgb;
        vec3 T = texture2D(uTexture, vT).rgb;
        vec3 B = texture2D(uTexture, vB).rgb;
        vec3 C = texture2D(uTexture, vUv).rgb;

        float dx = length(R) - length(L);
        float dy = length(T) - length(B);

        vec3 n = normalize(vec3(dx, dy, length(texelSize)));
        vec3 l = vec3(0.0, 0.0, 1.0);

        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
        C *= diffuse;

        vec3 bloom = texture2D(uBloom, vUv).rgb;
        bloom = pow(bloom.rgb, vec3(1.0 / 2.2));
        C += bloom;

        float a = max(C.r, max(C.g, C.b));
        gl_FragColor = vec4(C, a);
    }
`);

const bloomPrefilterShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform vec3 curve;
    uniform float threshold;

    void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        float br = max(c.r, max(c.g, c.b));
        float rq = clamp(br - curve.x, 0.0, curve.y);
        rq = curve.z * rq * rq;
        c *= max(rq, br - threshold) / max(br, 0.0001);
        gl_FragColor = vec4(c, 0.0);
    }
`);

const bloomBlurShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;

    void main () {
        vec4 sum = vec4(0.0);
        sum += texture2D(uTexture, vL);
        sum += texture2D(uTexture, vR);
        sum += texture2D(uTexture, vT);
        sum += texture2D(uTexture, vB);
        sum *= 0.25;
        gl_FragColor = sum;
    }
`);

const bloomFinalShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform float intensity;

    void main () {
        vec4 sum = vec4(0.0);
        sum += texture2D(uTexture, vL);
        sum += texture2D(uTexture, vR);
        sum += texture2D(uTexture, vT);
        sum += texture2D(uTexture, vB);
        sum *= 0.25;
        gl_FragColor = sum * intensity;
    }
`);

const splatShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;

    void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
    }
`);

const advectionManualFilteringShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 dyeTexelSize;
    uniform float dt;
    uniform float dissipation;

    vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
        vec2 st = uv / tsize - 0.5;

        vec2 iuv = floor(st);
        vec2 fuv = fract(st);

        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);

        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
    }

    void main () {
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
        gl_FragColor = dissipation * bilerp(uSource, coord, dyeTexelSize);
        gl_FragColor.a = 1.0;
    }
`);

const advectionShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform float dt;
    uniform float dissipation;

    void main () {
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        gl_FragColor = dissipation * texture2D(uSource, coord);
        gl_FragColor.a = 1.0;
    }
`);

const divergenceShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;

        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }

        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
`);

const curlShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }
`);

const vorticityShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;

    void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;

        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;

        vec2 vel = texture2D(uVelocity, vUv).xy;
        gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
    }
`);

const pressureShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;

    vec2 boundary (vec2 uv) {
        return uv;
        // uncomment if you use wrap or repeat texture mode
        // uv = min(max(uv, 0.0), 1.0);
        // return uv;
    }

    void main () {
        float L = texture2D(uPressure, boundary(vL)).x;
        float R = texture2D(uPressure, boundary(vR)).x;
        float T = texture2D(uPressure, boundary(vT)).x;
        float B = texture2D(uPressure, boundary(vB)).x;
        float C = texture2D(uPressure, vUv).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
`);

const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;

    vec2 boundary (vec2 uv) {
        return uv;
        // uv = min(max(uv, 0.0), 1.0);
        // return uv;
    }

    void main () {
        float L = texture2D(uPressure, boundary(vL)).x;
        float R = texture2D(uPressure, boundary(vR)).x;
        float T = texture2D(uPressure, boundary(vT)).x;
        float B = texture2D(uPressure, boundary(vB)).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`);

const blit = (() => {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  return (destination) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
})();

let simWidth;
let simHeight;
let dyeWidth;
let dyeHeight;
let density;
let velocity;
let divergence;
let curl;
let pressure;
let bloom;

let ditheringTexture = createTextureAsync(window.getGlobalFile('LDR_RGB1_0.png'));

const clearProgram = new GLProgram(baseVertexShader, clearShader);
const colorProgram = new GLProgram(baseVertexShader, colorShader);
const backgroundProgram = new GLProgram(baseVertexShader, backgroundShader);
const displayProgram = new GLProgram(baseVertexShader, displayShader);
const displayBloomProgram = new GLProgram(baseVertexShader, displayBloomShader);
const displayShadingProgram = new GLProgram(baseVertexShader, displayShadingShader);
const displayBloomShadingProgram = new GLProgram(baseVertexShader, displayBloomShadingShader);
const bloomPrefilterProgram = new GLProgram(baseVertexShader, bloomPrefilterShader);
const bloomBlurProgram = new GLProgram(baseVertexShader, bloomBlurShader);
const bloomFinalProgram = new GLProgram(baseVertexShader, bloomFinalShader);
const splatProgram = new GLProgram(baseVertexShader, splatShader);
const advectionProgram = new GLProgram(baseVertexShader, ext.supportLinearFiltering ? advectionShader : advectionManualFilteringShader);
const divergenceProgram = new GLProgram(baseVertexShader, divergenceShader);
const curlProgram = new GLProgram(baseVertexShader, curlShader);
const vorticityProgram = new GLProgram(baseVertexShader, vorticityShader);
const pressureProgram = new GLProgram(baseVertexShader, pressureShader);
const gradienSubtractProgram = new GLProgram(baseVertexShader, gradientSubtractShader);

function initFramebuffers() {
  let simRes = getResolution(config.sim_resolution);
  let dyeRes = getResolution(config.dye_resolution);

  simWidth = simRes.width;
  simHeight = simRes.height;
  dyeWidth = dyeRes.width;
  dyeHeight = dyeRes.height;

  const texType = ext.halfFloatTexType;
  const rgba = ext.formatRGBA;
  const rg = ext.formatRG;
  const r = ext.formatR;
  const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

  if (density == null)
    density = createDoubleFBO(dyeWidth, dyeHeight, rgba.internalFormat, rgba.format, texType, filtering);
  else
    density = resizeDoubleFBO(density, dyeWidth, dyeHeight, rgba.internalFormat, rgba.format, texType, filtering);

  if (velocity == null)
    velocity = createDoubleFBO(simWidth, simHeight, rg.internalFormat, rg.format, texType, filtering);
  else
    velocity = resizeDoubleFBO(velocity, simWidth, simHeight, rg.internalFormat, rg.format, texType, filtering);

  divergence = createFBO(simWidth, simHeight, r.internalFormat, r.format, texType, gl.NEAREST);
  curl = createFBO(simWidth, simHeight, r.internalFormat, r.format, texType, gl.NEAREST);
  pressure = createDoubleFBO(simWidth, simHeight, r.internalFormat, r.format, texType, gl.NEAREST);

  initBloomFramebuffers();
}

function initBloomFramebuffers() {
  let res = getResolution(config.bloom_resolution);

  const texType = ext.halfFloatTexType;
  const rgba = ext.formatRGBA;
  const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

  bloom = createFBO(res.width, res.height, rgba.internalFormat, rgba.format, texType, filtering);

  bloomFramebuffers.length = 0;
  for (let i = 0; i < config.bloom_iterations; i++) {
    let width = res.width >> (i + 1);
    let height = res.height >> (i + 1);

    if (width < 2 || height < 2) break;

    let fbo = createFBO(width, height, rgba.internalFormat, rgba.format, texType, filtering);
    bloomFramebuffers.push(fbo);
  }
}

function createFBO(w, h, internalFormat, format, type, param) {
  gl.activeTexture(gl.TEXTURE0);
  let texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

  let fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT);

  return {
    texture,
    fbo,
    width: w,
    height: h,
    attach(id) {
      gl.activeTexture(gl.TEXTURE0 + id);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return id;
    }
  };
}

function createDoubleFBO(w, h, internalFormat, format, type, param) {
  let fbo1 = createFBO(w, h, internalFormat, format, type, param);
  let fbo2 = createFBO(w, h, internalFormat, format, type, param);

  return {
    get read() {
      return fbo1;
    },
    set read(value) {
      fbo1 = value;
    },
    get write() {
      return fbo2;
    },
    set write(value) {
      fbo2 = value;
    },
    swap() {
      let temp = fbo1;
      fbo1 = fbo2;
      fbo2 = temp;
    }
  }
}

function resizeFBO(target, w, h, internalFormat, format, type, param) {
  let newFBO = createFBO(w, h, internalFormat, format, type, param);
  clearProgram.bind();
  gl.uniform1i(clearProgram.uniforms.uTexture, target.attach(0));
  gl.uniform1f(clearProgram.uniforms.value, 1);
  blit(newFBO.fbo);
  return newFBO;
}

function resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
  target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
  target.write = createFBO(w, h, internalFormat, format, type, param);
  return target;
}

function createTextureAsync(url) {
  let texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255]));

  let obj = {
    texture,
    width: 1,
    height: 1,
    attach(id) {
      gl.activeTexture(gl.TEXTURE0 + id);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return id;
    }
  };

  let image = new Image();
  image.onload = () => {
    obj.width = image.width;
    obj.height = image.height;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  };
  image.src = url;

  return obj;
}

initFramebuffers();
multipleSplats(parseInt(Math.random() * 20) + 3);

let lastColorChangeTime = Date.now();

update();

function update() {
  resizeCanvas();
  input();
  if (!config.paused)
    step(0.016);
  render(null);
  requestAnimationFrame(update);
}

function input() {
  if (splatStack.length > 0)
    multipleSplats(splatStack.pop());

  for (let i = 0; i < pointers.length; i++) {
    const p = pointers[i];
    if (p.moved) {
      splat(p.x, p.y, p.dx, p.dy, p.color);
      p.moved = false;
    }
  }

  if (lastColorChangeTime + 100 < Date.now()) {
    lastColorChangeTime = Date.now();
    for (let i = 0; i < pointers.length; i++) {
      const p = pointers[i];
      p.color = config.colorful ? generateColor() : config.pointer_color.getRandom();
    }
  }
}

function step(dt) {
  gl.disable(gl.BLEND);
  gl.viewport(0, 0, simWidth, simHeight);

  curlProgram.bind();
  gl.uniform2f(curlProgram.uniforms.texelSize, 1.0 / simWidth, 1.0 / simHeight);
  gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
  blit(curl.fbo);

  vorticityProgram.bind();
  gl.uniform2f(vorticityProgram.uniforms.texelSize, 1.0 / simWidth, 1.0 / simHeight);
  gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
  gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
  gl.uniform1f(vorticityProgram.uniforms.curl, config.curl);
  gl.uniform1f(vorticityProgram.uniforms.dt, dt);
  blit(velocity.write.fbo);
  velocity.swap();

  divergenceProgram.bind();
  gl.uniform2f(divergenceProgram.uniforms.texelSize, 1.0 / simWidth, 1.0 / simHeight);
  gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
  blit(divergence.fbo);

  clearProgram.bind();
  gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
  gl.uniform1f(clearProgram.uniforms.value, config.pressure_dissipation);
  blit(pressure.write.fbo);
  pressure.swap();

  pressureProgram.bind();
  gl.uniform2f(pressureProgram.uniforms.texelSize, 1.0 / simWidth, 1.0 / simHeight);
  gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
  for (let i = 0; i < config.pressure_iterations; i++) {
    gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
    blit(pressure.write.fbo);
    pressure.swap();
  }

  gradienSubtractProgram.bind();
  gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, 1.0 / simWidth, 1.0 / simHeight);
  gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
  gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
  blit(velocity.write.fbo);
  velocity.swap();

  advectionProgram.bind();
  gl.uniform2f(advectionProgram.uniforms.texelSize, 1.0 / simWidth, 1.0 / simHeight);
  if (!ext.supportLinearFiltering)
    gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, 1.0 / simWidth, 1.0 / simHeight);
  let velocityId = velocity.read.attach(0);
  gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
  gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
  gl.uniform1f(advectionProgram.uniforms.dt, dt);
  gl.uniform1f(advectionProgram.uniforms.dissipation, config.velocity_dissipation);
  blit(velocity.write.fbo);
  velocity.swap();

  gl.viewport(0, 0, dyeWidth, dyeHeight);

  if (!ext.supportLinearFiltering)
    gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, 1.0 / dyeWidth, 1.0 / dyeHeight);
  gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
  gl.uniform1i(advectionProgram.uniforms.uSource, density.read.attach(1));
  gl.uniform1f(advectionProgram.uniforms.dissipation, config.density_dissipation);
  blit(density.write.fbo);
  density.swap();
}

function render(target) {
  if (config.bloom)
    applyBloom(density.read, bloom);

  if (target == null || !config.transparent) {
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
  }
  else {
    gl.disable(gl.BLEND);
  }

  let width = target == null ? gl.drawingBufferWidth : dyeWidth;
  let height = target == null ? gl.drawingBufferHeight : dyeHeight;

  gl.viewport(0, 0, width, height);

  if (!config.transparent) {
    colorProgram.bind();
    //let bc = config.back_color;
    //gl.uniform4f(colorProgram.uniforms.color, bc.r / 255, bc.g / 255, bc.b / 255, 1);
    blit(target);
  }

  if (target == null && config.transparent) {
    backgroundProgram.bind();
    gl.uniform1f(backgroundProgram.uniforms.aspectRatio, canvas.width / canvas.height);
    blit(null);
  }

  if (config.shading) {
    let program = config.bloom ? displayBloomShadingProgram : displayShadingProgram;
    program.bind();
    gl.uniform2f(program.uniforms.texelSize, 1.0 / width, 1.0 / height);
    gl.uniform1i(program.uniforms.uTexture, density.read.attach(0));
    if (config.bloom) {
      gl.uniform1i(program.uniforms.uBloom, bloom.attach(1));
      gl.uniform1i(program.uniforms.uDithering, ditheringTexture.attach(2));
      let scale = getTextureScale(ditheringTexture, width, height);
      gl.uniform2f(program.uniforms.ditherScale, scale.x, scale.y);
    }
  }
  else {
    let program = config.bloom ? displayBloomProgram : displayProgram;
    program.bind();
    gl.uniform1i(program.uniforms.uTexture, density.read.attach(0));
    if (config.bloom) {
      gl.uniform1i(program.uniforms.uBloom, bloom.attach(1));
      gl.uniform1i(program.uniforms.uDithering, ditheringTexture.attach(2));
      let scale = getTextureScale(ditheringTexture, width, height);
      gl.uniform2f(program.uniforms.ditherScale, scale.x, scale.y);
    }
  }

  blit(target);
}

function applyBloom(source, destination) {
  if (bloomFramebuffers.length < 2)
    return;

  let last = destination;

  gl.disable(gl.BLEND);
  bloomPrefilterProgram.bind();
  let knee = config.bloom_threshold * config.bloom_soft_knee + 0.0001;
  let curve0 = config.bloom_threshold - knee;
  let curve1 = knee * 2;
  let curve2 = 0.25 / knee;
  gl.uniform3f(bloomPrefilterProgram.uniforms.curve, curve0, curve1, curve2);
  gl.uniform1f(bloomPrefilterProgram.uniforms.threshold, config.bloom_threshold);
  gl.uniform1i(bloomPrefilterProgram.uniforms.uTexture, source.attach(0));
  gl.viewport(0, 0, last.width, last.height);
  blit(last.fbo);

  bloomBlurProgram.bind();
  for (let i = 0; i < bloomFramebuffers.length; i++) {
    let dest = bloomFramebuffers[i];
    gl.uniform2f(bloomBlurProgram.uniforms.texelSize, 1.0 / last.width, 1.0 / last.height);
    gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
    gl.viewport(0, 0, dest.width, dest.height);
    blit(dest.fbo);
    last = dest;
  }

  gl.blendFunc(gl.ONE, gl.ONE);
  gl.enable(gl.BLEND);

  for (let i = bloomFramebuffers.length - 2; i >= 0; i--) {
    let baseTex = bloomFramebuffers[i];
    gl.uniform2f(bloomBlurProgram.uniforms.texelSize, 1.0 / last.width, 1.0 / last.height);
    gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
    gl.viewport(0, 0, baseTex.width, baseTex.height);
    blit(baseTex.fbo);
    last = baseTex;
  }

  gl.disable(gl.BLEND);
  bloomFinalProgram.bind();
  gl.uniform2f(bloomFinalProgram.uniforms.texelSize, 1.0 / last.width, 1.0 / last.height);
  gl.uniform1i(bloomFinalProgram.uniforms.uTexture, last.attach(0));
  gl.uniform1f(bloomFinalProgram.uniforms.intensity, config.bloom_intensity);
  gl.viewport(0, 0, destination.width, destination.height);
  blit(destination.fbo);
}

function splat(x, y, dx, dy, color) {
  gl.viewport(0, 0, simWidth, simHeight);
  splatProgram.bind();
  gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
  gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
  gl.uniform2f(splatProgram.uniforms.point, x / canvas.width, 1.0 - y / canvas.height);
  gl.uniform3f(splatProgram.uniforms.color, dx, -dy, 1.0);
  gl.uniform1f(splatProgram.uniforms.radius, config.splat_radius / 100.0);
  blit(velocity.write.fbo);
  velocity.swap();

  gl.viewport(0, 0, dyeWidth, dyeHeight);
  gl.uniform1i(splatProgram.uniforms.uTarget, density.read.attach(0));
  gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
  blit(density.write.fbo);
  density.swap();
}

function multipleSplats(amount) {
  for (let i = 0; i < amount; i++) {
    const color = config.colorful ? generateColor() : Object.assign({}, config.pointer_color.getRandom());
    color.r *= 10.0;
    color.g *= 10.0;
    color.b *= 10.0;
    const x = canvas.width * Math.random();
    const y = canvas.height * Math.random();
    const dx = 1000 * (Math.random() - 0.5);
    const dy = 1000 * (Math.random() - 0.5);
    splat(x, y, dx, dy, color);
  }
}

function resizeCanvas() {
  if (canvas.width != canvas.clientWidth || canvas.height != canvas.clientHeight) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    initFramebuffers();
  }
}

function generateColor() {
  let c = HSVtoRGB(Math.random(), 1.0, 1.0);
  c.r *= 0.15;
  c.g *= 0.15;
  c.b *= 0.15;
  return c;
}

function HSVtoRGB(h, s, v) {
  let r, g, b, i, f, p, q, t;
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  return {
    r,
    g,
    b
  };
}

function RGBToHue(r, g, b) {
  // Find greatest and smallest channel values
  let cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin,
    h = 0,
    s = 0,
    l = 0;

  // Calculate hue
  // No difference
  if (delta == 0)
    h = 0;
  // Red is max
  else if (cmax == r)
    h = ((g - b) / delta) % 6;
  // Green is max
  else if (cmax == g)
    h = (b - r) / delta + 2;
  // Blue is max
  else
    h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  // Make negative hues positive behind 360°
  if (h < 0)
    h += 360;

  return h;
}

function getResolution(resolution) {
  let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
  if (aspectRatio < 1)
    aspectRatio = 1.0 / aspectRatio;

  let max = Math.round(resolution * aspectRatio);
  let min = Math.round(resolution);

  if (gl.drawingBufferWidth > gl.drawingBufferHeight)
    return {width: max, height: min};
  else
    return {width: min, height: max};
}

function getTextureScale(texture, width, height) {
  return {
    x: width / texture.width,
    y: height / texture.height
  };
}

function rgbToPointerColor(color) {
  let c = window.convertToRGB(color);
  return {
    r: c.r * 0.15,
    g: c.g * 0.15,
    b: c.b * 0.15
  }
}