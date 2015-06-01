// The MIT License (MIT)

// Copyright (c) 2014 Tatiana Nikolaeva

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

function evalPassword(password) {
    var pwd = password.replace(/(^\s+|\s+$)/g, '');
    // invalid or shorter than 8 symbols
    if (typeof pwd == 'undefined' || pwd === null || !pwd || pwd.length < 8) return 0;
    ////////////////// 4 types of symbolds //////////////////////////
    // at least one digit, one lowercase, one uppercase letter, one special character from the list: ^\/*+.,:;@&=#$%_-!?<>''`´""()[]{}
    var reg = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\^\\\/*+.,:;@&=#$%_\-!?<>''`´""()\[\]{}])/;
    if (reg.test(pwd)) return 4;
    ////////////////// 3 types of symbolds //////////////////////////
    // one digit, one uppercase, one lowercase
    reg = /(?=.*\d)(?=.*[A-Z])(?=.*[a-z])/;
    if (reg.test(pwd)) return 3;
    //  one digit, one lowercase, one special character from the list: ^\/*+.,:;@&=#$%_-!?<>''`´""()[]{}
    reg = /(?=.*\d)(?=.*[a-z])(?=.*[\^\\\/*+.,:;@&=#$%_\-!?<>''`´""()\[\]{}])/;
    if (reg.test(pwd)) return 3;
    //  one digit, one uppercase, one special character from the list: ^\/*+.,:;@&=#$%_-!?<>''`´""()[]{}
    reg = /(?=.*\d)(?=.*[A-Z])(?=.*[\^\\\/*+.,:;@&=#$%_\-!?<>''`´""()\[\]{}])/;
    if (reg.test(pwd)) return 3;
    //  one lowercase, one uppercase, one special character from the list: ^\/*+.,:;@&=#$%_-!?<>''`´""()[]{}
    reg = /(?=.*[a-z])(?=.*[A-Z])(?=.*[\^\\\/*+.,:;@&=#$%_\-!?<>''`´""()\[\]{}])/;
    if (reg.test(pwd)) return 3;
    ////////////////// 2 types of symbolds //////////////////////////
    //  at least one uppercase and one lowercase
    reg = /(?=.*[a-z])(?=.*[A-Z])/;
    if (reg.test(pwd)) return 2;
    //  at least one lowercase and one digit
    reg = /(?=.*[a-z])(?=.*\d)/;
    if (reg.test(pwd)) return 2;
    //  at least one uppercase and one digit
    reg = /(?=.*[A-Z])(?=.*\d)/;
    if (reg.test(pwd)) return 2;
    //  one lowercase and one special character from the list: ^\/*+.,:;@&=#$%_-!?<>''`´""()[]{}
    reg = /(?=.*[a-z])(?=.*[\^\\\/*+.,:;@&=#$%_\-!?<>''""()\[\]{}])/;
    if (reg.test(pwd)) return 2;
    // one uppercase and one special character from the list: ^\/*+.,:;@&=#$%_-!?<>''`´""()[]{}
    reg = /(?=.*[A-Z])(?=.*[\^\\\/*+.,:;@&=#$%_\-!?<>''""()\[\]{}])/;
    if (reg.test(pwd)) return 2;
    //  one digit and one special character from the list: ^\/*+.,:;@&=#$%_-!?<>''`´""()[]{}
    reg = /(?=.*\d)(?=.*[\^\\\/*+.,:;@&=#$%_\-!?<>''`´""()\[\]{}])/;
    if (reg.test(pwd)) return 2;
    ////////////////// 1 type of symbolds //////////////////////////
    // one lowercase  or one uppercase letter or one digit or one special character or Unicode (Latin Extended-A + B + Latin1-Supplement; Cyrillic + Supplement);
    reg = /(?=.*[a-zA-Z0-9\^\\\/*+.,:;@&=#$%_\-!?<>''`´""()\[\]{}\u0400-\u052f \u00a1-\u024f])/;
    if (reg.test(pwd)) {
        return 1;
    } else {
        return 0;
    }
}