'use strict';

// Клас для створення та малювання 3D-моделей
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iIndexBufferTriangles = gl.createBuffer();
    this.iIndexBufferLines = gl.createBuffer();
    this.iTexCoordBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTangentBuffer = gl.createBuffer();

    this.countTriangles = 0;
    this.countLines = 0;

    this.BufferData = function(vertices, triangles, lines, texCoords, normals, tangents) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        if (triangles) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBufferTriangles);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangles), gl.STATIC_DRAW);
            this.countTriangles = triangles.length;
        }
        if (lines) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBufferLines);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lines), gl.STATIC_DRAW);
            this.countLines = lines.length;
        }
        if (texCoords) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
        }
        if (normals) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        }
        if (tangents) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.iTangentBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tangents), gl.STATIC_DRAW);
        }
    }

    this.DrawTriangles = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        if (shProgram.iAttribTexCoord !== -1 && this.iTexCoordBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordBuffer);
            gl.vertexAttribPointer(shProgram.iAttribTexCoord, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shProgram.iAttribTexCoord);
        }
        if (shProgram.iAttribNormal !== -1 && this.iNormalBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
            gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shProgram.iAttribNormal);
        }
        if (shProgram.iAttribTangent !== -1 && this.iTangentBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.iTangentBuffer);
            gl.vertexAttribPointer(shProgram.iAttribTangent, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shProgram.iAttribTangent);
        }

        if (this.countTriangles > 0) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBufferTriangles);
            gl.drawElements(gl.TRIANGLES, this.countTriangles, gl.UNSIGNED_SHORT, 0);
        }
    }

    this.DrawLines = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        if (this.countLines > 0) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBufferLines);
            gl.drawElements(gl.LINES, this.countLines, gl.UNSIGNED_SHORT, 0);
        }
    }
}

// Клас для роботи з Шейдерами
function ShaderProgram(name, program) {
    this.name = name;
    this.prog = program;

    this.iAttribVertex = -1;
    this.iAttribTexCoord = -1;
    this.iAttribNormal = -1;
    this.iAttribTangent = -1;

    this.iModelViewProjectionMatrix = -1;
    this.iModelViewMatrix = -1;
    this.iNormalMatrix = -1;
    this.iLightPos = -1; 

    this.iColor = -1;
    this.iIsVideo = -1;
    this.iIsSolidColor = -1; 

    this.iVideoTex = -1;
    this.iDiffuseMap = -1;
    this.iSpecularMap = -1;
    this.iNormalMap = -1;

    this.iUseDiffuse = -1;
    this.iUseSpecular = -1;
    this.iUseNormal = -1;

    this.Use = function() { gl.useProgram(this.prog); }
}