
# Methods of Synthesis of Virtual Reality (VR)

This project was developed as part of the university curriculum for the "Methods of Synthesis of Virtual Reality" course. It demonstrates advanced real-time rendering techniques using WebGL, specifically focused on anaglyphic stereo imaging and computer vision integration.


##  Practical Assignment #1: WebGL stereo camera

The core rendering engine of the project focuses on depth perception and visualization:

### Key Features(PA#1)

* **Anaglyphic Stereo Rendering:** Generates a 3D stereo effect (Red-Cyan) for 3D models.
* **Dual-Layer Visualization:** Renders the model in wireframe mode overlaid on top of filled polygons.
* **Negative Parallax:** Specifically configured to create an "out-of-screen" 3D effect.
* **Camera Integration:** Renders a real-time video stream from your web camera at the zero-parallax plane (as a background).
* **Interactive Controls:** Full mouse-based rotation of the model around its center of mass.

###  Configurable Parameters

The application provides a GUI or control interface to dynamically adjust:
* **Eye Separation:** Adjust the distance between virtual eyes to control depth intensity.
* **Field of View (FoV):** Change the viewing angle of the virtual camera.
* **Near Clipping Distance:** Define the closest point visible to the camera.
* **Convergence Distance:** Set the distance at which the left and right images overlap perfectly (zero parallax).
---

##  Practical Assignment #2: Tangible User Interface (TUI)

The second stage of the project introduces a **Tangible User Interface (TUI)**, allowing users to interact with digital 3D information through the physical movement of a smartphone. 

### Key Features (PA#2)
* **Smartphone-to-PC Synchronization:** Real-time orientation tracking via WebSockets.
* **Advanced Sensor Fusion:** Utilizes the `game_rotation_vector` sensor for smooth, drift-free rotation without magnetic interference.
* **Coordinate Space Mapping:** Custom remapping of Android sensor axes to WebGL world space to ensure intuitive "Steering Wheel" (Roll) and "Pitch/Yaw" controls.
* **Ergonomic Calibration:** Integrated 90° X-axis compensation matrix, allowing the device to be used in a natural vertical position rather than lying flat.

### Technical Implementation
* **Sensor Data:** Reads orientation data ($x, y, z, w$) from the **Sensor Server** Android app.
* **Mathematical Core:** Implements the `getRotationMatrixFromVector` algorithm to convert raw orientation vectors (quaternions) into a valid 4x4 rotation matrix.
---

##  Setup & Requirements

1.  **Repository Branch:** The full TUI implementation is located in the `PA2` branch.
2.  **Hardware:** An Android smartphone with the [Sensor Server APK](https://f-droid.org/en/packages/github.umer0586.sensorserver/) installed.
3.  **Network:** Both the PC and the smartphone must be connected to the same local Wi-Fi network.
4.  **Connection:**
    * Launch Sensor Server on your phone.
    * Enter the smartphone's IP address in the application interface to establish a WebSocket connection.

---
