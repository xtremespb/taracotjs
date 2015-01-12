var htmlToText = require('html-to-text'),
    snowball = require('snowball');
module.exports = function(app) {
    var parser = {
        html2text: function(html) {
            return htmlToText.fromString(html);
        },
        words: function(text, title) {
            var _desc = text.replace(/\n/g, '  ').replace(/\s{2,}/g, ' ').split(/ /);
            if (title) text += ' ' + title;
            var _words = text.replace(/\n/g, '  ').replace(/[^a-z\u0400-\u04FF\s\-'`]/gi, '').replace(/ё/g, 'е').replace(/Ё/g, 'Е').toLowerCase().replace(/\s{2,}/g, ' ').split(/ /);
            var _check = {},
                words = [],
                desc = [];
            for (var i = 0; i < _words.length; i++)
                if (!_check[_words[i]] && _words[i].length > 3) {
                    _check[_words[i]] = 1;
                    words.push(_words[i]);
                }
            if (_desc.length > 50) {
                desc = _desc.slice(0, 49);
                desc.push('...');
            } else {
                desc = _desc;
            }
            return {
                words: words.join(' '),
                desc: desc.join(' ').replace(/ \.\.\.$/, '...')
            };
        },
        stem_all: function(words) {
            var stemmer;
            for (var i = 0; i < words.length; i++) {
                if (words[i].match(/[\u0400-\u04FF]/gi)) {
                    stemmer = new snowball('Russian');
                } else {
                    stemmer = new snowball('English');
                }
                stemmer.setCurrent(words[i]);
                stemmer.stem();
                words[i] = stemmer.getCurrent();
            }
            return words;
        }
    };

    return parser;

};
