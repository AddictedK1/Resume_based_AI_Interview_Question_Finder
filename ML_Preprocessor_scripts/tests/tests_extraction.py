# tests/test_extraction.py

# from pipeline.pdf_parser import extract_clean_text
# from pipeline.skill_extractor import extract_skills, SKILLS_DB
from pipeline.profile_builder import build_profile
from pipeline.extract_resume_skills import extract_clean_text, extract_skills, skills_list


text = extract_clean_text("tests/kp_resume.pdf")

# Test skills directly
skills = extract_skills(text, skills_list)
print("Extracted skills:", skills)

# Test full pipeline
profile = build_profile(text)
print("\nProfile string preview:")
print(profile["profile_string"][:500])