import re

# Common section header patterns found in resumes
SECTION_HEADERS = {
    "skills":      ["skills", "technical skills", "technologies", "tools", "core competencies"],
    "projects":    ["projects", "personal projects", "academic projects", "key projects"],
    "experience":  ["experience", "work experience", "internship", "employment", "professional experience"],
    "education":   ["education", "academic background", "qualifications"],
    "summary":     ["summary", "objective", "about me", "profile", "overview"],
}

def split_sections(text: str) -> dict[str, str]:
    lines = text.split("\n")
    sections = {}
    current_section = "header"    # text before any section header
    current_lines = []

    for line in lines:
        line_stripped = line.strip()
        line_lower = line_stripped.lower()

        # Check if this line is a section header
        matched_section = None
        for section_key, keywords in SECTION_HEADERS.items():
            if any(line_lower == kw or line_lower.startswith(kw) for kw in keywords):
                matched_section = section_key
                break

        if matched_section:
            # Save the previous section
            if current_lines:
                sections[current_section] = "\n".join(current_lines).strip()
            current_section = matched_section
            current_lines = []
        else:
            current_lines.append(line_stripped)

    # Save the last section
    if current_lines:
        sections[current_section] = "\n".join(current_lines).strip()

    return sections


def get_section(sections: dict, key: str) -> str:
    """Safe getter — returns empty string if section not found."""
    return sections.get(key, "")