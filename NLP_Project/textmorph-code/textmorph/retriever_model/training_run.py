from os.path import dirname, realpath, join
import random

from pyhocon import ConfigMissingException
from torch import optim
from torch.nn import Linear

from gtd.chrono import verboserate
from gtd.io import lines_in_file
from gtd.ml.torch.token_embedder import TokenEmbedder
from gtd.ml.torch.training_run import TorchTrainingRun
from gtd.ml.torch.utils import random_seed, random_state, try_gpu, similar_size_batches
from gtd.ml.training_run import TrainingRuns
from gtd.ml.training_run_viewer import TrainingRunViewer, Commit, JSONSelector, NumSteps, run_name
from gtd.ml.vocab import SimpleEmbeddings
from gtd.utils import sample_if_large
from textmorph import data
from textmorph.retriever_model.evaluation import Evaluation
from textmorph.retriever_model.retriever import Seq2SeqScorer, UniformNegativeSampler, \
    Seq2SeqExample, BOWSequenceEmbedder


class RetrieverTrainingRun(TorchTrainingRun):
    def __init__(self, config, save_dir):
        super(RetrieverTrainingRun, self).__init__(config, save_dir)

        # load data
        try:
            dataset_limit = config.dataset.limit
        except ConfigMissingException:
            dataset_limit = float('inf')
        data_dir = join(data.workspace.root, config.dataset.path)
        examples = RetrieverDataSplits(data_dir, dataset_limit)
        self.examples = examples

        # build network
        with random_seed(config.optim.seed):
            model, optimizer = self._build_model(config, examples.train)

        # reload state, if any
        self._train_state = self.checkpoints.load_latest(model, optimizer)

    @property
    def train_state(self):
        return self._train_state

    def set_train_state(self, checkpoint_num):
        """Set self.train_state to the parameters saved at the specified checkpoint."""
        old_state = self.train_state
        self._train_state = self.checkpoints.load(checkpoint_num, old_state.model, old_state.optimizer)

    @property
    def scorer(self):
        """Return Seq2SeqScorer."""
        return self.train_state.model

    @staticmethod
    def _build_model(config, training_examples):
        # build scorer
        model_config = config.retriever
        embeds_path = join(data.workspace.word_vectors, 'glove.6B.{}d.txt'.format(model_config.word_dim))
        word_embeds = SimpleEmbeddings.from_file(embeds_path, model_config.word_dim, model_config.vocab_size)
        word_embeds = word_embeds.with_special_tokens()

        def seq_embedder(trainable):
            sent_dim = model_config.sent_dim
            token_embedder = TokenEmbedder(word_embeds, trainable)
            if trainable:
                transform = Linear(token_embedder.embed_dim, sent_dim)  # if trainable, also add a linear transform
            else:
                transform = lambda x: x
            return BOWSequenceEmbedder(token_embedder, embed_dim=sent_dim,
                                       pool=model_config.pool_method, transform=transform)

        neg_sampler = UniformNegativeSampler(training_examples)
        input_embedder = seq_embedder(trainable=model_config.train_input)
        output_embedder = seq_embedder(trainable=model_config.train_output)
        scorer = Seq2SeqScorer(input_embedder, output_embedder, neg_sampler,
                               score_method=model_config.score_method, loss_method=model_config.loss_method)
        scorer = try_gpu(scorer)

        # build optimizer
        optimizer = optim.Adam(scorer.parameters(), lr=config.optim.learning_rate)
        return scorer, optimizer

    def train(self):
        config = self.config
        train_state = self.train_state
        model, optimizer = train_state.model, train_state.optimizer

        # group into training batches
        train_batches = similar_size_batches(self.examples.train, batch_size=config.optim.batch_size,
                                             size=lambda x: len(x.output_words))

        def batch_generator():
            while True:
                # WARNING: random state of train state does not exactly restore state anymore, due to this shuffle
                random.shuffle(train_batches)
                for batch in verboserate(train_batches, desc='Streaming example batches'):
                    yield batch

        with random_state(train_state.random_state):
            for batch in batch_generator():
                # take gradient step
                loss = model.loss(batch, config.optim.num_negatives)
                finite_grads = self._take_grad_step(train_state, loss)  # TODO: clip gradient?
                train_steps = train_state.train_steps

                if not finite_grads:
                    print 'WARNING: grads not finite at step {}'.format(train_steps)

                self._update_metadata(train_state)

                # run periodic evaluation and saving
                if train_steps % config.eval.eval_steps == 0:
                    self._evaluate(self.examples, big_eval=False)

                if train_steps % config.eval.big_eval_steps == 0:
                    self._evaluate(self.examples, big_eval=True)

                if train_steps % config.eval.save_steps == 0:
                    self.checkpoints.save(train_state)

                if train_steps >= config.optim.max_iters:
                    return

    def _evaluate(self, data_splits, big_eval):
        """Evaluate.
        
        Args:
            data_splits (RetrieverDataSplits)
            big_eval (bool)
        """
        config = self.config.eval
        num_samples = config.big_num_examples if big_eval else config.num_examples

        format_name = lambda name: '{}_{}'.format('big' if big_eval else 'small', name)

        with random_seed(0):
            train_sample = sample_if_large(data_splits.train, num_samples)
            self._evaluate_split(train_sample, format_name('train'))

            valid_sample = sample_if_large(data_splits.valid, num_samples)
            self._evaluate_split(valid_sample, format_name('valid'))

    def _evaluate_split(self, examples, split_name):
        """Evaluate on split.
        
        Args:
            examples (list[Seq2SeqExample])
            split_name (str)
        """
        num_negatives_loss = self.config.optim.num_negatives
        num_negatives_ranking = self.config.eval.num_negatives

        train_state = self.train_state
        train_steps = train_state.train_steps
        model, _ = train_state.model, train_state.optimizer

        eval = Evaluation(examples, model, model.negative_sampler,
                          num_negatives_loss, num_negatives_ranking, verbose=True)

        # log values to TensorBoard and metadata
        # TODO: log best value
        for stat, val in eval.stats.items():
            name = '{}_{}'.format(stat, split_name)
            self.tb_logger.log_value(name, val, step=train_steps)
            self.metadata[name] = val


class RetrieverDataSplits(object):
    def __init__(self, data_dir, limit):
        self.valid = self._examples_from_file(data_dir, 'valid.txt', limit)
        self.test = self._examples_from_file(data_dir, 'test.txt', limit)
        self.train = self._examples_from_file(data_dir, 'train.txt', limit)

    @staticmethod
    def _examples_from_file(data_dir, filename, limit):
        file_path = join(data_dir, filename)
        desc = 'Loading examples from: {}'.format(file_path)
        with lines_in_file(file_path, limit=limit, desc=desc) as lines:
            examples = []
            for line in lines:
                src, trg = line.lower().split('\t')
                src, trg = src.strip(), trg.strip()
                if len(src) == 0 or len(trg) == 0:  # filter empty sequences
                    continue
                example = Seq2SeqExample(src.split(), trg.split())
                examples.append(example)
        return examples


class RetrieverTrainingRuns(TrainingRuns):
    def __init__(self, check_commit):
        data_dir = data.workspace.retriever_runs
        src_dir = dirname(dirname(dirname(realpath(__file__))))  # root of the Git repo
        run_factory = RetrieverTrainingRun
        super(RetrieverTrainingRuns, self).__init__(data_dir, src_dir, run_factory, check_commit)


class RetrieverTrainingRunViewer(TrainingRunViewer):
    def __init__(self):
        runs = RetrieverTrainingRuns(check_commit=False)
        super(RetrieverTrainingRunViewer, self).__init__(runs)

        metadata = lambda keys: JSONSelector('metadata.txt', keys)

        self.add('name', run_name)
        self.add('commit', Commit(), lambda s: s[:8])
        self.add('dataset', metadata(['config', 'dataset', 'path']))
        self.add('steps', NumSteps())
        self.add('host', metadata(['host']), lambda s: s[:10])
        self.add('last seen', metadata(['last_seen']))

        two_decimal = lambda f: '{:.2f}'.format(f)
        self.add('valid loss (small)', metadata(['loss_small_valid']), two_decimal)
        self.add('train loss (small)', metadata(['loss_small_train']), two_decimal)
        self.add('valid rank (small)', metadata(['mean_rank_small_valid']), two_decimal)