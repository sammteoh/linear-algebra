# Linear Transformations Visualizer
An interactive 3D web application for seeing what transformation matrices to do space and vectors.
View live website demo [here](sammteoh.github.io/linear-algebra).

## Overview
The goal of this project is to visualize core linear algebra concepts. Linear transformations and vectors are drawn in a 3D scene. Each transformation and visualization is paired with its formula, typeset with KaTeX. 
- **Matrix-vector multiplication.** Three input vectors (v, w, u) are drawn in the 3D scene. Their images under T (Tv, Tw, Tu) are drawn in red with live coordinate labels. Their formulas T·v = Tv are shown.
- **Transforming lattice.** A 3D grid of lines that rotates, stretches, and shears as T is applied.
- **Basis vectors.** î, ĵ, k̂ and where they land, which are the columns of T.
- **Transformation manipulator.** Sliders for rotation, scale, and shear that fill in the matrix input boxes.
- **2×2 determinant and area.** The parallelogram spanned by v and w, its transformed copy, and a determinant next to the areas.
- **3×3 determinant and volume.** The parallelepiped spanned by v, w, u, its transformed copy, and the determinant next to the volumes.
- **Cross product.** The plane spanned by v and w, the normal vector v × w, and its magnitude, plus the transformed version.
**Built with** plain HTML/CSS, JavaScript (ES modules), Three.js for 3D, and KaTeX for math typesetting. There is no build step or npm install.

## Process
1. **2D Prototype.** I started with a 2D canvas using HTML5 Canvas API. Drew the x-y coordinate grid, one vector, and a Matrix class (get, set, multiply).
2. **3D.** I decided to go to Three.js to make a 3D scene. I converted the files to ES modules, added an import map, replaced the 2D context with a WebGLRenderer, added OrbitControls for click-and-drag rotation.
3. **Animation.** The scene animates from the identity matrix to T. Interpolating matrix entries squashes rotations partway through, so for the sliders I interpolate the slider values themselves (angles, scale factors, shears) and rebuild the matrix each frame.
4. **Inputs, sliders, and labels.** I added number boxes for T, v, w, and u, the three groups of sliders, and CSS2DRenderer labels that follow arrow tips and show live coordinates.
5. **Determinants and the cross product.** I added the 2×2 area view, then the 3×3 volume view (with a determinant() method on Matrix), then the cross product with its plane and normal vector. Each one draws the original shape and the transformed shape, and readouts use KaTeX.

## How to Run
Steps
1. Clone or download the project:
```
bash
   git clone <your-repo-url>
   cd <project-folder>
```
2. Start a local server in the project folder using any one of these:
```
bash
   # Python 3
   python3 -m http.server 8000

   # Node
   npx serve
```

## Ideas for the Future
- Eigenvectors and eigenvalues
- The unit cube, image under T
- Kernel and column space visualization
- SVD animation
- Draggable vectors
- Resizing the canvas with the window
