const fs = require('fs');
const path = require('path');

function applyTranslateToPath(dAttribute, translateX, translateY) {
  // Match coordinates in the d attribute (M and L commands)
  return dAttribute.replace(/([ML])(\d+\.?\d*),(\d+\.?\d*)/g, (match, command, x, y) => {
    const newX = parseFloat(x) + translateX;
    const newY = parseFloat(y) + translateY;
    return `${command}${newX.toFixed(2)},${newY.toFixed(2)}`;
  });
}

function convertSvgTransforms(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Process each path with transform="translate(36 -18)"
  const converted = content.replace(
    /<path d="([^"]+)" transform="translate\(36 -18\)" \/>/g,
    (match, dAttribute) => {
      const newD = applyTranslateToPath(dAttribute, 36, -18);
      return `<path d="${newD}" />`;
    }
  );
  
  return converted;
}

// Process the SVG file
const svgPath = path.join(__dirname, '..', 'public', 'map_blueprints', 'bank', '1f-hatches.svg');
const convertedContent = convertSvgTransforms(svgPath);

// Write the converted content back to the file
fs.writeFileSync(svgPath, convertedContent, 'utf8');

console.log('Successfully converted SVG transforms to d attributes');
