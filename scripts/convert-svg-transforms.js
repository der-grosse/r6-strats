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
  
  // Create regex pattern using the transform values
  const translatePattern = `translate\\(${transform[0]} ${transform[1]}\\)`;
  const regex = new RegExp(`<path d="([^"]+)" transform="${translatePattern}" \\/>`, 'g');
  
  // Process each path with the dynamic transform pattern
  const converted = content.replace(
    regex,
    (match, dAttribute) => {
      const newD = applyTranslateToPath(dAttribute, transform[0], transform[1]);
      return `<path d="${newD}" />`;
    }
  );
  
  return converted;
}

const transform = [-64, 0]; // Translate values to apply
// Process the SVG file
const svgPath = path.join(__dirname, '..', 'public', 'map_blueprints', 'consulate', '2f-windows.svg');
const convertedContent = convertSvgTransforms(svgPath);

// Write the converted content back to the file
fs.writeFileSync(svgPath, convertedContent, 'utf8');

console.log('Successfully converted SVG transforms to d attributes');
