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

async function reprocessCorner(cornerName, prompt) {
  const inputPath = "output/" + cornerName + ".png";
  const outputPath = "output";
  const imageSize = 1024; // Assuming the same image size as the original script

  // Step 1: Send the new image data to OpenAI and get the edited image
  const editedImagePath = await sendImageToOpenAI(inputPath, prompt);
  if (!editedImagePath) {
    console.error("Failed to process the new image for corner:", cornerName);
    return;
  }

  await combineImages(outputPath, imageSize);
  console.log(
    "Reprocessed master image successfully with the new corner:",
    cornerName
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
      return `${path.basename(imagePath, ".png")}-edited.png`;
    } else {
      console.error("No data returned from OpenAI");
      console.log(data);
      return null;
    }
  } catch (error) {
    console.error("Failed to send image to OpenAI:", error);
    return null;
  }
}

async function downloadImage(url, outputPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch the image: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer(); // Changed from `buffer()` to address deprecation

    // Define the full output path for correct file saving
    const fullOutputPath = path.join("output", outputPath);

    // Synchronously write file to ensure that no other operation is pending on this file
    fs.writeFileSync(fullOutputPath, Buffer.from(buffer)); // Using Buffer.from to convert ArrayBuffer to Node.js Buffer
    console.log("Successfully downloaded and saved:", outputPath);
  } catch (error) {
    console.error("Failed to download or save image:", error);
  }
}

const args = process.argv.slice(2);
if (args.length != 2) {
  console.log("Usage: node reprocessCorner.js <cornerName> <prompt>");
  process.exit(1);
}

const [cornerName, prompt] = args;

reprocessCorner(cornerName, prompt).catch((err) => {
  console.error("Error occurred:", err);
});
