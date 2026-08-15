import fs from 'fs';

const allData = JSON.parse(fs.readFileSync('src/data.json', 'utf-8'));

function extractRelevantData(query) {
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
  
  const matchedTimetables = allData.timetables.filter((t) => {
    const className = (t.data.class || "").toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    let fileName = t.fileName.toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    fileName = fileName.replace('.json', '');
    
    const matchTerms = [fileName, className];
    
    if (fileName.includes('ธดท')) matchTerms.push(fileName.replace('ธดท', 'ธุรกิจดิจิทัล'));
    if (fileName.includes('it')) {
       matchTerms.push(fileName.replace('it', 'เทคโนโลยีสารสนเทศ'));
       matchTerms.push(fileName.replace('it', 'ไอที'));
    }
    if (fileName.includes('เว็บ')) {
       matchTerms.push(fileName.replace('เว็บ', 'เทคโนโลยีสารสนเทศ'));
       matchTerms.push(fileName.replace('เว็บ', 'ไอที'));
    }
    if (fileName.includes('เกม')) {
       matchTerms.push(fileName.replace('เกม', 'คอมพิวเตอร์เกมและแอนิเมชัน'));
       matchTerms.push(fileName.replace('เกม', 'คอมพิวเตอร์เกม'));
    }
    
    const cleanStr = (s) => s.replace(/\./g, '');
    const cleanQuery = cleanStr(normalizedQuery.replace(/ปวช\.?/g, '')); 
    const cleanNormQuery = cleanStr(normalizedQuery);
    
    const isMatch = matchTerms.some(term => cleanQuery.includes(cleanStr(term)) || cleanNormQuery.includes(cleanStr(term)));
    if (isMatch) {
      console.log(`Matched! file: ${fileName}, className: ${className}, matchTerms: ${JSON.stringify(matchTerms)}, cleanQuery: ${cleanQuery}, cleanNormQuery: ${cleanNormQuery}`);
    }
    return isMatch;
  });
  
  return matchedTimetables;
}

const res1 = extractRelevantData("ปวช 2/2 ธุรกิจดิจิทัล");
console.log("Matches for 'ปวช 2/2 ธุรกิจดิจิทัล':", res1.length);
const res2 = extractRelevantData("ปวช 2 ธดท");
console.log("Matches for 'ปวช 2 ธดท':", res2.length);
