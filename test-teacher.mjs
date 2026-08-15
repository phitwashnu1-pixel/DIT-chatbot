import fs from 'fs';

const allData = JSON.parse(fs.readFileSync('src/data.json', 'utf-8'));

const subjectDictionary = {};
if (allData.teachers) {
  allData.teachers.forEach((t) => {
    if (t.data.subjects && Array.isArray(t.data.subjects)) {
      t.data.subjects.forEach((subj) => {
        if (subj.subject_code && subj.subject_name) {
          subjectDictionary[subj.subject_code] = subj.subject_name;
        }
      });
    }
  });
}

function extractRelevantData(query) {
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
  
  const matchedClassrooms = allData.classrooms.filter((c) => {
    const roomName = (c.data.room || "").toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    const fileName = c.fileName.toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    const aliasMatch = roomName.match(/\((.*?)\)/);
    const alias = aliasMatch ? aliasMatch[1] : null;
    return normalizedQuery.includes(fileName) || 
           normalizedQuery.includes(roomName) || 
           (alias && normalizedQuery.includes(alias));
  });

  const matchedTeachers = allData.teachers.filter((t) => {
    const teacherName = (t.data.teacher || "").toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    const fileName = t.fileName.toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    return normalizedQuery.includes(fileName) || normalizedQuery.includes(teacherName);
  });

  const matchedTimetables = allData.timetables.filter((t) => {
    const className = (t.data.class || "").toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    let fileName = t.fileName.toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    fileName = fileName.replace('.json', '');
    
    const matchTerms = [fileName, className];
    if (fileName.includes('ธดท')) matchTerms.push(fileName.replace('ธดท', 'ธุรกิจดิจิทัล'));
    
    const cleanStr = (s) => s.replace(/\./g, '');
    const cleanQuery = cleanStr(normalizedQuery.replace(/ปวช\.?/g, '')); 
    const cleanNormQuery = cleanStr(normalizedQuery);
    
    return matchTerms.some(term => cleanQuery.includes(cleanStr(term)) || cleanNormQuery.includes(cleanStr(term)));
  });
  
  const hasMatches = matchedClassrooms.length > 0 || matchedTeachers.length > 0 || matchedTimetables.length > 0;
  
  if (hasMatches) {
    return {
      classrooms: matchedClassrooms,
      teachers: matchedTeachers,
      timetables: matchedTimetables,
      subject_dictionary: subjectDictionary,
    };
  }
  return null;
}

try {
    const res = extractRelevantData("ครูปาณวัฐ");
    console.log("matchedTeachers length:", res.teachers.length);
    const jsonStr = JSON.stringify(res, null, 2);
    console.log("JSON Size:", jsonStr.length);
} catch (e) {
    console.error("Error:", e);
}
