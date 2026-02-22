"""Text Preprocessing Module - Tokenization, stopwords removal, lemmatization."""

import re
import string


# Common Indonesian and English stopwords
STOPWORDS = {
    # English
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "again", "further", "then",
    "once", "and", "but", "or", "nor", "not", "so", "very", "just",
    "about", "up", "its", "it", "this", "that", "these", "those",
    # Indonesian
    "yang", "dan", "di", "ke", "dari", "untuk", "pada", "dengan", "ini",
    "itu", "adalah", "juga", "atau", "tidak", "akan", "ada", "sudah",
    "saya", "kami", "kita", "mereka", "anda", "dia", "ia", "nya",
    "dalam", "oleh", "sebagai", "serta", "antara", "setelah", "seperti",
    "karena", "tetapi", "namun", "bahwa", "telah", "dapat", "bisa",
    "lebih", "sangat", "hanya", "masih", "sedang", "menjadi", "hingga",
}


def preprocess_text(text: str) -> str:
    """Clean and preprocess text for NLP processing."""
    if not text:
        return ""

    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)

    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', '', text)

    # Keep alphanumeric, spaces, and basic punctuation
    text = re.sub(r'[^\w\s\-.,;:@+/()]', '', text)

    return text.strip()


def tokenize(text: str) -> list[str]:
    """Tokenize text into words."""
    text = preprocess_text(text)
    tokens = re.findall(r'\b\w+\b', text.lower())
    return tokens


def remove_stopwords(tokens: list[str]) -> list[str]:
    """Remove stopwords from token list."""
    return [t for t in tokens if t not in STOPWORDS and len(t) > 1]


def get_clean_tokens(text: str) -> list[str]:
    """Full preprocessing pipeline: tokenize + remove stopwords."""
    tokens = tokenize(text)
    return remove_stopwords(tokens)
