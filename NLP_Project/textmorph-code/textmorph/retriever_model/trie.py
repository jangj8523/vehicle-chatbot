from abc import abstractmethod, ABCMeta
import marisa_trie


class Trie(object):
    __metaclass__ = ABCMeta

    @abstractmethod
    def possible_next_tokens(self, prefix):
        """Given a prefix, return a list of options for the next token.
        
        Args:
            prefix (list[unicode])

        Returns:
            options (list[unicode])
        """
        pass


class MARISATrie(Trie):
    """NOTE: this Trie converts everything to lower case!"""

    def __init__(self, sentences, stop_token):
        """Construct Trie.
        
        Args:
            sentences (list[unicode]): a list of sentences, where each sentence is a string. Tokens in the sentence
                should be space delimited.
            stop_token (unicode)
        """
        sentences_formatted = [u'{} {}'.format(s.strip().lower(), stop_token) for s in sentences]
        self._trie = marisa_trie.Trie(sentences_formatted)
        self._stop_token = stop_token

    @staticmethod
    def _prefix_str(prefix):
        prefix_lower = [w.lower() for w in prefix]  # lower case to get more matches
        s = u' '.join(prefix_lower)
        s = s + u' '  # add an extra space, to exclude continuations of the last word
        return s

    def matches(self, prefix):
        """Get all sentences matching a prefix.
        
        stop token should not be in prefix.
        
        Args:
            prefix (list[unicode])

        Returns:
            matches (list[list[unicode]])
        """
        if not isinstance(prefix, list):
            raise TypeError(prefix)

        if self._stop_token in prefix:
            raise ValueError(prefix)

        results = self._trie.keys(self._prefix_str(prefix))
        return [r.split() for r in results]

    def possible_next_tokens(self, prefix):
        matches = self.matches(prefix)

        next_tokens = set()
        for sentence in matches:
            token = sentence[len(prefix)]
            next_tokens.add(token)

        return sorted(next_tokens)