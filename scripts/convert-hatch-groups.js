#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Parses an SVG path's 'd' attribute to extract coordinates
 * @param {string} pathData - The 'd' attribute value from an SVG path
 * @returns {Array<{x: number, y: number}>} Array of coordinate points
 */
function parsePathCoordinates(pathData) {
  const coords = [];
  // Match coordinate pairs in the format "123.45,678.90"
  const matches = pathData.match(/([0-9]+\.?[0-9]*),([0-9]+\.?[0-9]*)/g);

  if (matches) {
    matches.forEach((match) => {
      const [x, y] = match.split(",").map(Number);
      coords.push({ x, y });
    });
  }

  return coords;
}

/**
 * Calculates the bounding box for a group of paths
 * @param {Array<string>} pathDataArray - Array of 'd' attribute values
 * @returns {Object} Bounding box with minX, minY, maxX, maxY
 */
function calculateBoundingBox(pathDataArray) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  pathDataArray.forEach((pathData) => {
    const coords = parsePathCoordinates(pathData);
    coords.forEach(({ x, y }) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
  });

  return { minX, minY, maxX, maxY };
}

/**
 * Converts hatch groups in an SVG file to clickable rectangles
 * @param {string} inputFilePath - Path to the input SVG file
 * @param {string} outputFilePath - Path for the output SVG file
 */
function convertHatchGroups(inputFilePath, outputFilePath) {
  try {
    // Read the SVG file
    const svgContent = fs.readFileSync(inputFilePath, "utf8");

    // Parse the SVG content using regex (simple approach for this specific case)
    let modifiedContent = svgContent;

    // Find all hatch groups and their content
    const hatchGroupRegex = /<g class="hatch">([\s\S]*?)<\/g>/g;
    let match;
    const replacements = [];

    while ((match = hatchGroupRegex.exec(svgContent)) !== null) {
      const groupContent = match[1];
      const fullMatch = match[0];

      // Extract all path 'd' attributes from this group
      const pathRegex = /<path d="([^"]+)"/g;
      const pathDataArray = [];
      let pathMatch;

      while ((pathMatch = pathRegex.exec(groupContent)) !== null) {
        pathDataArray.push(pathMatch[1]);
      }

      if (pathDataArray.length > 0) {
        // Calculate bounding box
        const bbox = calculateBoundingBox(pathDataArray);

        // Add some padding to make the clickable area slightly larger
        const padding = 5;
        const x = bbox.minX - padding;
        const y = bbox.minY - padding;
        const width = bbox.maxX - bbox.minX + padding * 2;
        const height = bbox.maxY - bbox.minY + padding * 2;

        // Create a rectangle that encompasses the entire hatch
        const rectangle = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="transparent" stroke="none" />`;

        replacements.push({
          original: fullMatch,
          replacement: rectangle,
        });
      }
    }

    // Apply all replacements
    replacements.forEach(({ original, replacement }) => {
      modifiedContent = modifiedContent.replace(original, replacement);
    });

    // Write the modified content to output file
    fs.writeFileSync(outputFilePath, modifiedContent, "utf8");

    console.log(`✅ Converted ${replacements.length} hatch groups`);
    console.log(`📁 Output saved to: ${outputFilePath}`);

    // Log the bounding boxes for verification
    console.log("\n📊 Hatch bounding boxes:");
    replacements.forEach((replacement, index) => {
      const rectMatch = replacement.replacement.match(
        /rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/
      );
      if (rectMatch) {
        const [, x, y, width, height] = rectMatch;
        console.log(
          `  Hatch ${
            index + 1
          }: x=${x}, y=${y}, width=${width}, height=${height}`
        );
      }
    });
  } catch (error) {
    console.error("❌ Error converting hatch groups:", error.message);
    process.exit(1);
  }
}

// Main execution
const inputFile = path.join(
  __dirname,
  "../public/map_blueprints/bank/2f-hatches.svg"
);
const outputFile = inputFile.replace(/\.svg$/, "-bounding.svg");

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Input file not found: ${inputFile}`);
  process.exit(1);
}

console.log(`🔄 Converting hatch groups in: ${inputFile}`);
convertHatchGroups(inputFile, outputFile);
