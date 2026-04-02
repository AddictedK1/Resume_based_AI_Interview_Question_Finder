from pipeline.section_splitter import split_sections, get_section
from pipeline.extract_resume_skills import extract_skills          # your existing file
from pipeline.section_extractor import (
    extract_from_projects,
    extract_from_experience,
    extract_from_education,
    extract_from_summary,
)
from pipeline.ontology import expand_skills


def build_profile(resume_text: str) -> dict:
    """
    Master function — takes raw resume text, returns:
    - profile_string: the text to embed
    - metadata: all extracted pieces (for debugging / display)
    """

    # Step 1: Split into sections
    sections = split_sections(resume_text)

    # Step 2: Extract from each section
    raw_skills      = extract_skills(get_section(sections, "skills"))
    project_terms   = extract_from_projects(get_section(sections, "projects"))
    experience_terms= extract_from_experience(get_section(sections, "experience"))
    education_terms = extract_from_education(get_section(sections, "education"))
    summary_terms   = extract_from_summary(get_section(sections, "summary"))

    # Step 3: Expand skills via ontology
    expanded_skills = expand_skills(raw_skills)

    # Step 4: Merge everything (deduplicated)
    all_terms = list(set(
        expanded_skills +
        project_terms   +
        experience_terms+
        education_terms +
        summary_terms
    ))

    # Step 5: Build the profile string
    # Giving skills/expanded more weight by repeating them in the string
    profile_string = (
        f"Technical skills and expertise: {', '.join(expanded_skills)}. "
        f"Project experience: {', '.join(project_terms)}. "
        f"Work experience: {', '.join(experience_terms)}. "
        f"Educational background: {', '.join(education_terms)}. "
        f"Profile: {', '.join(summary_terms)}."
    )

    return {
        "profile_string":   profile_string,
        "raw_skills":       raw_skills,
        "expanded_skills":  expanded_skills,
        "project_terms":    project_terms,
        "experience_terms": experience_terms,
        "education_terms":  education_terms,
        "summary_terms":    summary_terms,
        "sections_found":   list(sections.keys()),
    }