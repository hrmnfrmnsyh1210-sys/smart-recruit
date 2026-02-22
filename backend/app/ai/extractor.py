"""Named Entity Recognition Module - Extracts structured data from CV text."""

import re
from typing import Optional


# Common technical skills database
TECH_SKILLS = {
    # Programming Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "php",
    "swift", "kotlin", "go", "golang", "rust", "scala", "perl", "r", "matlab",
    "dart", "lua", "haskell", "elixir", "clojure", "objective-c",
    # Web Frameworks
    "react", "reactjs", "react.js", "angular", "vue", "vuejs", "vue.js",
    "next.js", "nextjs", "nuxt", "svelte", "django", "flask", "fastapi",
    "spring", "spring boot", "express", "expressjs", "laravel", "rails",
    "ruby on rails", "asp.net", ".net", "node.js", "nodejs",
    # Databases
    "mysql", "postgresql", "postgres", "mongodb", "redis", "elasticsearch",
    "sqlite", "oracle", "sql server", "cassandra", "dynamodb", "firebase",
    "neo4j", "mariadb", "couchdb",
    # Cloud & DevOps
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
    "terraform", "ansible", "jenkins", "gitlab ci", "github actions",
    "ci/cd", "linux", "nginx", "apache",
    # Data Science & AI
    "machine learning", "deep learning", "tensorflow", "pytorch", "keras",
    "scikit-learn", "pandas", "numpy", "nlp", "computer vision",
    "data analysis", "data science", "big data", "hadoop", "spark",
    "tableau", "power bi",
    # Mobile
    "android", "ios", "react native", "flutter", "xamarin",
    # Tools & Others
    "git", "github", "gitlab", "bitbucket", "jira", "confluence",
    "figma", "photoshop", "illustrator", "sketch",
    "agile", "scrum", "kanban", "rest api", "graphql", "microservices",
    "html", "css", "sass", "less", "tailwind", "bootstrap",
    "sql", "nosql", "api", "oauth", "jwt",
}

# Soft skills
SOFT_SKILLS = {
    "leadership", "communication", "teamwork", "problem solving",
    "critical thinking", "time management", "project management",
    "analytical", "creative", "adaptable", "detail-oriented",
    "collaboration", "presentation", "negotiation", "mentoring",
    "kepemimpinan", "komunikasi", "kerja tim", "manajemen proyek",
    "analitis", "kreatif", "adaptif",
}

# Education keywords
EDUCATION_KEYWORDS = {
    "sarjana", "bachelor", "s1", "s.kom", "s.t", "s.si", "s.e",
    "master", "magister", "s2", "m.kom", "m.t", "m.si", "mba",
    "doktor", "phd", "s3", "dr.",
    "diploma", "d3", "d4",
    "sma", "smk", "smp",
    "universitas", "university", "institut", "politeknik",
    "college", "school", "academy", "akademi",
}

# Section headers to identify CV sections
SECTION_PATTERNS = {
    "experience": [
        r"(?i)(work\s*experience|pengalaman\s*kerja|professional\s*experience|employment|riwayat\s*pekerjaan|experience)",
    ],
    "education": [
        r"(?i)(education|pendidikan|academic|riwayat\s*pendidikan|qualifications)",
    ],
    "skills": [
        r"(?i)(skills|keahlian|kemampuan|technical\s*skills|competenc|keterampilan)",
    ],
    "certifications": [
        r"(?i)(certif|sertif|licenses|lisensi|training|pelatihan)",
    ],
}


def extract_entities(text: str) -> dict:
    """Extract structured entities from CV text."""
    result = {
        "name": _extract_name(text),
        "email": _extract_email(text),
        "phone": _extract_phone(text),
        "skills": _extract_skills(text),
        "experience": _extract_experience(text),
        "education": _extract_education(text),
        "certifications": _extract_certifications(text),
        "summary": _extract_summary(text),
    }
    return result


def _extract_name(text: str) -> str:
    """Extract name - typically the first meaningful line of a CV."""
    lines = text.strip().split("\n")
    for line in lines[:5]:
        line = line.strip()
        # Skip empty lines and lines that look like headers/contact info
        if not line or "@" in line or re.match(r'^[\d\s\-+()]+$', line):
            continue
        # Skip lines that are too long (likely not a name)
        if len(line) > 60:
            continue
        # Skip lines with common non-name content
        if re.match(r'(?i)(curriculum|resume|cv|daftar|phone|email|address|alamat)', line):
            continue
        # A name line typically has 2-4 words, all starting with uppercase
        words = line.split()
        if 1 <= len(words) <= 5:
            return line
    return "Unknown"


def _extract_email(text: str) -> str:
    """Extract email address using regex."""
    match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', text)
    return match.group(0) if match else ""


def _extract_phone(text: str) -> str:
    """Extract phone number using regex."""
    patterns = [
        r'(?:\+62|62|0)\s*\d{2,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}',  # Indonesian
        r'\+?\d{1,3}[\s\-]?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}',  # International
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0).strip()
    return ""


def _extract_skills(text: str) -> list[str]:
    """Extract skills from CV text."""
    text_lower = text.lower()
    found_skills = []

    # Check for technical skills
    for skill in TECH_SKILLS:
        # Use word boundary matching
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.append(skill.title() if len(skill) > 3 else skill.upper())

    # Check for soft skills
    for skill in SOFT_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.append(skill.title())

    return list(set(found_skills))


def _extract_experience(text: str) -> list[dict]:
    """Extract work experience entries."""
    experiences = []
    lines = text.split("\n")

    in_experience_section = False
    current_exp = None

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Check if we're entering experience section
        for pattern in SECTION_PATTERNS["experience"]:
            if re.search(pattern, line):
                in_experience_section = True
                continue

        # Check if we're leaving experience section (entering another section)
        if in_experience_section:
            for section, patterns in SECTION_PATTERNS.items():
                if section != "experience":
                    for pattern in patterns:
                        if re.search(pattern, line):
                            in_experience_section = False
                            break

        if not in_experience_section:
            continue

        # Try to parse experience entry
        # Look for date patterns that indicate a new entry
        date_match = re.search(
            r'(\d{4}\s*[-–]\s*(?:\d{4}|present|sekarang|saat ini))|'
            r'((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\w*\s+\d{4})',
            line, re.IGNORECASE,
        )

        if date_match:
            if current_exp:
                experiences.append(current_exp)
            current_exp = {
                "company": "",
                "title": line.split(date_match.group(0))[0].strip(" -–|,"),
                "duration": date_match.group(0).strip(),
                "description": "",
            }
        elif current_exp:
            if not current_exp["company"]:
                current_exp["company"] = line
            else:
                current_exp["description"] += (" " + line) if current_exp["description"] else line

    if current_exp:
        experiences.append(current_exp)

    return experiences[:10]  # Limit to 10 entries


def _extract_education(text: str) -> list[dict]:
    """Extract education entries."""
    education = []
    lines = text.split("\n")

    in_education_section = False
    current_edu = None

    for line in lines:
        line = line.strip()
        if not line:
            continue

        for pattern in SECTION_PATTERNS["education"]:
            if re.search(pattern, line):
                in_education_section = True
                continue

        if in_education_section:
            for section, patterns in SECTION_PATTERNS.items():
                if section != "education":
                    for pattern in patterns:
                        if re.search(pattern, line):
                            in_education_section = False
                            break

        if not in_education_section:
            continue

        # Look for education keywords
        has_edu_keyword = any(kw in line.lower() for kw in EDUCATION_KEYWORDS)
        year_match = re.search(r'\b(19|20)\d{2}\b', line)

        if has_edu_keyword or year_match:
            if current_edu and (current_edu.get("institution") or current_edu.get("degree")):
                education.append(current_edu)

            current_edu = {
                "institution": "",
                "degree": "",
                "year": year_match.group(0) if year_match else "",
            }

            # Try to split line into degree and institution
            if has_edu_keyword:
                for kw in ["universitas", "university", "institut", "politeknik", "college", "akademi"]:
                    if kw in line.lower():
                        idx = line.lower().index(kw)
                        current_edu["degree"] = line[:idx].strip(" -–|,")
                        current_edu["institution"] = line[idx:].split(str(year_match.group(0)) if year_match else "END")[0].strip(" -–|,")
                        break
                if not current_edu["institution"]:
                    current_edu["degree"] = line.split(str(year_match.group(0)) if year_match else "END")[0].strip(" -–|,")
        elif current_edu:
            if not current_edu["institution"]:
                current_edu["institution"] = line
            elif not current_edu["degree"]:
                current_edu["degree"] = line

    if current_edu and (current_edu.get("institution") or current_edu.get("degree")):
        education.append(current_edu)

    return education[:5]


def _extract_certifications(text: str) -> list[str]:
    """Extract certifications from CV text."""
    certs = []
    lines = text.split("\n")
    in_cert_section = False

    for line in lines:
        line = line.strip()
        if not line:
            continue

        for pattern in SECTION_PATTERNS["certifications"]:
            if re.search(pattern, line):
                in_cert_section = True
                continue

        if in_cert_section:
            for section, patterns in SECTION_PATTERNS.items():
                if section != "certifications":
                    for pattern in patterns:
                        if re.search(pattern, line):
                            in_cert_section = False
                            break

        if in_cert_section and len(line) > 5 and len(line) < 200:
            # Clean up bullet points and numbering
            cleaned = re.sub(r'^[\d\.\-\*•►▪]+\s*', '', line).strip()
            if cleaned:
                certs.append(cleaned)

    return certs[:20]


def _extract_summary(text: str) -> str:
    """Extract professional summary."""
    lines = text.split("\n")

    for i, line in enumerate(lines):
        if re.search(r'(?i)(summary|ringkasan|profil|profile|about|tentang)', line):
            summary_lines = []
            for j in range(i + 1, min(i + 6, len(lines))):
                next_line = lines[j].strip()
                if not next_line:
                    continue
                # Stop if we hit another section header
                is_header = False
                for patterns in SECTION_PATTERNS.values():
                    for pattern in patterns:
                        if re.search(pattern, next_line):
                            is_header = True
                            break
                if is_header:
                    break
                summary_lines.append(next_line)
            if summary_lines:
                return " ".join(summary_lines)

    # If no summary section found, use first few lines after name/contact
    content_lines = []
    for line in lines[3:8]:
        line = line.strip()
        if line and len(line) > 30 and "@" not in line and not re.match(r'^[\d\s\-+()]+$', line):
            content_lines.append(line)
    return " ".join(content_lines[:3]) if content_lines else ""
