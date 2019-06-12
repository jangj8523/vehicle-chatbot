import codecs
import os
from abc import ABCMeta, abstractmethod
from collections import defaultdict
from itertools import izip

import operator
import torch
import numpy as np
from annoy import AnnoyIndex
from os.path import join, dirname, realpath

from gtd.chrono import verboserate, timer
from gtd.io import split_path, num_lines, makedirs, lines_in_file
from gtd.utils import chunks, memoize
from textmorph import data
from textmorph.retriever_model.training_run import RetrieverTrainingRuns


class NearestSentences(object):
    __metaclass__ = ABCMeta

    @abstractmethod
    def from_sentences(self, sentences, k):
        """Retrieve nearest neighbors for a batch of sentences.

        Args:
            sentences (list[list[unicode]]): a batch of sentences
            k (int): number of neighbors to return for each sentence

        Returns:
            neighbors_batch (list[list[(list[unicode], float)]]):
                neighbors_batch[i] is a list of (sentence, score) pairs for neighbors of sentences[i]
        """
        raise NotImplementedError


class FastNearestSentencesFactory(object):
    DEFAULT = None

    @classmethod
    def default(cls):
        if cls.DEFAULT is None:
            cls.DEFAULT = FastNearestSentencesFactory()
        return cls.DEFAULT

    @staticmethod
    def _compute_save_path(training_run_id, checkpoint_id, sentences_path, sentences_limit, n_trees):
        if '>' in sentences_path:
            raise ValueError("File name cannot contain '>' since it is used as a special character.")
        formatted_sentences_path = '>'.join(split_path(sentences_path))
        save_key = '{sents}[:{limit}]_run={run}.{ckpt}_ntrees={ntrees}'.format(
            sents=formatted_sentences_path,
            limit=sentences_limit,
            run=training_run_id, ckpt=checkpoint_id,
            ntrees=n_trees,
        )
        save_path = join(data.workspace.nearest_sentences, save_key)
        return save_path

    @staticmethod
    def _load_sentences(sentences_path, sentences_limit):
        full_sentences_path = join(data.workspace.root, sentences_path)
        with lines_in_file(full_sentences_path, limit=sentences_limit, desc='Loading sentences') as lines:
            sentences = [line.strip().split() for line in lines]
        return sentences

    @staticmethod
    def _load_seq_embedder(training_run_id, checkpoint_id):
        print 'Loading SequenceEmbedder'
        runs = RetrieverTrainingRuns(check_commit=False)
        run = runs[training_run_id]

        try:
            repo_dir = dirname(dirname(dirname(realpath(__file__))))
            run.match_commit(repo_dir)
        except EnvironmentError:
            print 'WARNING: RetrieverTrainingRun commit does not match current commit!'

        run.set_train_state(checkpoint_id)
        return run.scorer.output_embedder

    @staticmethod
    def _init_index(embed_dim):
        return AnnoyIndex(embed_dim, metric='angular')

    @staticmethod
    def _shard_path(save_dir, s):
        return join(save_dir, str(s))

    @classmethod
    def _build_indices(cls, seq_embedder, sentences, n_trees, save_dir):
        makedirs(save_dir)  # make sure directory exists
        batch_size = 128  # number of sentences to embed at a time
        batches_per_index = 4096  # number of batches per index
        # 128 * 4096 = 524288 sentences per index

        batches = list(chunks(sentences, n=batch_size))
        sharded_batches = list(chunks(batches, n=batches_per_index))
        num_shards = len(sharded_batches)
        embed_dim = seq_embedder.embed_dim

        for s, batches_s in enumerate(sharded_batches):
            print 'Building shard {}/{}'.format(s + 1, num_shards)
            index = cls._init_index(embed_dim)
            i = 0
            for batch in verboserate(batches_s, desc='Embedding sentences (batch_size={})'.format(batch_size)):
                sent_embeds = seq_embedder.embed(batch)
                sent_embeds = sent_embeds.data.cpu().numpy()  # (batch_size, embed_dim)
                for sent_embed in sent_embeds:
                    # sent_embed has shape (embed_dim,)
                    index.add_item(i, sent_embed)
                    i += 1

            with timer('Constructing trees'):
                index.build(n_trees)

            with timer('Saving shard to disk'):
                index.save(cls._shard_path(save_dir, s))

    @classmethod
    def _load_indices(cls, save_dir, embed_dim):
        # compute total number of indices
        nums = []
        for name in os.listdir(save_dir):
            try:
                n = int(name)
                nums.append(n)
            except ValueError:
                pass
        num_indices = max(nums) + 1  # assume that indices start with 0

        indices = []
        for s in range(num_indices):
            index = cls._init_index(embed_dim)
            index.load(cls._shard_path(save_dir, s))
            indices.append(index)

        return indices

    @memoize  # don't rebuild if it was already built
    def build(self, training_run_id, checkpoint_id, sentences_path, sentences_limit, n_trees):
        """Load FastNearestSentences object from disk.

        Build FastNearestSentences object. If the object was previously saved to disk, it is loaded from there.

        Args:
            training_run_id (int): RetrieverTrainingRun identifier
            checkpoint_id (int): checkpoint identifier (train steps)
            sentences_path (str): path to a file full of sentences, relative to data.workspace.root
            sentences_limit (int): max number of sentences to read in
            n_trees (int): number of trees used in LSH index

        Returns:
            FastNearestSentences
        """
        save_path = self._compute_save_path(training_run_id, checkpoint_id, sentences_path, sentences_limit, n_trees)

        try:
            seq_embedder = self._load_seq_embedder(training_run_id, checkpoint_id)
        except:
            print 'FAILED TO LOAD seq_embedder'
            seq_embedder = None
        sentences = self._load_sentences(sentences_path, sentences_limit)

        # build indices if they don't exist
        indices_dir = join(save_path, 'indices')
        if not os.path.exists(indices_dir):
            print 'Building indices from scratch'
            self._build_indices(seq_embedder, sentences, n_trees, indices_dir)

        # load indices
        indices = self._load_indices(indices_dir, seq_embedder.embed_dim)

        return FastNearestSentences(seq_embedder, sentences, indices, n_trees)


class FastNearestSentences(NearestSentences):
    def __init__(self, seq_embedder, sentences, indices, n_trees):
        """Construct a FastNearestSentences object.
        
        Args:
            seq_embedder (SequenceEmbedder)
            sentences (list[list[unicode]])
            indices (list[AnnoyIndex])
            n_trees (int)
        """
        assert len(sentences) == sum(index.get_n_items() for index in indices)
        self.seq_embedder = seq_embedder
        self.sentences = sentences
        self.indices = indices
        self.n_trees = n_trees

    def from_vector(self, v, k, search_factor=1.0):
        if not isinstance(v, np.ndarray):
            raise TypeError('v must be a numpy array.')
        if len(v.shape) != 1:
            raise ValueError('v must be 1D.')

        search_k = int(self.n_trees * k * search_factor)

        # run the same query on all indices
        all_results = []
        offset = 0
        for index in self.indices:
            items, distances = index.get_nns_by_vector(v, k, search_k=search_k, include_distances=True)
            results = [(i + offset, d) for i, d in izip(items, distances)]
            all_results.extend(results)
            offset += index.get_n_items()

        best_results = sorted(all_results, key=operator.itemgetter(1))[:k]
        return [(self.sentences[i], d) for i, d in best_results]

    def from_sentences(self, sentences, k, search_factor=1.0, query_embedder=None):
        """Retrieve nearest neighbors for a batch of sentences.
        
        Args:
            sentences (list[list[unicode]]): a batch of sentences
            k (int): number of neighbors to return for each sentence
            search_factor (float)
            query_embedder (SequenceEmbedder): if None, the SequenceEmbedder used to construct the index is used.

        Returns:
            neighbors_batch (list[list[(list[unicode], float)]]):
                neighbors_batch[i] is a list of (sentence, score) pairs for neighbors of sentences[i]
        """
        for sent in sentences:
            if not isinstance(sent, list):
                raise TypeError('Each sentence should be a list of strings.')

        if query_embedder is None:
            query_embedder = self.seq_embedder

        # embed sentences
        sent_embeds = query_embedder.embed(sentences)
        sent_embeds = sent_embeds.data.cpu().numpy()  # (batch_size, embed_dim)
        neighbors_batch = []
        for sent_embed in sent_embeds:
            neighbors = self.from_vector(sent_embed, k, search_factor)
            neighbors_batch.append(neighbors)
        return neighbors_batch

    def __len__(self):
        return len(self.sentences)

    def print_neighbors(self, query, k, search_factor=1.0, query_embedder=None):
        """Convenience method which prints out neighbors of a query."""
        results = self.from_sentences([query], k, search_factor, query_embedder)[0]
        for sent, score in results:
            print u'{:.2f}: {}'.format(score, u' '.join(sent))


# TODO: test this
class BruteForceNearestSentences(NearestSentences):
    """This is mostly just here to benchmark FastNearestSentences."""

    def __init__(self, sentences, seq_embedder):
        self.sentences = sentences
        self.seq_embedder = seq_embedder

    @staticmethod
    def normalize(x):
        """Normalize a batch of vectors.

        Args:
            x (Variable): of shape (batch_size, embed_dim)

        Returns:
            x_normed (Variable): of shape (batch_size, embed_dim)
        """
        norms = torch.norm(x, p=2)  # (batch_size, 1)
        norms = norms.expand_as(x)  # (batch_size, embed_dim)
        return x / norms

    def from_sentences(self, query_sentences, k):
        query_embeds = self.seq_embedder.embed(query_sentences)  # (num_queries, embed_dim)
        query_embeds_normed = self.normalize(query_embeds)

        neighbors_dict = defaultdict(list)

        batch_size = 128
        target_batches = list(chunks(self.sentences, n=batch_size))
        for target_batch in verboserate(target_batches, desc='Embedding target sentences (batched)'):
            target_embeds = self.seq_embedder.embed(target_batch)  # (batch_size, embed_dim)
            target_embeds_normed = self.normalize(target_embeds)

            # NOTE: we are actually computing sqrt(2 - 2 * cos(theta)), not theta

            # <a, b> = ||a|| ||b|| cos(theta) = cos(theta)
            cos_thetas_batch = torch.mm(query_embeds_normed, target_embeds_normed.transpose(0, 1))  # (num_queries, batch_size)
            scores_batch = torch.sqrt(2 - 2 * cos_thetas_batch)

            scores_batch = scores_batch.data.cpu().numpy()

            for i, query in enumerate(query_sentences):
                for j, target in enumerate(target_batch):
                    score = scores_batch[i, j]
                    neighbors_dict[tuple(query)].append((target, score))

        neighbors_batch = []
        for query in query_sentences:
            neighbors = neighbors_dict[tuple(query)]
            neighbors = sorted(neighbors, key=lambda pair: pair[1], reverse=True)
            neighbors = neighbors[:k]
            neighbors_batch.append(neighbors)

        return neighbors_batch
