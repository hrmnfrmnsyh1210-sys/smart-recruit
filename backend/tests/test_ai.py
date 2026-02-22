"""Tests for the AI/NLP pipeline."""

import pytest
from app.ai.preprocessor import preprocess_text, tokenize, remove_stopwords, get_clean_tokens
from app.ai.extractor import extract_entities, _extract_email, _extract_phone, _extract_skills
from app.ai.matcher import compute_similarity, compute_skill_match
from app.ai.ranker import _generate_explanation


class TestPreprocessor:
    def test_preprocess_removes_urls(self):
        text = "Visit https://example.com for more info"
        result = preprocess_text(text)
        assert "https://example.com" not in result

    def test_preprocess_normalizes_whitespace(self):
        text = "Hello   World\n\nTest"
        result = preprocess_text(text)
        assert "  " not in result

    def test_tokenize(self):
        tokens = tokenize("Python Developer with 5 years experience")
        assert "python" in tokens
        assert "developer" in tokens

    def test_remove_stopwords(self):
        tokens = ["the", "python", "developer", "with", "experience"]
        result = remove_stopwords(tokens)
        assert "the" not in result
        assert "with" not in result
        assert "python" in result

    def test_get_clean_tokens(self):
        tokens = get_clean_tokens("The Python developer with excellent skills")
        assert "python" in tokens
        assert "the" not in tokens


class TestExtractor:
    sample_cv = """John Doe
    john.doe@email.com
    +62 812 3456 7890

    SUMMARY
    Experienced Python developer with 5 years of experience in web development.

    SKILLS
    Python, JavaScript, React, Django, PostgreSQL, Docker, Git

    WORK EXPERIENCE
    Senior Developer - PT Tech Company  2020 - present
    Developed web applications using Python and Django.

    Junior Developer - Startup Inc  2018 - 2020
    Built frontend components with React.

    EDUCATION
    Sarjana Informatika - Universitas Indonesia 2018

    CERTIFICATIONS
    AWS Certified Solutions Architect
    Google Cloud Professional
    """

    def test_extract_email(self):
        email = _extract_email(self.sample_cv)
        assert email == "john.doe@email.com"

    def test_extract_phone(self):
        phone = _extract_phone(self.sample_cv)
        assert "812" in phone

    def test_extract_skills(self):
        skills = _extract_skills(self.sample_cv)
        skill_names = [s.lower() for s in skills]
        assert "python" in skill_names
        assert "react" in skill_names
        assert "django" in skill_names

    def test_extract_entities_full(self):
        result = extract_entities(self.sample_cv)
        assert result["email"] == "john.doe@email.com"
        assert len(result["skills"]) > 0
        assert "python" in [s.lower() for s in result["skills"]]


class TestMatcher:
    def test_compute_similarity_identical(self):
        score = compute_similarity("python developer", "python developer")
        assert score > 0.9

    def test_compute_similarity_different(self):
        score = compute_similarity("python developer", "cooking recipes for beginners")
        assert score < 0.3

    def test_compute_similarity_empty(self):
        assert compute_similarity("", "test") == 0.0
        assert compute_similarity("test", "") == 0.0

    def test_skill_match_full(self):
        result = compute_skill_match(
            ["Python", "JavaScript", "React"],
            ["Python", "React"],
        )
        assert result["score"] == 100.0
        assert len(result["missing"]) == 0

    def test_skill_match_partial(self):
        result = compute_skill_match(
            ["Python"],
            ["Python", "React", "Docker"],
        )
        assert result["score"] < 100.0
        assert len(result["missing"]) > 0

    def test_skill_match_no_requirements(self):
        result = compute_skill_match(["Python"], [])
        assert result["score"] == 100.0


class TestRanker:
    def test_generate_explanation(self):
        explanation = _generate_explanation(
            skill_score=80.0,
            experience_score=60.0,
            education_score=50.0,
            certification_score=30.0,
            semantic_sim=0.4,
            skill_result={"matched": ["Python", "React"], "missing": ["Docker"]},
        )
        assert "skill" in explanation.lower() or "cocok" in explanation.lower()
        assert len(explanation) > 20
