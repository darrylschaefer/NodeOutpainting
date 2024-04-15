import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const openaiApiKey = "";

if (openaiApiKey.length == 0) {
  console.log("You need to set your OpenAI API key in this script!");
}

console.log("Using OpenAI API Key:", openaiApiKey);

async function processImage(inputPath, prompt) {
  const imageSize = 1024;
  const outputPath = "output";

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }
  const image = () => sharp(inputPath);
  const metadata = await sharp(inputPath).metadata();

  const halfWidth = Math.round(metadata.width / 2);
  const halfHeight = Math.round(metadata.height / 2);

  const corners = [
    {
      name: "topLeft",
      options: { left: 0, top: 0, width: halfWidth, height: halfHeight },
      extendOptions: {
        top: imageSize - halfHeight,
        left: imageSize - halfWidth,
        bottom: 0,
        right: 0,
      },
    },
    {
      name: "topRight",
      options: {
        left: halfWidth,
        top: 0,
        width: halfWidth,
        height: halfHeight,
      },
      extendOptions: {
        top: imageSize - halfHeight,
        left: 0,
        bottom: 0,
        right: imageSize - halfWidth,
      },
    },
    {
      name: "bottomLeft",
      options: {
        left: 0,
        top: halfHeight,
        width: halfWidth,
        height: halfHeight,
      },
      extendOptions: {
        top: 0,
        left: imageSize - halfWidth,
        bottom: imageSize - halfHeight,
        right: 0,
      },
    },
    {
      name: "bottomRight",
      options: {
        left: halfWidth,
        top: halfHeight,
        width: halfWidth,
        height: halfHeight,
      },
      extendOptions: {
        top: 0,
        left: 0,
        bottom: imageSize - halfHeight,
        right: imageSize - halfWidth,
      },
    },
  ];

  const editedImagesPromises = corners.map((corner) => {
    const imageSavePath = path.join(outputPath, `${corner.name}.png`);
    return image()
      .extract(corner.options)
      .extend({
        top: corner.extendOptions.top,
        bottom: corner.extendOptions.bottom,
        left: corner.extendOptions.left,
        right: corner.extendOptions.right,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toColourspace("rgba")
      .toFile(imageSavePath)
      .then(() => {
        console.log(`${corner.name} processed successfully.`);
        return sendImageToOpenAI(imageSavePath, prompt);
        node;
      });
  });

  const editedImages = await Promise.all(editedImagesPromises);
  // Now run the combination function after all images are edited and downloaded
  combineImages(outputPath, imageSize);
}

async function sendImageToOpenAI(imagePath, prompt) {
  const formData = new FormData();
  formData.append("image", fs.createReadStream(imagePath));
  formData.append("prompt", prompt);

  try {
    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
      },
    });
    const data = await response.json();

    if (data && data.data) {
      const downloadPromises = data.data.map((image) =>
        downloadImage(
          image.url,
          `${path.basename(imagePath, ".png")}-edited.png`
        )
      );
      await Promise.all(downloadPromises);
    } else {
      console.log(data);
    }
    return imagePath.replace(".png", "-edited.png"); // Assume successful download and renaming
  } catch (error) {
    console.error("Failed to send image to OpenAI:", error);
    return null; // Indicate failure
  }
}

async function downloadImage(url, outputPath) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  fs.writeFile(path.join("output", outputPath), buffer, () =>
    console.log("Downloaded and saved:", outputPath)
  );
}

async function combineImages(outputPath, imageSize) {
  const imageNames = ["topLeft", "topRight", "bottomLeft", "bottomRight"];
  const masterImage = sharp({
    create: {
      width: imageSize * 2,
      height: imageSize * 2,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  });

  const composites = imageNames.map((name) => {
    return {
      input: path.join(outputPath, `${name}-edited.png`),
      left: name.includes("Right") ? imageSize : 0,
      top: name.includes("bottom") ? imageSize : 0,
    };
  });

  masterImage
    .composite(composites)
    .jpeg({ quality: 100 }) // Specify JPEG output and quality
    .toFile(path.join(outputPath, "masterImage.jpg")) // Change the extension to .jpg
    .then(() => console.log("Master JPEG image created successfully."))
    .catch((err) => console.error("Error in creating master JPEG image:", err));
}

if (process.argv.length < 4) {
  console.log("Usage: node processImage.js <imagePath> <prompt>");
  process.exit(1);
}

const [, , imagePath, prompt] = process.argv;
processImage(imagePath, prompt);
