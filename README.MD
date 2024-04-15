# NodeOutpaint

## Overview

This script takes an input image, divides it into four squares, uses the Dall-E 2 OpenAI API point to extend these images and reassembles them into a larger (2048px x 2048px) image.

You can use it to outpaint or extend (Dall-E 2, Dall-E 3) generations as long as the input generation is 1024px by 1024px.

Before:

![github1](https://github.com/darrylschaefer/NodeOutpainting/assets/119073511/8b251194-e271-40f7-808f-3ac590c87e1e)

After:

![github2](https://github.com/darrylschaefer/NodeOutpainting/assets/119073511/15fc4d6a-8e1f-4620-b9bc-8f4713bda1bf)

## Installation

To set up the project on your local machine, follow these steps:

1. Ensure that Node.js is installed on your system. You can download and install it from [Node.js official website](https://nodejs.org/).

2. Clone the repository to your local machine or download the source code.

3. Navigate to the project directory and install dependencies:

   ```bash
   npm install
   ```

4. Modify processImage.js and reprocessCorner.js scripts with your OpenAI API key (line 7).

## Usage

To run the application, you need to provide an image file. Place your input image in the root of the project directory. Use the following command to start the image processing:

```bash
node processImage.js image_filename.jpg "Your image prompt goes in this string"
```

Replace `'image_filename.jpg'` with the path to your input image. There's an example.jpg included - so feel free to use that one to test it out!

Dall-E 2 Edits Endpoint can be inconsistent when given 1/4 of an image to extend. This will likely require you to request remakes of specific corners until you find something visually consistent. There's a secondary script for generating a new corner and rebuilding the master image.

### Fixing a Corner

You can fix a corner by running the following command:

```bash
node reprocessCorner.js corner "Your image prompt goes in this string"
```

Replace "corner" with the corner to be replaced (bottomLeft, bottomRight, topLeft, topRight). Add your prompt to be used to extend the image!

## Tips

Higher detail source images (from Dall-E 3) seem to work better for consistent outpainting. Lower detailed, abstract images cause a lot of hallucinations (artifacts, spontaneous faces, random text) to appear in the edits.

Increasing the amount of source image that is fed into the Edits API will probably increase the consistency and quality of the outputs however this script is currently not modified to do that.

## Inspiration

This project was inspired by dalle2_outpaint by mdbecker! https://github.com/mdbecker/dalle2_outpaint

## Support

For any issues or questions regarding the application, please open an issue in the project repository on GitHub.
