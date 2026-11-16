"use client";
import React, { useRef } from "react";
import { Cropper } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { Button, Spinner } from "@heroui/react";

// Phone photos (iPhones especially) are routinely 3-8MB+ at full resolution.
// Vercel's serverless functions hard-reject request bodies over ~4.5MB, so
// the cropped output is downscaled before re-encoding, same safeguard the
// rest of the upload pipeline uses.
const MAX_CROPPED_DIMENSION = 1600;

const dataURLToFile = (dataUrl, filename) => {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

/**
 * Full-screen crop overlay for one tile in the add-product photo grid.
 * Cropping is opt-in — the tile already has its uploaded photo; this just
 * lets the user replace it with a cropped version of the same photo. The
 * caller owns what happens to the cropped file — this component only
 * produces it.
 */
const CropModal = ({
  src,
  crossOrigin,
  title = "Crop photo",
  busy = false,
  onConfirm,
  onCancel,
}) => {
  const cropperRef = useRef(null);

  const handleCrop = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    const cropBox = cropper.getData();
    let targetWidth = cropBox.width;
    let targetHeight = cropBox.height;
    const longestSide = Math.max(targetWidth, targetHeight);
    if (longestSide > MAX_CROPPED_DIMENSION) {
      const scale = MAX_CROPPED_DIMENSION / longestSide;
      targetWidth = Math.round(targetWidth * scale);
      targetHeight = Math.round(targetHeight * scale);
    }

    let croppedDataURL;
    try {
      // fillColor: without this, any sliver of canvas cropperjs doesn't
      // paint over (a float-rounding edge case in getCroppedCanvas) stays
      // transparent — and since JPEG has no alpha channel, that flattens to
      // BLACK on export. This is the "black line on one edge" bug.
      croppedDataURL = cropper
        .getCroppedCanvas({
          width: targetWidth,
          height: targetHeight,
          fillColor: "#ffffff",
        })
        .toDataURL("image/jpeg", 0.85);
    } catch (err) {
      onConfirm(null, new Error("Could not crop this image. Please try again."));
      return;
    }

    const croppedFile = dataURLToFile(croppedDataURL, "cropped-image.jpeg");
    onConfirm(croppedFile);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-5 relative">
        {busy && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg z-10">
            <Spinner size="lg" color="success" />
          </div>
        )}

        <p className="text-[1.4rem] font-medium text-center mb-3">{title}</p>

        <div className="text-center m-auto relative z-0">
          <Cropper
            key={src}
            className="m-auto w-full"
            src={src}
            crossOrigin={crossOrigin ? "anonymous" : undefined}
            style={{ height: 320 }}
            guides={false}
            viewMode={1}
            ref={cropperRef}
          />
          {/*
            cropperjs's default corner handles shrink to a ~5px hit target on
            larger breakpoints and rely on the browser's native touch-scroll
            being disabled to drag smoothly — on iPhone this makes the corner
            "grab" point tiny and the drag fight with page scroll/zoom. Force
            a consistently large, visible handle at every screen size and
            disable native touch gestures on the crop box so dragging a
            corner tracks the finger instead of the page.
          */}
          <style jsx global>{`
            .cropper-point {
              width: 22px !important;
              height: 22px !important;
              opacity: 0.9 !important;
              background-color: #3b82f6 !important;
              border-radius: 4px;
            }
            .cropper-point.point-se {
              bottom: -11px !important;
              right: -11px !important;
            }
            .cropper-point.point-ne {
              top: -11px !important;
              right: -11px !important;
            }
            .cropper-point.point-sw {
              bottom: -11px !important;
              left: -11px !important;
            }
            .cropper-point.point-nw {
              top: -11px !important;
              left: -11px !important;
            }
            .cropper-point.point-n,
            .cropper-point.point-s {
              left: 50% !important;
              margin-left: -11px !important;
            }
            .cropper-point.point-e,
            .cropper-point.point-w {
              top: 50% !important;
              margin-top: -11px !important;
            }
            .cropper-crop-box,
            .cropper-face,
            .cropper-line,
            .cropper-point {
              touch-action: none !important;
            }
          `}</style>
        </div>

        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          <Button isDisabled={busy} onPress={onCancel} className="auth-btn">
            Cancel
          </Button>
          <Button isDisabled={busy} onPress={handleCrop} className="danger-btn">
            Crop &amp; Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CropModal;
