import numpy as np

from gtd.ml.torch.utils import random_seed
from gtd.utils import UnicodeMixin, ranks
from textmorph.retriever_model.retriever import RankingExample


class Evaluation(object):
    def __init__(self, examples, scorer, negative_sampler, num_negatives_loss, num_negatives_ranking, verbose=True):
        """Create evaluation.
        
        Args:
            examples (list[Seq2SeqExample])
            scorer (Seq2SeqScorer)
            negative_sampler (NegativeSampler)
            num_negatives_loss: number of negatives used to compute the training loss
            num_negatives_ranking: number negatives used to compute rank
            verbose (bool)
        """
        # compute stats
        with random_seed(0):
            # compute loss
            loss = scorer.loss(examples, num_negatives_loss)
            loss = loss.data[0]  # convert Variable into Python float

            # compute mean rank
            # generate RankingExamples for each example
            rank_examples = []
            for ex in examples:
                output_options = [ex.output_words]  # first option is the correct one
                output_options.extend(negative_sampler.sample(ex, num_negatives_ranking))  # the rest are negative
                rank_example = RankingExample(ex.input_words, output_options)
                rank_examples.append(rank_example)

            scores = scorer.score_rank_examples(rank_examples)

            # compute ranks
            pos_ranks = []
            for i, score_group in enumerate(scores):
                pos_ranks.append(ranks(score_group, ascending=False)[0])
                if verbose and i < 5:
                    print RankTrace(rank_examples[i], score_group)
            mean_rank = np.mean(pos_ranks)

            self._stats = {'loss': loss, 'mean_rank': mean_rank}

    @property
    def stats(self):
        """Return a dict[str, float]."""
        return self._stats


class RankTrace(UnicodeMixin):
    def __init__(self, rank_example, scores):
        self.rank_example = rank_example
        self.scores = scores

    def __unicode__(self):
        ex = self.rank_example
        option_strs = [u' '.join(option) for option in ex.output_options]
        option_score_pairs = zip(option_strs, self.scores)
        option_score_pairs = sorted(option_score_pairs, key=lambda x: x[1], reverse=True)
        rank_str = u'\n'.join(u'{:.2f}: {}'.format(score, option) for option, score in option_score_pairs)
        return u'{}\n{}'.format(ex, rank_str)
