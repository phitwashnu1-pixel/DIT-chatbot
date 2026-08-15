import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'Data');
const outputFilePath = path.join(process.cwd(), 'src', 'data.json');

function readJsonFiles(dir) {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      result.push(...readJsonFiles(path.join(dir, file.name)));
    } else if (file.name.endsWith('.json')) {
      const filePath = path.join(dir, file.name);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        result.push({
          fileName: file.name.replace('.json', ''),
          data: JSON.parse(content)
        });
      } catch (err) {
        console.error(`Error reading ${filePath}:`, err);
      }
    }
  }
  return result;
}

function buildData() {
  const data = {
    classrooms: readJsonFiles(path.join(dataDir, 'Classroom')),
    teachers: readJsonFiles(path.join(dataDir, 'Teachers')),
    timetables: readJsonFiles(path.join(dataDir, 'timetable'))
  };

  if (!fs.existsSync(path.join(process.cwd(), 'src'))) {
    fs.mkdirSync(path.join(process.cwd(), 'src'), { recursive: true });
  }

  fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2));
  console.log('Successfully built src/data.json');
}

buildData();
