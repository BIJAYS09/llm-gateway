import pytest
import numpy as np

from app.cache.semantic import cosine_similarity


class TestCosineSimilarity:
    def test_identical_vectors_return_one(self):
        vec = [1.0, 0.0, 0.0]
        assert cosine_similarity(vec, vec) == pytest.approx(1.0, abs=1e-6)

    def test_orthogonal_vectors_return_zero(self):
        a = [1.0, 0.0]
        b = [0.0, 1.0]
        assert cosine_similarity(a, b) == pytest.approx(0.0, abs=1e-6)

    def test_opposite_vectors_return_minus_one(self):
        a = [1.0, 0.0]
        b = [-1.0, 0.0]
        assert cosine_similarity(a, b) == pytest.approx(-1.0, abs=1e-6)

    def test_zero_vector_returns_zero(self):
        a = [0.0, 0.0]
        b = [1.0, 0.0]
        assert cosine_similarity(a, b) == 0.0

    def test_similarity_is_symmetric(self):
        a = [1.0, 2.0, 3.0]
        b = [4.0, 5.0, 6.0]
        assert cosine_similarity(a, b) == pytest.approx(cosine_similarity(b, a))

    def test_similar_vectors_above_threshold(self):
        base = [1.0, 1.0, 1.0, 1.0]
        slightly_different = [1.01, 0.99, 1.0, 1.0]
        score = cosine_similarity(base, slightly_different)
        assert score > 0.99

    def test_high_dimensional_vector(self):
        rng = np.random.default_rng(42)
        a = rng.standard_normal(1536).tolist()  # text-embedding-3-small dimension
        b = rng.standard_normal(1536).tolist()
        score = cosine_similarity(a, b)
        assert -1.0 <= score <= 1.0
