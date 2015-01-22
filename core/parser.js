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
            var _words = text.replace(/\n/g, '  ').replace(/[^0-9a-z\u0400-\u04FF\s\-'`]/gi, '').replace(/ё/g, 'е').replace(/Ё/g, 'Е').toLowerCase().replace(/\s{2,}/g, ' ').split(/ /);
            var _check = {},
                words = [],
                desc = [];
            for (var i = 0; i < _words.length; i++)
                if (!_check[_words[i]] && _words[i].length > 2) {
                    _check[_words[i]] = 1;
                    words.push(_words[i]);
                }
            if (_desc.length > 50) {
                desc = _desc.slice(0, 49);
                desc.push('...');
            } else {
                desc = _desc;
            }
            var _desc_str = _desc.join(' ');
            return {
                words: words.join(' '),
                desc: _desc_str.substring(0, _desc_str.indexOf('!{root.'))
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
                if (!words[i].match(/[0-9]/)) words[i] = stemmer.getCurrent();
            }
            return words;
        }
    };

    return parser;

};
