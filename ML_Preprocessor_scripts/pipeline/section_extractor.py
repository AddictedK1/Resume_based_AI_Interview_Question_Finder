import re
import spacy

nlp = spacy.load("en_core_web_sm")

# Tech/domain keywords to watch for in project and experience text
# Add more as you see them in your test resumes
DOMAIN_KEYWORDS = [
    "api", "rest", "graphql", "database", "backend", "frontend", "full stack",
    "authentication", "deployment", "real-time", "machine learning", "model",
    "neural network", "classification", "regression", "clustering", "nlp",
    "computer vision", "data pipeline", "cloud", "microservices", "caching",
    "optimization", "automation", "web scraping", "chatbot", "recommendation",
    "e-commerce", "payment gateway", "oauth", "jwt", "websocket", "socket.io",
    "crud", "mvc", "scalability", "load balancing", "data analysis", "dashboard",
    "visualization", "prediction", "training", "inference", "embedding",
    "search engine", "notification", "file upload", "image processing",
]

def extract_from_projects(projects_text: str) -> list[str]:
    """
    From projects section, extract:
    - Tech tools/frameworks mentioned
    - Domain concepts (what the project does)
    - Noun phrases that describe the work
    """
    if not projects_text:
        return []

    keywords = []
    text_lower = projects_text.lower()

    # Extract known domain keywords
    for kw in DOMAIN_KEYWORDS:
        if kw in text_lower:
            keywords.append(kw)

    # Use spaCy to extract noun chunks (e.g. "sentiment analysis model", "login system")
    doc = nlp(projects_text)
    for chunk in doc.noun_chunks:
        phrase = chunk.text.strip().lower()
        # Keep 2-4 word meaningful phrases, skip single generic words
        words = phrase.split()
        if 2 <= len(words) <= 4:
            keywords.append(phrase)

    return list(set(keywords))


def extract_from_experience(experience_text: str) -> list[str]:
    """
    From experience/internship section, extract:
    - Technologies and tools used
    - Domain context (what industry/type of work)
    - Action-oriented concepts
    """
    if not experience_text:
        return []

    keywords = []
    text_lower = experience_text.lower()

    # Extract known domain keywords
    for kw in DOMAIN_KEYWORDS:
        if kw in text_lower:
            keywords.append(kw)

    # Extract noun chunks same as projects
    doc = nlp(experience_text)
    for chunk in doc.noun_chunks:
        phrase = chunk.text.strip().lower()
        words = phrase.split()
        if 2 <= len(words) <= 4:
            keywords.append(phrase)

    return list(set(keywords))


def extract_from_education(education_text: str) -> list[str]:
    """
    From education section, extract:
    - Field of study (gives context about background)
    - Relevant coursework if mentioned
    """
    if not education_text:
        return []

    keywords = []
    text_lower = education_text.lower()

    EDUCATION_SIGNALS = [
        "computer science", "information technology", "software engineering",
        "data science", "artificial intelligence", "electronics", "mathematics",
        "data structures", "algorithms", "operating systems", "computer networks",
        "database", "machine learning", "web development", "software development",
    ]

    for signal in EDUCATION_SIGNALS:
        if signal in text_lower:
            keywords.append(signal)

    return list(set(keywords))


def extract_from_summary(summary_text: str) -> list[str]:
    """
    From summary/objective, extract self-described focus areas.
    """
    if not summary_text:
        return []

    doc = nlp(summary_text)
    keywords = []

    for chunk in doc.noun_chunks:
        phrase = chunk.text.strip().lower()
        words = phrase.split()
        if 1 <= len(words) <= 3:
            keywords.append(phrase)

    return list(set(keywords))