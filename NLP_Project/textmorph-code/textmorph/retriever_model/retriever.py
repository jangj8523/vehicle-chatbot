from abc import ABCMeta, abstractmethod, abstractproperty
from collections import namedtuple

import numpy as np
import torch
from torch.nn import Module, LSTMCell

from gtd.ml.torch.seq_batch import SequenceBatch
from gtd.ml.torch.source_encoder import SimpleSourceEncoder
from gtd.ml.torch.utils import NamedTupleLike


class Seq2SeqExample(namedtuple('Seq2SeqExample', ['input_words', 'output_words']),
                     NamedTupleLike):
    """
    Attributes:
        input_words (list[unicode])
        output_words (list[unicode])
    """
    def __unicode__(self):
        return u'INPUT: {}\nOUTPUT: {}'.format(' '.join(self.input_words), ' '.join(self.output_words))

    def __repr__(self):
        return unicode(self).encode('utf-8')


class RankingExample(namedtuple('RankingExample', ['input_words', 'output_options']),
                     NamedTupleLike):
    """
    Attributes:
        input_words (list[unicode])
        output_options (list[list[unicode]]): a list of sequences, where each one is a candidate output.
    """
    @property
    def num_options(self):
        return len(self.output_options)

    def __unicode__(self):
        option_strs = [u'\t' + u' '.join(option) for option in self.output_options]
        options_str = u'\n'.join(option_strs)
        return u'INPUT: {}\nOPTIONS:\n{}'.format(' '.join(self.input_words), options_str)

    def __repr__(self):
        return unicode(self).encode('utf-8')


class NegativeSampler(object):
    __metaclass__ = ABCMeta

    @abstractmethod
    def sample(self, example, k):
        """Sample negative outputs.
        
        Negative outputs should not include example.output_words.
        
        Args:
            example (Seq2SeqExample)
            k (int): number of negatives to sample

        Returns:
            negative_outputs (list[list[unicode]]): k negative samples
        """
        pass


class UniformNegativeSampler(NegativeSampler):
    def __init__(self, training_examples):
        """Construct uniform negative sampler.
        
        Args:
            training_examples (list[Seq2SeqExample])
        """
        self.training_examples = training_examples

    @staticmethod
    def _draw_samples(examples, k):
        """Draw output sequences uniformly at random from the examples (with replacement)."""
        idx = np.random.choice(len(examples), size=k, replace=True)
        output_sequences = [examples[i].output_words for i in idx]
        return output_sequences

    def sample(self, example, k):
        attempts = 0
        while True:
            samples = self._draw_samples(self.training_examples, k)
            if example.output_words not in samples:
                break
            else:
                attempts += 1

            if attempts > 5000:
                raise ValueError("Could not draw samples without including the target.")
        return samples


# TODO: break batches into smaller groups to avoid memory issues?

class SequenceEmbedder(Module):
    __metaclass__ = ABCMeta

    @abstractmethod
    def embed(self, sequences):
        """Embed batch of sequences.
        
        Args:
            sequences (list[list[unicode]])

        Returns:
            Variable: of shape (batch_size, embed_dim) 
        """
        pass

    @abstractproperty
    def embed_dim(self):
        pass


class BOWSequenceEmbedder(SequenceEmbedder):
    def __init__(self, token_embedder, embed_dim, pool, transform):
        """BOWSequenceEmbedder.
        
        Args:
            token_embedder (TokenEmbedder)
            embed_dim (int)
            pool (str): can be 'max', 'mean', or 'sum'
            transform (Callable[Variable, Variable]): converts (batch_size, word_dim) into (batch_size, embed_dim).
        """
        super(BOWSequenceEmbedder, self).__init__()
        self.token_embedder = token_embedder
        self.vocab = token_embedder.vocab
        self._embed_dim = embed_dim
        self.pool = pool
        self.transform = transform

    def embed(self, sequences):
        for seq in sequences:
            if len(seq) == 0:
                raise ValueError("Cannot embed empty sequence.")

        token_indices = SequenceBatch.from_sequences(sequences, self.vocab, min_seq_length=1)
        token_embeds = self.token_embedder.embed_seq_batch(token_indices)  # SequenceBatch of size (batch_size, max_seq_length, word_dim)
        if self.pool == 'sum':
            pooled_token_embeds = SequenceBatch.reduce_sum(token_embeds)  # (batch_size, word_dim)
        elif self.pool == 'mean':
            pooled_token_embeds = SequenceBatch.reduce_mean(token_embeds)  # (batch_size, word_dim)
        elif self.pool == 'max':
            pooled_token_embeds = SequenceBatch.reduce_max(token_embeds)  # (batch_size, word_dim)
        else:
            raise ValueError(self.pool)

        seq_embeds = self.transform(pooled_token_embeds)  # (batch_size, embed_dim)
        assert seq_embeds.size()[1] == self.embed_dim

        return seq_embeds

    @property
    def embed_dim(self):
        return self._embed_dim


class RNNSequenceEmbedder(SequenceEmbedder):
    """Just run an LSTM over the sequence and return the final hidden state."""

    def __init__(self, token_embedder, embed_dim):
        super(RNNSequenceEmbedder, self).__init__()
        self._embed_dim = embed_dim
        word_dim = token_embedder.embed_dim
        rnn_cell = LSTMCell(word_dim, embed_dim)
        self.source_encoder = SimpleSourceEncoder(rnn_cell)
        self.vocab = token_embedder.vocab
        self.token_embedder = token_embedder

    @property
    def embed_dim(self):
        return self._embed_dim

    def embed(self, sequences):
        sequence_indices = SequenceBatch.from_sequences(sequences, self.vocab, min_seq_length=1)  # (batch_size, max_seq_length)
        sequence_embeds = self.token_embedder.embed_seq_batch(sequence_indices)  # (batch_size, max_seq_length, word_dim)
        sequence_embeds_list = sequence_embeds.split()
        hidden_states_list = self.source_encoder(sequence_embeds_list)
        return hidden_states_list[-1].values  # (batch_size, embed_dim)


class Seq2SeqScorer(Module):
    __metaclass__ = ABCMeta

    def __init__(self, input_embedder, output_embedder, negative_sampler, score_method, loss_method):
        """Seq2Seq scorer.
        
        Args:
            input_embedder (SequenceEmbedder)
            output_embedder (SequenceEmbedder)
            negative_sampler (NegativeSampler)
            score_method (str): can be 'euclidean' or 'dot_product'
            loss_method (str): can be 'ranking' or 'l2'
        """
        super(Seq2SeqScorer, self).__init__()
        self.input_embedder = input_embedder
        self.output_embedder = output_embedder
        self._negative_sampler = negative_sampler
        self.score_method = score_method
        self.loss_method = loss_method

    @property
    def negative_sampler(self):
        return self._negative_sampler

    def embed_inputs(self, sequences):
        return self.input_embedder.embed(sequences)

    def embed_outputs(self, sequences):
        return self.output_embedder.embed(sequences)

    def embed_examples(self, examples):
        input_sequences = [ex.input_words for ex in examples]
        output_sequences = [ex.output_words for ex in examples]

        input_embeds = self.embed_inputs(input_sequences)
        output_embeds = self.embed_outputs(output_sequences)

        return input_embeds, output_embeds

    def score(self, examples):
        """Score Seq2SeqExamples.

        Args:
            examples (list[Seq2SeqExample])

        Returns:
            Variable: of shape (batch_size,)
        """
        input_embeds, output_embeds = self.embed_examples(examples)

        if self.score_method == 'dot_product':
            # TODO: normalize before dot product
            score = torch.sum(input_embeds * output_embeds, 1)  # (batch_size, 1)
        elif self.score_method == 'euclidean':
            diffs = input_embeds - output_embeds  # (batch_size, embed_dim)
            diff_norms_squared = torch.sum(diffs * diffs, 1)  # (batch_size, 1)
            score = -diff_norms_squared  # smaller diff means higher score
        else:
            raise ValueError(self.score_method)

        score = torch.squeeze(score, 1)  # (batch_size)
        return score

    def score_rank_examples(self, ranking_examples):
        """Score a batch of RankingExamples.
        
        Args:
            ranking_examples (list[RankingExample])

        Returns:
            scores (list[list[float]]): a batch of scores.
                scores[i][j] = score of ranking_examples[i].output_options[j]
        """
        # convert ranking examples into seq2seq examples
        seq2seq_examples = []
        for r_ex in ranking_examples:
            seq2seq_examples.extend([Seq2SeqExample(r_ex.input_words, output_words)
                                     for output_words in r_ex.output_options])

        # compute scores
        scores = self.score(seq2seq_examples)
        scores = scores.data.cpu().numpy()  # (batch_size)
        scores = list(scores)  # list

        scores_partitioned = self._partition_scores(ranking_examples, scores)
        return scores_partitioned

    @staticmethod
    def _partition_scores(ranking_examples, scores):
        """Partition scores to line up with their respective examples.
        
        Args:
            ranking_examples (list[RankingExample])
            scores (list[float]): list of length sum(ex.num_options for ex in ranking_examples)

        Returns:
            scores_partitioned (list[list[float]]): where scores_partitioned[i] are the scores corresponding
                to ranking_examples[i].output_options.
        """
        if sum(ex.num_options for ex in ranking_examples) != len(scores):
            raise ValueError('Number of scores != number of options.')

        scores_reversed = list(reversed(scores))
        scores_partitioned = []
        for r_ex in ranking_examples:
            scores_group = [scores_reversed.pop() for _ in range(r_ex.num_options)]
            scores_partitioned.append(scores_group)
        return scores_partitioned

    def loss(self, examples, num_negatives):
        if self.loss_method == 'ranking':
            return self._ranking_loss(examples, num_negatives)
        elif self.loss_method == 'l2':
            return self._l2_loss(examples)
        else:
            raise ValueError(self.loss_method)

    def _l2_loss(self, examples):
        """Compute training loss for examples
        
        Args:
            examples (list[Seq2SeqExample])

        Returns:
            Variable: a single differentiable scalar
        """
        diff_norms_squared = -self.score(examples)  # (batch_size,)
        loss = torch.mean(diff_norms_squared)  # scalar
        # TODO: robustify this loss?
        return loss

    def _ranking_loss(self, examples, num_negatives):
        """Compute training loss for examples.

        Args:
            examples (list[Seq2SeqExample])

        Returns:
            Variable: a single differentiable scalar
        """
        # sample negatives for each example
        augmented_examples = []
        for ex in examples:
            example_group = [ex]
            negative_outputs = self._negative_sampler.sample(ex, num_negatives)
            negative_examples = [Seq2SeqExample(ex.input_words, neg_output) for neg_output in negative_outputs]
            example_group.extend(negative_examples)
            augmented_examples.extend(example_group)

        group_size = 1 + num_negatives
        scores = self.score(augmented_examples)  # (batch_size * group_size)

        return self._bpr_loss(scores, group_size)

    @classmethod
    def _bpr_loss(cls, scores, group_size):
        """Compute Bayesian personalized ranking loss.
        
        margin = score(ex_pos) - score(ex_neg)
        
        bpr_loss = -log(sigmoid(margin))
                 = log(1 + exp(-margin))
        
        Args:
            scores (Variable): a 1D array of shape (batch_size * group_size).
                Elements from the same group are grouped together. The first element of each group is the positive
                example score, while the rest are all negative example scores.
            group_size (int): the size of each group

        Returns:
            Variable: a differentiable scalar. The average bpr loss over the batch.
        """
        total_size = scores.size()[0]
        assert total_size % group_size == 0
        batch_size = total_size / group_size

        num_negatives = group_size - 1
        scores_grouped = scores.view(batch_size, group_size)  # (batch_size, group_size)

        neg_scores = scores_grouped[:, 1:]  # (batch_size, num_negatives)

        pos_scores = scores_grouped[:, 0]  # (batch_size,)
        pos_scores = torch.unsqueeze(pos_scores, 1)  # (batch_size, 1)
        pos_scores = pos_scores.expand(batch_size, num_negatives)  # (batch_size, num_negatives)

        margins = pos_scores - neg_scores  # (batch_size, num_negatives)
        margins = margins.view(batch_size * num_negatives)  # (batch_size * num_negatives)

        bprs = torch.log(1 + torch.exp(-margins))
        bpr = torch.mean(bprs)
        return bpr


class Retriever(object):
    pass
