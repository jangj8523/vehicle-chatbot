"""Generate an autocomplete dataset from a corpus of sentences.

Example:
    python generate_autocomplete_dataset.py --limit 10000 ~/squad_entailment_data/yelp_dataset_static ~/squad_entailment_data/yelp_dataset_autocomplete_small
"""
import codecs
import random

import numpy as np
import click
from os.path import join

from gtd.chrono import verboserate
from gtd.io import makedirs, num_lines
from textmorph.retriever_model.retriever import Seq2SeqExample


def load_sentences(path, limit):
    """Load sentences.
    
    Args:
        path (str)
        limit (int)

    Returns:
        list[list[unicode]]: a list of sentences (each a sequence of words)
    """
    with codecs.open(path, 'r', encoding='utf-8') as f:
        sentences = []
        total_lines = min(num_lines(path), limit)
        lines = verboserate(f, desc='Loading sentences', total=total_lines)
        for i, line in enumerate(lines):
            if i == limit:
                break
            sentences.append(line.lower().strip().split())
    return sentences


def sample_autocomplete_query(sentence):
    """Generate a random autocomplete query for which sentence is a valid completion.
    
    Queries are NOT necessarily a prefix.
    
    Query words are sorted in the same order that they appear in the target.
    For models that don't want to know the order, we leave it to them to scramble the order.
    
    Args:
        sentence (list[unicode])

    Returns:
        query (list[unicode])
    """
    n = len(sentence)
    query_size = random.randint(0, n)
    indices = sorted(np.random.choice(n, query_size, replace=False))
    query = [sentence[i] for i in indices]
    return query


def sentences_to_examples(sentences):
    """Convert sentences into Seq2SeqExamples.
    
    Args:
        sentences (list[list[unicode]])
    
    Returns:
        list[Seq2SeqExample]
    """
    examples = []
    for sent in verboserate(sentences, desc='Converting sentences to examples'):
        query = sample_autocomplete_query(sent)
        ex = Seq2SeqExample(query, sent)
        examples.append(ex)
    return examples


def generate_examples(sentences_path, out_path, limit):
    """Read sentences from a file and write examples to a file."""
    sentences = load_sentences(sentences_path, limit)
    examples = sentences_to_examples(sentences)
    with codecs.open(out_path, 'w', encoding='utf-8') as f:
        for ex in verboserate(examples, desc='Writing examples'):
            format_seq = lambda seq: u' '.join(seq)
            f.write(u'{}\t{}\n'.format(format_seq(ex.input_words), format_seq(ex.output_words)))


@click.command()
@click.argument('in_dir')
@click.argument('out_dir')
@click.option('--limit', default=float('inf'))
def run(in_dir, out_dir, limit):
    """Entrypoint."""
    makedirs(out_dir)
    for split in ['valid', 'test', 'train']:
        print '=== Processing {} ==='.format(split)
        filename = '{}.txt'.format(split)
        sentences_path = join(in_dir, filename)
        out_path = join(out_dir, filename)
        generate_examples(sentences_path, out_path, limit=limit)


if __name__ == '__main__':
    run()