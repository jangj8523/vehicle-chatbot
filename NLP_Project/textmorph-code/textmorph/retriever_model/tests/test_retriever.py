import numpy as np
import pytest
import torch

from gtd.ml.torch.utils import GPUVariable, assert_tensor_equal
from textmorph.retriever_model.retriever import Seq2SeqScorer, RankingExample


class TestSeq2SeqScorer(object):
    def test_bpr_loss(self):
        scores = GPUVariable(torch.FloatTensor([
            4.5, 3, 0, 1.6,
            0, 5, 11, 2,
            9, 1, 2, 4,
        ]))
        group_size = 4

        loss = Seq2SeqScorer._bpr_loss(scores, group_size)

        correct_margins = np.array([
            1.5, 4.5, 2.9,
            -5, -11, -2,
            8, 7, 5
        ])

        correct_losses = np.log(1 + np.exp(-correct_margins))
        correct_loss = np.mean(correct_losses)

        assert_tensor_equal(loss, correct_loss)

    def test_partition_scores(self):
        ranking_examples = [
            RankingExample('x', ['a', 'b', 'c']),
            RankingExample('y', ['c']),
            RankingExample('y', []),
        ]

        scores = [1, 3, 2, 2]

        assert Seq2SeqScorer._partition_scores(ranking_examples, scores) == [[1, 3, 2], [2], []]

        with pytest.raises(ValueError):
            Seq2SeqScorer._partition_scores(ranking_examples, scores + [3])