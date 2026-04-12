async function splitImageIntoSpread(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image."));
    image.src = dataUrl;
  });

  const width = img.width;
  const height = img.height;
  const halfWidth = Math.floor(width / 2);
  const rightWidth = width - halfWidth;

  const leftCanvas = document.createElement("canvas");
  leftCanvas.width = halfWidth;
  leftCanvas.height = height;
  const leftCtx = leftCanvas.getContext("2d");
  leftCtx.drawImage(
    img,
    0,
    0,
    halfWidth,
    height,
    0,
    0,
    halfWidth,
    height
  );

  const rightCanvas = document.createElement("canvas");
  rightCanvas.width = rightWidth;
  rightCanvas.height = height;
  const rightCtx = rightCanvas.getContext("2d");
  rightCtx.drawImage(
    img,
    halfWidth,
    0,
    rightWidth,
    height,
    0,
    0,
    rightWidth,
    height
  );

  return {
    leftImage: leftCanvas.toDataURL("image/png"),
    rightImage: rightCanvas.toDataURL("image/png"),
  };
}
