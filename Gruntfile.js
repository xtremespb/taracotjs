module.exports = function(grunt) {
    grunt.initConfig({
        // Beautifier
        jsbeautifier: {
            files: [
                "modules/**/*.js",
                "modules/**/*.html",
                "modules/**/*.css",
                "core/**/*.js",
                "app.js",
                "config.js",
                "views/*.html"
            ],
            options: {
              html: {
                  braceStyle: "collapse",
                  indentChar: "\t",
                  indentScripts: "keep",
                  indentSize: 1,
                  maxPreserveNewlines: 10,
                  preserveNewlines: false,
                  unformatted: ["a", "sub", "sup", "b", "i", "u"],
                  wrapLineLength: 0
              },
              css: {
                  indentChar: "\t",
                  indentSize: 1
              },
              js: {
                  braceStyle: "collapse",
                  breakChainedMethods: false,
                  e4x: false,
                  evalCode: false,
                  indentChar: " ",
                  indentLevel: 0,
                  indentSize: 1,
                  indentWithTabs: true,
                  jslintHappy: false,
                  keepArrayIndentation: false,
                  keepFunctionIndentation: false,
                  maxPreserveNewlines: 10,
                  preserveNewlines: true,
                  spaceBeforeConditional: true,
                  spaceInParen: false,
                  unescapeStrings: false,
                  wrapLineLength: 0
              }
          }
        },
        // Compress
        uglify: {
            module_auth_cp: {
                files: {
                    'modules/auth/public/modules/auth/js/auth_cp.min.js': [ 'public/js/jquery.medved.loading.js', 'public/js/jquery.placeholder.js', 'modules/auth/public/modules/auth/js/auth_cp.js' ]
                }
            },
            module_auth_user: {
                files: {
                    'modules/auth/public/modules/auth/js/auth_user.min.js': [ 'modules/auth/public/modules/auth/js/auth_user.js', 'public/js/helper.js' ]
                }
            },
            module_auth_password: {
                files: {
                    'modules/auth/public/modules/auth/js/auth_password.min.js': [ 'public/js/helper.js', 'modules/auth/public/modules/auth/js/pwd.js', 'modules/auth/public/modules/auth/js/password.js' ]
                }
            },
            module_auth_register: {
                files: {
                    'modules/auth/public/modules/auth/js/auth_register.min.js': [ 'public/js/helper.js', 'modules/auth/public/modules/auth/js/pwd.js', 'modules/auth/public/modules/auth/js/register.js' ]
                }
            },
            module_auth_reset: {
                files: {
                    'modules/auth/public/modules/auth/js/auth_reset.min.js': [ 'public/js/helper.js', 'modules/auth/public/modules/auth/js/reset.js' ]
                }
            },
            module_auth_profile: {
                files: {
                    'modules/auth/public/modules/auth/js/auth_profile.min.js': [ 'public/js/helper.js', 'public/js/jquery.medved.loading.js', 'modules/auth/public/modules/auth/js/pwd.js', 'public/js/uikit/addons/notify.min.js', 'modules/auth/public/modules/auth/js/profile.js' ]
                }
            },
            admin: {
                files: {
                    'public/js/admin.min.js': [ 'public/js/json2.js', 'public/js/jquery.min.js', 'public/js/jquery.history.min.js', 'public/js/jquery.medved.table.js', 'public/js/uikit/uikit.min.js', 'public/js/uikit/addons/notify.min.js', 'public/js/helper.js' ]
                }
            },
            module_files: {
                files: {
                    'modules/files/public/modules/files/js/files.min.js': [ 'modules/files/public/modules/files/js/dragdrop.helper.js', 'modules/files/public/modules/files/js/jquery.shifty.js', 'modules/files/public/modules/files/js/dragdrop.js', 'modules/files/public/modules/files/js/main.js' ]
                }
            },
            module_menu: {
                files: {
                    'modules/menu/public/modules/menu/js/menu.min.js': 'modules/menu/public/modules/menu/js/main.js'
                }
            },
            module_cp: {
                files: {
                    'modules/cp/public/modules/cp/js/cp.min.js': 'modules/cp/public/modules/cp/js/main.js'
                }
            },
            module_pages: {
                files: {
                    'modules/pages/public/modules/pages/js/pages.min.js': [ 'public/js/jquery.medved.loading.js', 'public/js/jstorage.js', 'public/js/moment.min.js', 'modules/pages/public/modules/pages/js/main.js', 'modules/pages/public/modules/pages/js/tree.js' ]
                }
            },
            module_parts: {
                files: {
                    'modules/parts/public/modules/parts/js/parts.min.js': 'modules/parts/public/modules/parts/js/main.js'
                }
            },
            module_browse: {
                files: {
                    'modules/browse/public/modules/browse/js/browse.min.js': 'modules/browse/public/modules/browse/js/main.js'
                }
            },
            module_settings: {
                files: {
                    'modules/settings/public/modules/settings/js/settings.min.js': 'modules/settings/public/modules/settings/js/main.js'
                }
            },
            module_user: {
                files: {
                    'modules/user/public/modules/user/js/user.min.js': 'modules/user/public/modules/user/js/main.js'
                }
            },
            module_search: {
                files: {
                    'modules/search/public/modules/search/js/search.min.js': [ 'public/js/helper.js', 'modules/search/public/modules/search/js/main.js' ]
                }
            },
            module_textedit_codemirror: {
                files: {
                    'modules/textedit/public/modules/textedit/js/codemirror/codemirror.min.js': [ 'modules/textedit/public/modules/textedit/js/codemirror/codemirror.js', 'modules/textedit/public/modules/textedit/js/codemirror/brace-fold.js', 'modules/textedit/public/modules/textedit/js/codemirror/closebrackets.js', 'modules/textedit/public/modules/textedit/js/codemirror/comment.js', 'modules/textedit/public/modules/textedit/js/codemirror/dialog.js', 'modules/textedit/public/modules/textedit/js/codemirror/foldcode.js', 'modules/textedit/public/modules/textedit/js/codemirror/hardwrap.js', 'modules/textedit/public/modules/textedit/js/codemirror/match-highlighter.js', 'modules/textedit/public/modules/textedit/js/codemirror/matchbrackets.js', 'modules/textedit/public/modules/textedit/js/codemirror/search.js', 'modules/textedit/public/modules/textedit/js/codemirror/searchcursor.js', 'modules/textedit/public/modules/textedit/js/codemirror/sublime.js', 'modules/textedit/public/modules/textedit/js/codemirror/mode/css.js', 'modules/textedit/public/modules/textedit/js/codemirror/mode/htmlmixed.js', 'modules/textedit/public/modules/textedit/js/codemirror/mode/javascript.js', 'modules/textedit/public/modules/textedit/js/codemirror/mode/xml.js' ]
                }
            },
            module_textedit: {
                files: {
                    'modules/textedit/public/modules/textedit/js/textedit.min.js': 'modules/textedit/public/modules/textedit/js/main.js'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jsbeautifier');

    grunt.registerTask('default', ['uglify']);
    grunt.registerTask('beautifier', ['jsbeautifier']);

};
