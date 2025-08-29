import React, { useState, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import html2canvas from "html2canvas";
import "../css/imageEditor.css";
import axios from "axios";
import backgroundImage from "../images/background-waves.png"
function ImageEditor() {
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    designation: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [step, setStep] = useState(1); // 1=upload, 2=edit, 3=final-preview, 4=badge-preview
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hueRotate, setHueRotate] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [hoverPreview, setHoverPreview] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [finalImageStyle, setFinalImageStyle] = useState({});
  const [badgeType, setBadgeType] = useState(""); // '', 'attending', 'speaking', 'sponsoring'
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadResolution, setDownloadResolution] = useState("2x");
  const [showDropdown, setShowDropdown] = useState(false);

  const fileInputRef = useRef(null);
  const badgeImageCanvasRef = useRef(null);

  const validFileTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/svg+xml",
  ];

  // Update handleFormChange to validate on change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Validate this field
    let error = "";
    if (name === "name" && !value.trim()) error = "Name is required.";
    if (name === "email") {
      if (!value.trim()) error = "Email is required.";
      else if (!/^\S+@\S+\.\S+$/.test(value)) error = "Enter a valid email.";
    }
    if (name === "company" && !value.trim()) error = "Company is required.";
    if (name === "designation" && !value.trim())
      error = "Designation is required.";
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Update handleChange for image validation on change
  function handleChange(e) {
    const selectedFile = e.target.files[0];
    let error = "";
    if (selectedFile && validFileTypes.includes(selectedFile.type)) {
      handleFile(selectedFile);
    } else {
      error = "Please upload a valid image file (.jpg, .jpeg, .png, .svg)";
    }
    setFormErrors((prev) => ({ ...prev, file: error }));
  }

  // Update handleDrop for image validation on drop
  function handleDrop(e) {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    let error = "";
    if (droppedFile && validFileTypes.includes(droppedFile.type)) {
      handleFile(droppedFile);
    } else {
      error = "Please drop a valid image file (.jpg, .jpeg, .png, .svg)";
    }
    setFormErrors((prev) => ({ ...prev, file: error }));
    setIsDragging(false);
  }

  function handleFile(file) {
    setLoading(true);
    setTimeout(() => {
      setFile(URL.createObjectURL(file));
      setLoading(false);
    }, 1000);
  }

  function removeImage() {
    setFile(null);
    resetFilters();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const onCropComplete = (_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const filterStyle = {
    filter: hoverPreview
      ? "none"
      : `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) sepia(${sepia}%) grayscale(${grayscale}%)`,
  };

  const resetFilters = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setHueRotate(0);
    setSepia(0);
    setGrayscale(0);
  };

  const getCroppedImg = async (
    imageSrc,
    pixelCrop,
    backgroundColor = "#7e7e7e"
  ) => {
    const image = new Image();
    image.src = imageSrc;

    return new Promise((resolve, reject) => {
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );

        const base64Image = canvas.toDataURL("image/png");
        resolve(base64Image);
      };
      image.onerror = (error) => {
        reject(error);
      };
    });
  };

  const handleNext = async () => {
    if (step === 1) {
      // Validation check
      let errors = {};
      if (!formData.name.trim()) errors.name = "Name is required.";
      if (!formData.email.trim()) errors.email = "Email is required.";
      else if (!/^\S+@\S+\.\S+$/.test(formData.email))
        errors.email = "Enter a valid email.";
      if (!formData.company.trim()) errors.company = "Company is required.";
      if (!formData.designation.trim())
        errors.designation = "Designation is required.";
      if (!file) errors.file = "Please upload an image.";

      setFormErrors(errors);

      // Agar errors hai to aage mat badho
      if (Object.keys(errors).length > 0) {
        return;
      }

      setIsProcessing(true);
      try {
        await axios.post("https://ghci.anitabindia.org/lead/", formData);
      } catch (error) {
        console.warn("Lead API error ignored:", error.message);
      } finally {
        setIsProcessing(false);
        setStep(2);
      }
    } else if (step === 2) {
      setIsProcessing(true);
      if (file && croppedAreaPixels) {
        const croppedImg = await getCroppedImg(file, croppedAreaPixels);
        setCroppedImage(croppedImg);
        setFinalImageStyle({
          filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) sepia(${sepia}%) grayscale(${grayscale}%)`,
        });
      }
      setIsProcessing(false);
      setStep(3);
    }
  };




  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };


  const handleDownload = async () => {
    const badgeNode = document.getElementById("badge-preview-download");
    if (badgeNode) {
      setIsDownloading(true);
      try {
        // Map resolution to scale
        const resolutionScale = {
          "1x": 1,
          "2x": 3,
          "3x": 5,
          "5x": 8,
        };

        const canvas = await html2canvas(badgeNode, {
          backgroundColor: null,
          useCORS: true,
          scale: resolutionScale[downloadResolution] || 2
        });

        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = url;
        link.download = `GHCI-badge-${downloadResolution}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        alert("Error downloading badge: " + e);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".download-split-btn")) {
        setShowDropdown(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);


  // Draw filtered image to canvas for preview/download
  useEffect(() => {
    if (step === 3 && croppedImage && badgeImageCanvasRef.current) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = croppedImage;
      img.onload = () => {
        const canvas = badgeImageCanvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) sepia(${sepia}%) grayscale(${grayscale}%)`;
        ctx.drawImage(img, 0, 0, img.width, img.height);
      };
    }
    // eslint-disable-next-line
  }, [
    step,
    croppedImage,
    brightness,
    contrast,
    saturation,
    hueRotate,
    sepia,
    grayscale,
  ]);

  return (
    <div>
      <div className="header">
        <div className="container">
          <div className="header_inner">
            <img
              src={require("../images/logo.png")}
              alt="Logo"
              className="logo"
            />
          </div>
        </div>
      </div>
      <section className="image-editor">
        <div className="container">
          {step === 1 && (
            <div className="upload-section">
              <div className="badge-form-fields">
                <h2 className="badge-form-title">Badge Details</h2>
                <div className="badge-form-group">
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="badge-form-input"
                  />
                  {formErrors.name && (
                    <div className="badge-form-error">{formErrors.name}</div>
                  )}
                </div>
                <div className="badge-form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="badge-form-input"
                  />
                  {formErrors.email && (
                    <div className="badge-form-error">{formErrors.email}</div>
                  )}
                </div>
                <div className="badge-form-group">
                  <input
                    type="text"
                    name="company"
                    placeholder="Company"
                    value={formData.company}
                    onChange={handleFormChange}
                    className="badge-form-input"
                  />
                  {formErrors.company && (
                    <div className="badge-form-error">{formErrors.company}</div>
                  )}
                </div>
                <div className="badge-form-group">
                  <input
                    type="text"
                    name="designation"
                    placeholder="Designation"
                    value={formData.designation}
                    onChange={handleFormChange}
                    className="badge-form-input"
                  />
                  {formErrors.designation && (
                    <div className="badge-form-error">
                      {formErrors.designation}
                    </div>
                  )}
                </div>
                <div className="badge-form-group badge-form-image-group">
                  <div
                    className={`badge-form-uploadImage ${
                      isDragging ? "drag-over" : ""
                    }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!file) {
                        setIsDragging(true);
                      }
                    }}
                    onDragLeave={() => setIsDragging(false)}
                  >
                    {!file ? (
                      <div className="badge-form-upload_content">
                        <p className="badge-form-upload-text">
                          Drag & Drop Image
                        </p>
                        <span>OR</span>
                        <label
                          htmlFor="upload"
                          className="custom-file-input badge-form-upload-label"
                        >
                          <i className="fa-solid fa-image"></i> Upload Image
                        </label>
                        <input
                          id="upload"
                          type="file"
                          onChange={handleChange}
                          ref={fileInputRef}
                        />
                      </div>
                    ) : (
                      <div className="badge-form-image-preview-box">
                        <img
                          src={file}
                          alt="Preview"
                          className="badge-form-image-preview badge-form-image-preview-wide"
                        />
                        <button
                          type="button"
                          className="badge-form-remove"
                          onClick={removeImage}
                        >
                          <i className="fa-regular fa-trash-can"></i>
                        </button>
                      </div>
                    )}
                    {loading && <div className="loader"></div>}
                  </div>
                  {formErrors.file && (
                    <div className="badge-form-error">{formErrors.file}</div>
                  )}
                </div>
                <div className="badge-form-actions">
                  <button className="next-button" onClick={handleNext} disabled={isProcessing}>
                    {isProcessing ? (
                      <span>
                        Processing.. 
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      </span>
                    ) : (
                      "Next"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="edit-section">
              <div className="edit-section-inner">
                <div className="edit-image-section">
                  <Cropper
                    image={file}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="rect" // was 'round', now 'rect' for square crop
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    zoomWithScroll
                    minZoom={1}
                    maxZoom={4}
                    zoomSpeed={0.05}
                    restrictPosition={true}
                    style={{ containerStyle: filterStyle }}
                  />
                  <button
                    className="reset-button"
                    title="Reset"
                    onClick={resetFilters}
                  >
                    <i className="fa-solid fa-rotate"></i>
                  </button>
                  <button
                    className="preview-button"
                    onMouseEnter={() => setHoverPreview(true)}
                    onMouseLeave={() => setHoverPreview(false)}
                  >
                    <i className="fa-solid fa-eye"></i>
                  </button>
                </div>
                <div className="edit-options">
                  <div className="option_inner">
                    <label>Zoom:</label>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="0.1"
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                    />
                  </div>
                  <div className="option_inner">
                    <label>Brightness:</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={brightness}
                      onChange={(e) => setBrightness(e.target.value)}
                    />
                  </div>
                  <div className="option_inner">
                    <label>Contrast:</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(e.target.value)}
                    />
                  </div>
                  <div className="option_inner">
                    <label>Saturation:</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(e.target.value)}
                    />
                  </div>
                  <div className="option_inner">
                    <label>Hue:</label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={hueRotate}
                      onChange={(e) => setHueRotate(e.target.value)}
                    />
                  </div>
                  <div className="option_inner">
                    <label>Sepia:</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sepia}
                      onChange={(e) => setSepia(e.target.value)}
                    />
                  </div>
                  <div className="option_inner">
                    <label>Grayscale:</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={grayscale}
                      onChange={(e) => setGrayscale(e.target.value)}
                    />
                  </div>
                </div>
                <div className="button-container">
                  <button className="back-button" onClick={handleBack}>
                    Back
                  </button>
                  <button className="next-button" onClick={handleNext}>
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="badge-preview">
              <div
                id="badge-preview-download"
                className="badge-preview-download"
                style={{
                  maxWidth: "500px",
                  margin: "0 auto",
                  background: `url(${backgroundImage}), linear-gradient(#22021d)`,
                  backgroundBlendMode: "normal",
                  backgroundPosition: "right",
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  border: "2px solid white",
                  borderRadius: "24px",
                  boxShadow: "0 8px 32px #0002",
                  padding: "20px",
                  color: "#fff",
                  position: "relative",
                  backdropFilter: "blur(3px)",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div className="badge-preview-header">
                    <img
                      src={require("../images/logo.png")}
                      alt="Logo"
                      className="badge-preview-logo"
                    />
                  </div>
                  <div className="badge-preview-image-section">
                    <div className="badge-preview-image-box">
                      {croppedImage ? (
                        <div className="badge-preview-image-preview-box">
                          <canvas
                            ref={badgeImageCanvasRef}
                            className="badge-preview-image"
                            style={{
                              width: "100%",
                              height: "auto",
                              borderRadius: 0,
                            }}
                          />
                        </div>
                      ) : (
                        <div className="badge-preview-image-placeholder">
                          Image
                        </div>
                      )}
                    </div>
                    <div className="badge-preview-name">{formData.name}</div>
                  </div>
                  <div className="badge-preview-attending">
                      <div
                        className="badge-type-btn"
                      >
                        I am Attending
                      </div>
                  </div>
                  <div className="badge-unbound-logo">
                    <img
                      src={require("../images/unbound-logo.png")}
                      alt="Logo"
                    />
                  </div>
                  <div className="badge-preview-date">
                    December 2-4, 2025 | KTPO, Bengaluru
                  </div>
                </div>
              </div>
              <div className="badge-preview-actions">
                <button className="badge-preview-back" onClick={handleBack}>
                  Back
                </button>

                {/* Split Download Button with Dropdown */}
                <div className="download-split-btn">
                  <button
                    className="badge-preview-next"
                    onClick={handleDownload}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <i className="fa-solid fa-spinner fa-spin"></i>
                    ) : (
                      `Download (${downloadResolution})`
                    )}
                  </button>

                  <div className="dropdown">
                    <button
                      type="button"
                      className="dropdown-toggle"
                      onClick={() =>
                        setShowDropdown((prev) => !prev)
                      }
                    >
                      <i className="fa-solid fa-caret-down"></i>
                    </button>

                    {showDropdown && (
                      <div className="dropdown-menu">
                        <div onClick={() => setDownloadResolution("1x")}>
                          Low
                        </div>
                        <div onClick={() => setDownloadResolution("2x")}>
                          Medium
                        </div>
                        <div onClick={() => setDownloadResolution("3x")}>
                          High
                        </div>
                        <div onClick={() => setDownloadResolution("5x")}>
                          Ultra
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>


            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ImageEditor;
