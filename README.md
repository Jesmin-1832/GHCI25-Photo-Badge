# 🎟️ GHCI Badge Generator

An interactive web-based badge generator built with React. Users can upload an image, apply cropping and filters, and download a custom badge for events like GHCI.

### ✨ Features

- Upload images (supports JPG, PNG, SVG)
- Drag & Drop support
- Real-time crop and zoom with [`react-easy-crop`](https://github.com/ricardo-ch/react-easy-crop)
- Image filters: Brightness, Contrast, Saturation, Hue, Sepia, Grayscale
- Live badge preview with background and branding
- Multiple download resolutions (1x to 5x) via [`html2canvas`](https://github.com/niklasvh/html2canvas)
- Responsive and clean UI

### 🛠️ Tech Stack

- React
- CSS Modules
- html2canvas
- react-easy-crop
- Axios (for form submission)

### 📦 Setup Instructions

```bash
git clone https://github.com/your-username/ghci-badge-generator.git
cd ghci-badge-generator
npm install
npm start
