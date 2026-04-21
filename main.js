"use strict";

let gl;
let surface, videoPlane, lightSphere;
let shProgram, spaceball, stereoCam;

let zoom = 50.0;
let uMaxMultiplier = 2.4;
let lightAngle = 0.0;

let videoElement, videoTexture;
let texDiffuse, texSpecular, texNormal;
let isCameraStarted = false;


let phoneRotationMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

let sensorWebSocket = null;

function getRotationMatrixFromVector(rv) {
  let q1 = rv[0]; // x
  let q2 = rv[1]; // y
  let q3 = rv[2]; // z
  let q0 = rv.length >= 4 ? rv[3] : 0; // w

  if (rv.length < 4) {
    q0 = 1 - q1 * q1 - q2 * q2 - q3 * q3;
    q0 = q0 > 0 ? Math.sqrt(q0) : 0;
  }

  let sq_q1 = 2 * q1 * q1;
  let sq_q2 = 2 * q2 * q2;
  let sq_q3 = 2 * q3 * q3;
  let q1_q2 = 2 * q1 * q2;
  let q3_q0 = 2 * q3 * q0;
  let q1_q3 = 2 * q1 * q3;
  let q2_q0 = 2 * q2 * q0;
  let q2_q3 = 2 * q2 * q3;
  let q1_q0 = 2 * q1 * q0;

  return [
    1 - sq_q2 - sq_q3,
    q1_q2 + q3_q0,
    q1_q3 - q2_q0,
    0,
    q1_q2 - q3_q0,
    1 - sq_q1 - sq_q3,
    q2_q3 + q1_q0,
    0,
    q1_q3 + q2_q0,
    q2_q3 - q1_q0,
    1 - sq_q1 - sq_q2,
    0,
    0,
    0,
    0,
    1,
  ];
}

function connectSensorServer(ipAddress) {
  if (sensorWebSocket) {
    sensorWebSocket.close();
  }

  let cleanIp = ipAddress.split(':')[0];
  const finalUrl = `ws://${cleanIp}:8080/sensor/connect?type=android.sensor.game_rotation_vector`;
  
  sensorWebSocket = new WebSocket(finalUrl);

  sensorWebSocket.onopen = () => {
    console.log("Успішно підключено до сенсора game_rotation_vector!");
  };

  sensorWebSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data && data.values && Array.isArray(data.values)) {
        let qx = data.values[0];
        let qy = data.values[1];
        let qz = data.values[2];
        let qw = data.values[3];

        let remappedValues = [qx, qz, -qy, qw];

        let rawMatrix = getRotationMatrixFromVector(remappedValues);

        let compensationMatrix = m4.xRotation(-Math.PI / 2); 

        phoneRotationMatrix = m4.multiply(compensationMatrix, rawMatrix);
      }
    } catch (e) {
      console.error("Помилка обробки:", e);
    }
  };

  sensorWebSocket.onerror = (err) => {
    console.error("Помилка WebSocket:", err);
  };
}

window.startTUIConnection = function () {
  const ip = document.getElementById("phoneIpInput").value;
  if (ip) {
    connectSensorServer(ip);
  } else {
    alert("Будь ласка, введіть IP адресу з додатку Sensor Server.");
  }
};


function deg2rad(angle) {
  return (angle * Math.PI) / 180;
}

function loadTexture(url, defaultColor) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array(defaultColor),
  );

  const image = new Image();
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  };
  image.src = url;
  return texture;
}

function startWebcam() {
  if (isCameraStarted) return;

  let btn = document.getElementById("btnStartCamera");
  let checkbox = document.getElementById("showWebcamBg");

  btn.textContent = "Starting...";
  btn.disabled = true;

  videoElement = document.getElementById("webcam");
  videoTexture = gl.createTexture();

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      videoElement.srcObject = stream;
      isCameraStarted = true;
      btn.textContent = "Camera Running";
      btn.style.backgroundColor = "#4CAF50";
      checkbox.disabled = false;
    })
    .catch((err) => {
      console.error("Camera error:", err);
      alert("Не вдалося отримати доступ до камери.");
      btn.textContent = "Start Web Camera";
      btn.disabled = false;
    });

  gl.bindTexture(gl.TEXTURE_2D, videoTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
}

function updateWebcamTexture() {
  if (isCameraStarted && videoElement && videoElement.readyState >= 2) {
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      videoElement,
    );
  }
}

function updateUmax(value) {
  uMaxMultiplier = parseFloat(value);
  document.getElementById("uMaxValue").textContent = value + "π";
  updateSurface();
}
function updateUSteps(v) {
  document.getElementById("uSliderValue").textContent = v;
  updateSurface();
}
function updateVSteps(v) {
  document.getElementById("vSliderValue").textContent = v;
  updateSurface();
}

function updateSurface() {
  let d = CreateSurfaceData(uMaxMultiplier);
  surface.BufferData(
    d.vertices,
    d.triangles,
    d.lines,
    d.texCoords,
    d.normals,
    d.tangents,
  );
  if (spaceball) spaceball.setRotationCenter(d.centerOfMass);
}

function draw() {
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  updateWebcamTexture();

  lightAngle += 0.02;
  let lightRadius = 10.0;
  let lightWorldPos = [
    Math.cos(lightAngle) * lightRadius,
    Math.sin(lightAngle) * lightRadius,
    -10.0,
  ];

  let eyeSep = parseFloat(
    document.getElementById("eyeSeparation")?.value || 0.7,
  );
  let fov = parseFloat(document.getElementById("fov")?.value || 45.0);
  let nearClip = parseFloat(document.getElementById("nearClip")?.value || 10.0);
  let conv = parseFloat(
    document.getElementById("convergence")?.value || 2000.0,
  );
  let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

  stereoCam = new StereoCamera(conv, eyeSep, aspect, fov, nearClip, 20000.0);

  let modelView = spaceball.getViewMatrix();
  let rotateToVertical = m4.axisRotation([1, 0, 0], Math.PI / 2);
  modelView = m4.multiply(rotateToVertical, modelView);

  modelView = m4.multiply(modelView, phoneRotationMatrix);

  let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
  let translateToPointZero = m4.translation(0, 0, -zoom);
  modelView = m4.multiply(
    translateToPointZero,
    m4.multiply(rotateToPointZero, modelView),
  );

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, videoTexture);
  gl.uniform1i(shProgram.iVideoTex, 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texDiffuse);
  gl.uniform1i(shProgram.iDiffuseMap, 1);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texSpecular);
  gl.uniform1i(shProgram.iSpecularMap, 2);
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, texNormal);
  gl.uniform1i(shProgram.iNormalMap, 3);

  gl.uniform1i(
    shProgram.iUseDiffuse,
    document.getElementById("useDiffuseMap")?.checked ? 1 : 0,
  );
  gl.uniform1i(
    shProgram.iUseSpecular,
    document.getElementById("useSpecularMap")?.checked ? 1 : 0,
  );
  gl.uniform1i(
    shProgram.iUseNormal,
    document.getElementById("useNormalMap")?.checked ? 1 : 0,
  );

  // Відео фон
  let showWebcamBg = document.getElementById("showWebcamBg")?.checked;
  if (isCameraStarted && showWebcamBg) {
    gl.colorMask(true, true, true, true);
    gl.disable(gl.DEPTH_TEST);
    gl.uniform1i(shProgram.iIsVideo, 1);
    videoPlane.DrawTriangles();
    gl.enable(gl.DEPTH_TEST);
    gl.uniform1i(shProgram.iIsVideo, 0);
  }

  function DrawEye(projMatrix, translateMatrix) {
    let eyeModelView = m4.multiply(translateMatrix, modelView);
    let eyeMVP = m4.multiply(projMatrix, eyeModelView);
    let eyeNormalMat = m4.transpose(m4.inverse(eyeModelView));
    let lightViewPos = m4.transformPoint(eyeModelView, lightWorldPos);

    // Малюємо світло
    // let lightTransMat = m4.translation(
    //   lightWorldPos[0],
    //   lightWorldPos[1],
    //   lightWorldPos[2],
    // );
    // let lightObjMV = m4.multiply(eyeModelView, lightTransMat);
    // let lightObjMVP = m4.multiply(projMatrix, lightObjMV);
    // gl.uniformMatrix4fv(
    //   shProgram.iModelViewProjectionMatrix,
    //   false,
    //   lightObjMVP,
    // );
    // gl.uniform1i(shProgram.iIsSolidColor, 1);
    // gl.uniform4fv(shProgram.iColor, [1.0, 1.0, 0.6, 1.0]);
    // lightSphere.DrawTriangles();

    // Малюємо об'єкт
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, eyeMVP);
    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, eyeModelView);
    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, eyeNormalMat);
    gl.uniform3f(
      shProgram.iLightPos,
      lightViewPos[0],
      lightViewPos[1],
      lightViewPos[2],
    );

    gl.uniform1i(shProgram.iIsSolidColor, 0);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 1.0);
    surface.DrawTriangles();
    gl.disable(gl.POLYGON_OFFSET_FILL);

    gl.uniform1i(shProgram.iIsSolidColor, 1);
    gl.uniform4fv(shProgram.iColor, [0.5, 0.5, 0.5, 0.5]);
    surface.DrawLines();
  }

  gl.colorMask(true, false, false, false);
  DrawEye(stereoCam.calcLeftFrustum(), m4.translation(eyeSep / 2, 0, 0));

  gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.colorMask(false, true, true, false);
  DrawEye(stereoCam.calcRightFrustum(), m4.translation(-eyeSep / 2, 0, 0));

  gl.colorMask(true, true, true, true);
  requestAnimationFrame(draw);
}

function initGL() {
  let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);
  shProgram = new ShaderProgram("PBR", prog);
  shProgram.Use();

  shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
  shProgram.iAttribTexCoord = gl.getAttribLocation(prog, "texCoord");
  shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
  shProgram.iAttribTangent = gl.getAttribLocation(prog, "tangent");

  shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(
    prog,
    "ModelViewProjectionMatrix",
  );
  shProgram.iModelViewMatrix = gl.getUniformLocation(prog, "ModelViewMatrix");
  shProgram.iNormalMatrix = gl.getUniformLocation(prog, "NormalMatrix");
  shProgram.iLightPos = gl.getUniformLocation(prog, "u_lightPos");

  shProgram.iColor = gl.getUniformLocation(prog, "color");
  shProgram.iIsVideo = gl.getUniformLocation(prog, "u_isVideo");
  shProgram.iIsSolidColor = gl.getUniformLocation(prog, "u_isSolidColor");

  shProgram.iVideoTex = gl.getUniformLocation(prog, "u_videoTex");
  shProgram.iDiffuseMap = gl.getUniformLocation(prog, "u_diffuseMap");
  shProgram.iSpecularMap = gl.getUniformLocation(prog, "u_specularMap");
  shProgram.iNormalMap = gl.getUniformLocation(prog, "u_normalMap");

  shProgram.iUseDiffuse = gl.getUniformLocation(prog, "u_useDiffuse");
  shProgram.iUseSpecular = gl.getUniformLocation(prog, "u_useSpecular");
  shProgram.iUseNormal = gl.getUniformLocation(prog, "u_useNormal");

  texDiffuse = loadTexture(
    "./texture/Alien_Muscle_001_DIFFUSE.jpg",
    [200, 200, 200, 255],
  );
  texNormal = loadTexture(
    "./texture/Alien_Muscle_001_NORM.jpg",
    [128, 128, 255, 255],
  );
  texSpecular = loadTexture(
    "./texture/Alien_Muscle_001_SPEC.jpg",
    [128, 128, 128, 255],
  );

  surface = new Model("Surface");
  updateSurface();

  videoPlane = new Model("VideoPlane");
  let vData = CreateVideoPlaneData();
  videoPlane.BufferData(
    vData.vertices,
    vData.triangles,
    null,
    vData.texCoords,
    null,
    null,
  );

  lightSphere = new Model("LightSphere");
  let sData = CreateSphereData(0.5, 16, 16);
  lightSphere.BufferData(
    sData.vertices,
    sData.triangles,
    null,
    null,
    null,
    null,
  );

  gl.enable(gl.DEPTH_TEST);
}

function createProgram(gl, vShader, fShader) {
  let vsh = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vsh, vShader);
  gl.compileShader(vsh);
  if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(vsh));

  let fsh = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fsh, fShader);
  gl.compileShader(fsh);
  if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(fsh));

  let prog = gl.createProgram();
  gl.attachShader(prog, vsh);
  gl.attachShader(prog, fsh);
  gl.linkProgram(prog);
  return prog;
}

function resizeCanvasToDisplaySize(canvas) {
  const displayWidth = canvas.clientWidth * window.devicePixelRatio;
  const displayHeight = canvas.clientHeight * window.devicePixelRatio;
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
}

function init() {
  let canvas = document.getElementById("webglcanvas");
  gl = canvas.getContext("webgl");
  if (!gl) {
    alert("WebGL not supported");
    return;
  }

  document.getElementById("rVal")?.addEventListener("input", updateSurface);
  document.getElementById("cVal")?.addEventListener("input", updateSurface);
  document.getElementById("dVal")?.addEventListener("input", updateSurface);
  document
    .getElementById("theta0Val")
    ?.addEventListener("input", updateSurface);
  document
    .getElementById("btnStartCamera")
    ?.addEventListener("click", startWebcam);

  initGL();

  spaceball = new TrackballRotator(canvas, null, 0);

  canvas.addEventListener("wheel", (event) => {
    zoom += event.deltaY * 0.02;
    if (zoom < 4) zoom = 4;
    if (zoom > 150) zoom = 150;
    event.preventDefault();
  });

  resizeCanvasToDisplaySize(canvas);
  requestAnimationFrame(draw);
}

window.addEventListener("resize", function () {
  let canvas = document.getElementById("webglcanvas");
  resizeCanvasToDisplaySize(canvas);
});
