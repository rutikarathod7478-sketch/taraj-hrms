export interface ParsedResumeData {
  candidateType: 'Fresher' | 'Experienced';
  experienceYears: number;
  education?: string;
  collegeOrInstitution?: string;
  previousCompany?: string;
  designation?: string;
  skills?: string;
  projects?: string;
  currentCtc?: string;
  expectedCtc?: string;
  noticePeriod?: number;
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
}

/**
 * Extract raw text from PDF or DOCX buffer
 */
export async function extractTextFromBuffer(buffer: Buffer, originalFilename: string): Promise<string> {
  const ext = originalFilename.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { extractText } = require('unpdf');
      const result = await extractText(new Uint8Array(buffer));
      if (Array.isArray(result.text)) {
        return result.text.join('\n');
      }
      return result.text || '';
    } catch (pdfErr) {
      console.warn('[ResumeParser] unpdf error, attempting fallback:', pdfErr);
      return buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ');
    }
  }

  if (ext === 'docx' || ext === 'doc') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (docxErr) {
      console.warn('[ResumeParser] Mammoth docx error:', docxErr);
      return buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ');
    }
  }

  return buffer.toString('utf-8');
}

/**
 * Intelligent heuristic & regex resume parser
 */
export function parseResumeText(rawText: string): ParsedResumeData {
  const text = rawText || '';
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const result: ParsedResumeData = {
    candidateType: 'Fresher',
    experienceYears: 0,
    education: '',
    collegeOrInstitution: '',
    previousCompany: '',
    designation: '',
    skills: '',
    projects: '',
    currentCtc: '',
    expectedCtc: '',
    noticePeriod: 30,
    fullName: '',
    email: '',
    phone: '',
    location: '',
  };

  if (!text.trim()) return result;

  // 1. Contact & Identity Details
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) result.email = emailMatch[0];

  const phoneMatch = text.match(/(?:\+?91[\s-]?)?([6-9]\d{9})\b/);
  if (phoneMatch) result.phone = phoneMatch[1];

  // Heuristic Name: usually first non-empty line before symbols
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (
      line.length >= 3 &&
      line.length <= 40 &&
      !line.includes('@') &&
      !line.includes('http') &&
      !line.includes('www') &&
      !/\d/.test(line) &&
      !/\b(resume|curriculum|vitae|page)\b/i.test(line)
    ) {
      result.fullName = line.replace(/[^A-Za-z\s]/g, '').trim();
      break;
    }
  }

  // 2. Candidate Track: Fresher vs Experienced
  const isFresherKeyword = /\b(fresher|entry[\s-]level|fresh graduate|recent graduate|college student|pursuing graduate)\b/i.test(
    text
  );
  const hasWorkExpHeader = /\b(work experience|professional experience|employment history|work history|experience summary)\b/i.test(
    text
  );

  const expMatch =
    text.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)\b/i) ||
    text.match(/(?:experience|exp)(?:\s*:)?\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\b/i);

  let expYears = 0;
  if (expMatch) {
    expYears = parseFloat(expMatch[1]);
  }

  // Date range detection (e.g. 2021 - 2024, Jan 2022 - Present)
  const dateRanges = text.match(/\b(201\d|202\d)\s*[-–to]+\s*(201\d|202\d|present|current)\b/gi);
  if (!expYears && dateRanges && dateRanges.length > 0 && hasWorkExpHeader) {
    expYears = Math.min(10, Math.max(1, dateRanges.length * 1.5));
  }

  if (isFresherKeyword && expYears === 0) {
    result.candidateType = 'Fresher';
    result.experienceYears = 0;
  } else if (expYears >= 0.5 || (hasWorkExpHeader && !isFresherKeyword)) {
    result.candidateType = 'Experienced';
    result.experienceYears = expYears || 2;
  } else {
    result.candidateType = 'Fresher';
    result.experienceYears = 0;
  }

  // 3. Technical Skills
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Go', 'Golang', 'Ruby', 'Rust', 'Swift', 'Kotlin', 'SQL', 'HTML', 'HTML5', 'CSS', 'CSS3', 'SCSS', 'Sass',
    'React', 'React.js', 'Next.js', 'Angular', 'Vue', 'Vue.js', 'Redux', 'Tailwind', 'Tailwind CSS', 'Bootstrap', 'Node.js', 'Express', 'Express.js', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', '.NET',
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'Firebase', 'Supabase',
    'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins', 'Linux', 'Nginx',
    'REST API', 'RESTful APIs', 'GraphQL', 'Microservices', 'Postman', 'Jira', 'Agile', 'Scrum', 'Figma',
    'Machine Learning', 'Data Analysis', 'Pandas', 'NumPy'
  ];

  const matchedSkills: string[] = [];
  for (const sk of skillKeywords) {
    const esc = sk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${esc}\\b`, 'i');
    if (regex.test(text) && !matchedSkills.some((s) => s.toLowerCase() === sk.toLowerCase())) {
      matchedSkills.push(sk);
    }
  }
  if (matchedSkills.length > 0) {
    result.skills = matchedSkills.slice(0, 16).join(', ');
  }

  // 4. Education & Qualifications
  const degreePatterns = [
    /(B\.?Tech(?:nology)?(?:\s+(?:in|of)?\s+[A-Za-z\s]+)?)/i,
    /(B\.?E\.?(?:\s+(?:in|of)?\s+[A-Za-z\s]+)?)/i,
    /(M\.?Tech(?:nology)?(?:\s+(?:in|of)?\s+[A-Za-z\s]+)?)/i,
    /(MCA(?:\s+(?:in|of)?\s+[A-Za-z\s]+)?)/i,
    /(BCA(?:\s+(?:in|of)?\s+[A-Za-z\s]+)?)/i,
    /(B\.?Sc(?:\s+(?:in|of)?\s+[A-Za-z\s]+)?)/i,
    /(M\.?Sc(?:\s+(?:in|of)?\s+[A-Za-z\s]+)?)/i,
    /(MBA(?:\s+(?:in|of)?\s+[A-Za-z\s]+)?)/i,
    /(Bachelor(?:\s+of\s+[A-Za-z\s]+)?)/i,
    /(Master(?:\s+of\s+[A-Za-z\s]+)?)/i,
    /(Diploma(?:\s+in\s+[A-Za-z\s]+)?)/i,
  ];
  for (const dp of degreePatterns) {
    const m = text.match(dp);
    if (m) {
      result.education = m[1].replace(/\s+/g, ' ').trim().slice(0, 60);
      break;
    }
  }

  // 5. College / Institute
  const collegeMatch = text.match(
    /([A-Z][A-Za-z0-9&.,\s]+(?:College|University|Institute|Academy|School of Engineering|COEP|VIT|IIT|NIT|BITS|Symbiosis)[A-Za-z0-9&.,\s]*)/i
  );
  if (collegeMatch) {
    const cleaned = collegeMatch[1].split('\n')[0].replace(/\s+/g, ' ').trim();
    result.collegeOrInstitution = cleaned.slice(0, 70);
    if (result.candidateType === 'Fresher' && !result.previousCompany) {
      result.previousCompany = result.collegeOrInstitution;
    }
  }

  // 6. Designation
  const designationPatterns = [
    /Full[\s-]Stack Developer/i,
    /Frontend Developer/i,
    /Backend Developer/i,
    /Senior Software Engineer/i,
    /Associate Software Engineer/i,
    /Software Engineer/i,
    /Web Developer/i,
    /React(?:.js)? Developer/i,
    /Node(?:.js)? Developer/i,
    /Java Developer/i,
    /Python Developer/i,
    /DevOps Engineer/i,
    /QA Engineer|Quality Analyst/i,
    /UI\/UX Designer/i,
    /Data Analyst/i,
    /Data Scientist/i,
    /Project Manager/i,
    /HR Executive|HR Manager/i,
  ];
  for (const des of designationPatterns) {
    const m = text.match(des);
    if (m) {
      result.designation = m[0].trim();
      break;
    }
  }

  // 7. Previous Company (if experienced)
  if (result.candidateType === 'Experienced') {
    const companyMatch = text.match(/(?:at|company|employer|organisation|organization)[:\s]+([A-Z][A-Za-z0-9&.,\s]{2,40})/i);
    if (companyMatch) {
      result.previousCompany = companyMatch[1].split('\n')[0].trim().replace(/\s+/g, ' ').replace(/[.,;:]$/, '');
    } else {
      const topCompanies = [
        'Tata Consultancy Services',
        'TCS',
        'Infosys',
        'Wipro',
        'Accenture',
        'Cognizant',
        'Capgemini',
        'HCL Technologies',
        'Tech Mahindra',
        'IBM',
        'Oracle',
        'Amazon',
        'Microsoft',
        'Google',
      ];
      for (const comp of topCompanies) {
        if (new RegExp(`\\b${comp}\\b`, 'i').test(text)) {
          result.previousCompany = comp;
          break;
        }
      }
    }
  }

  // 8. Expected / Current CTC
  const ctcMatch = text.match(/(?:CTC|Salary|Package)[:\s]+(?:₹|Rs\.?|INR)?\s*([0-9.,]+(?:\s*(?:LPA|Lacs|Lakhs))?)/i);
  if (ctcMatch) {
    result.expectedCtc = ctcMatch[1].trim();
  }

  // 9. Notice Period
  const noticeMatch = text.match(/(?:Notice\s*Period)[:\s]+(\d+)\s*(?:days?|months?)|(\bimmediate\b)/i);
  if (noticeMatch) {
    if (noticeMatch[2]) {
      result.noticePeriod = 0;
    } else if (noticeMatch[1]) {
      const val = parseInt(noticeMatch[1]);
      result.noticePeriod = text.toLowerCase().includes('month') ? val * 30 : val;
    }
  }

  // 10. Projects excerpt
  const projIndex = text.search(/\b(projects|academic projects|key projects|major projects)\b/i);
  if (projIndex !== -1) {
    const snippet = text.slice(projIndex, projIndex + 260);
    const cleaned = snippet.split('\n').slice(1, 4).join(' ').replace(/\s+/g, ' ').trim();
    if (cleaned.length > 10) {
      result.projects = cleaned.slice(0, 220);
    }
  }

  return result;
}
