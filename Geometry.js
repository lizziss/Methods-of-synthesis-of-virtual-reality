"use strict";

function CreateSphereData(radius, latBands, longBands) {
  let vertices = [],
    triangles = [];
  for (let latNumber = 0; latNumber <= latBands; latNumber++) {
    let theta = (latNumber * Math.PI) / latBands;
    let sinTheta = Math.sin(theta);
    let cosTheta = Math.cos(theta);
    for (let longNumber = 0; longNumber <= longBands; longNumber++) {
      let phi = (longNumber * 2 * Math.PI) / longBands;
      let sinPhi = Math.sin(phi);
      let cosPhi = Math.cos(phi);
      let x = cosPhi * sinTheta;
      let y = cosTheta;
      let z = sinPhi * sinTheta;
      vertices.push(radius * x, radius * y, radius * z);
    }
  }
  for (let latNumber = 0; latNumber < latBands; latNumber++) {
    for (let longNumber = 0; longNumber < longBands; longNumber++) {
      let first = latNumber * (longBands + 1) + longNumber;
      let second = first + longBands + 1;
      triangles.push(first, second, first + 1);
      triangles.push(second, second + 1, first + 1);
    }
  }
  return {
    vertices,
    triangles,
    lines: null,
    texCoords: null,
    normals: null,
    tangents: null,
  };
}

function CreateSurfaceData(uMaxMultiplier) {
  let vertices = [],
    triangles = [],
    lines = [],
    texCoords = [],
    normals = [],
    tangents = [];

  let r = parseFloat(document.getElementById("rVal")?.value || 1.3);
  let c = parseFloat(document.getElementById("cVal")?.value || 1.7);
  let d = parseFloat(document.getElementById("dVal")?.value || 1.6);
  let theta0 = parseFloat(document.getElementById("theta0Val")?.value || 1.57);

  let uMax = uMaxMultiplier * Math.PI;
  let vMin = -2 * Math.PI;
  let vMax = 2 * Math.PI;

  let uSteps = parseInt(document.getElementById("uSlider")?.value || 88);
  let vSteps = parseInt(document.getElementById("vSlider")?.value || 58);

  function P(u, v) {
    let x =
      r * Math.cos(u) -
      (r * (theta0 - u) +
        v * Math.cos(theta0) -
        c * Math.sin(d * v) * Math.sin(theta0)) *
        Math.sin(u);
    let y =
      r * Math.sin(u) +
      (r * (theta0 - u) +
        v * Math.cos(theta0) -
        c * Math.sin(d * v) * Math.sin(theta0)) *
        Math.cos(u);
    let z = v * Math.sin(theta0) + c * Math.sin(d * v) * Math.cos(theta0);
    return [x, y, z];
  }

  let du = 0.001,
    dv = 0.001;
  let sumX = 0,
    sumY = 0,
    sumZ = 0,
    vertexCount = 0;

  for (let i = 0; i <= uSteps; i++) {
    let u = (i * uMax) / uSteps;
    for (let j = 0; j <= vSteps; j++) {
      let v = vMin + (j * (vMax - vMin)) / vSteps;
      let p = P(u, v);
      vertices.push(p[0], p[1], p[2]);

      sumX += p[0];
      sumY += p[1];
      sumZ += p[2];
      vertexCount++;
      texCoords.push((i / uSteps) * 3.0, (j / vSteps) * 3.0);

      let pu1 = P(u + du, v);
      let pv1 = P(u, v + dv);
      let dpdu = [pu1[0] - p[0], pu1[1] - p[1], pu1[2] - p[2]];
      let dpdv = [pv1[0] - p[0], pv1[1] - p[1], pv1[2] - p[2]];

      let nx = dpdu[1] * dpdv[2] - dpdu[2] * dpdv[1];
      let ny = dpdu[2] * dpdv[0] - dpdu[0] * dpdv[2];
      let nz = dpdu[0] * dpdv[1] - dpdu[1] * dpdv[0];
      let nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (nLen > 0) {
        nx /= nLen;
        ny /= nLen;
        nz /= nLen;
      }
      normals.push(nx, ny, nz);

      let tLen = Math.sqrt(
        dpdu[0] * dpdu[0] + dpdu[1] * dpdu[1] + dpdu[2] * dpdu[2],
      );
      let tx = dpdu[0],
        ty = dpdu[1],
        tz = dpdu[2];
      if (tLen > 0) {
        tx /= tLen;
        ty /= tLen;
        tz /= tLen;
      }
      tangents.push(tx, ty, tz);
    }
  }

  for (let i = 0; i < uSteps; i++) {
    for (let j = 0; j < vSteps; j++) {
      let p00 = i * (vSteps + 1) + j;
      let p01 = p00 + 1;
      let p10 = (i + 1) * (vSteps + 1) + j;
      let p11 = p10 + 1;

      triangles.push(p00, p01, p10);
      triangles.push(p01, p11, p10);
      lines.push(p00, p01);
      lines.push(p00, p10);
    }
  }

  let centerOfMass = [
    sumX / vertexCount,
    sumY / vertexCount,
    sumZ / vertexCount,
  ];
  return {
    vertices,
    triangles,
    lines,
    texCoords,
    normals,
    tangents,
    centerOfMass,
  };
}

function CreateVideoPlaneData() {
  let vertices = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0];
  let triangles = [0, 1, 2, 0, 2, 3];
  let texCoords = [0, 1, 1, 1, 1, 0, 0, 0];
  return {
    vertices,
    triangles,
    lines: null,
    texCoords,
    normals: null,
    tangents: null,
  };
}
