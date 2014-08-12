var htmlToText = require('html-to-text');
var natural = require('natural'), tokenizer = new natural.WordPunctTokenizer();
natural.LancasterStemmer.attach();

module.exports = function(app) {
	var parser = {
		html2text: function(html) {
			return htmlToText.fromString(html);
		},
		words: function(text, title) {
			var _desc = text.replace(/\n/g, '  ').replace(/\s{2,}/g, ' ').split(/ /);
			if (title) text += ' ' + title;
			var _words = text.replace(/\n/g, '  ').replace(/[^a-z\u0400-\u04FF\s\-'`]/gi, '').replace(/ё/g, 'е').replace(/Ё/g, 'Е').toLowerCase().replace(/\s{2,}/g, ' ').split(/ /);
			var _check = {}, words = [], desc = [];
			for (var i=0; i<_words.length; i++) if (!_check[_words[i]] && _words[i].length > 3) { _check[_words[i]] = 1; words.push(_words[i]); }
			if (_desc.length > 50) {
				desc = _desc.slice(0,49);
				desc.push('...');
			} else {
				desc = _desc;
			}
			return { words: words.join(' '), desc: desc.join(' ').replace(/ \.\.\.$/, '...') };
		},
		stem: function(word) {
			var res = word;
			if (word.match(/[\u0400-\u04FF]/gi)) {
			 	res = natural.PorterStemmerRu.stem(word);
			} else {
				res = natural.PorterStemmer.stem(word);
			}
			return res;
		},
		stem_lancaster: function(word) {
			return word.stem();
		},
		stem_lancaster_string: function(string) {
			return string.tokenizeAndStem();
		}
	};

	return parser;

};
