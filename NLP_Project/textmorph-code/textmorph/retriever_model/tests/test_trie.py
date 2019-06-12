import pytest

from textmorph.retriever_model.trie import MARISATrie


class TestMARISATrie(object):
    STOP = '<stop>'

    @pytest.fixture
    def trie(self):
        sentences = [
            'Well I heard there was a secret chord',
            'Well it goes like this : the fourth , the fifth',
            'The minor fall and the major lift',
            'She tied you to her kitchen chair',
            'She broke your throne and she cut your hair',
        ]
        return MARISATrie(sentences, self.STOP)

    def test_matches(self, trie):
        with pytest.raises(TypeError):
            trie.matches('Well I heard')  # should complain about string

        with pytest.raises(ValueError):
            prefix = ['well', 'i', 'heard', 'there', 'was', 'a', 'secret', 'chord', self.STOP]
            trie.matches(prefix)  # should complain about stop token

        # should ignore case and retrieve the only match
        assert trie.matches('Well I heard'.split()) == [['well', 'i', 'heard', 'there', 'was', 'a', 'secret', 'chord', self.STOP]]

        # should retrieve both matches
        assert trie.matches(['well']) == [
            ['well', 'i', 'heard', 'there', 'was', 'a', 'secret', 'chord', self.STOP],
            ['well', 'it', 'goes', 'like', 'this', ':', 'the', 'fourth', ',', 'the', 'fifth', self.STOP],
        ]

        # should retrieve a match, but with stop
        assert trie.matches(['well', 'i', 'heard', 'there', 'was', 'a', 'secret', 'chord']) == [['well', 'i', 'heard', 'there', 'was', 'a', 'secret', 'chord', self.STOP]]

    def test_possible_next_tokens(self, trie):
        assert trie.possible_next_tokens(['well']) == ['i', 'it']
        assert trie.possible_next_tokens(['the']) == ['minor']
        assert trie.possible_next_tokens(['the', 'minor']) == ['fall']
        assert trie.possible_next_tokens(['the', 'major']) == []
        assert trie.possible_next_tokens(['She']) == ['broke', 'tied']
        assert trie.possible_next_tokens(['the', 'minor', 'fall', 'and', 'the', 'major', 'lift']) == [self.STOP]  # final token
