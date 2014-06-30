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
        // Concat
        concat: {
            module_auth: {
                src: [
                    'modules/auth/public/modules/auth/js/main.js'
                ],
                dest: 'modules/auth/public/modules/auth/js/auth.min.js'
            },
            admin: {
                src: [
                    'public/js/jquery.min.js',
                    'public/js/jquery.history.min.js',
                    'public/js/jquery.medved.table.js',
                    'public/js/uikit/uikit.min.js',
                    'public/js/uikit/addons/notify.min.js',
                    'public/js/helper.js'
                ],
                dest: 'public/js/admin.min.js'
            },
            module_files: {
                src: [
                    'modules/files/public/modules/files/js/dragdrop.helper.js',
                    'modules/files/public/modules/files/js/jquery.shifty.js',
                    'modules/files/public/modules/files/js/dragdrop.js',
                    'modules/files/public/modules/files/js/main.js'
                ],
                dest: 'modules/files/public/modules/files/js/files.min.js'
            },
            module_menu: {
                src: [
                    'modules/menu/public/modules/menu/js/main.js'
                ],
                dest: 'modules/menu/public/modules/menu/js/menu.min.js'
            },
            module_pages: {
                src: [
                    'modules/pages/public/modules/pages/js/main.js',
                    'modules/pages/public/modules/pages/js/tree.js'
                ],
                dest: 'modules/pages/public/modules/pages/js/pages.min.js'
            },
            module_settings: {
                src: [
                    'modules/settings/public/modules/settings/js/main.js'
                ],
                dest: 'modules/settings/public/modules/settings/js/settings.min.js'
            },
            module_user: {
                src: [
                    'modules/user/public/modules/user/js/main.js'
                ],
                dest: 'modules/user/public/modules/user/js/user.min.js'
            },
        },
        // Compress
        uglify: {
            module_auth: {
                files: {
                    'modules/auth/public/modules/auth/js/auth.min.js': '<%= concat.module_auth.dest %>'
                }
            },
            admin: {
                files: {
                    'public/js/admin.min.js': '<%= concat.admin.dest %>'
                }
            },
            module_files: {
                files: {
                    'modules/files/public/modules/files/js/files.min.js': '<%= concat.module_files.dest %>'
                }
            },
            module_menu: {
                files: {
                    'modules/menu/public/modules/menu/js/menu.min.js': '<%= concat.module_menu.dest %>'
                }
            },
            module_pages: {
                files: {
                    'modules/pages/public/modules/pages/js/pages.min.js': '<%= concat.module_pages.dest %>'
                }
            },
            module_settings: {
                files: {
                    'modules/settings/public/modules/settings/js/settings.min.js': '<%= concat.module_settings.dest %>'
                }
            },
            module_user: {
                files: {
                    'modules/user/public/modules/user/js/user.min.js': '<%= concat.module_user.dest %>'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jsbeautifier');

    grunt.registerTask('default', ['concat', 'uglify']);
    grunt.registerTask('beautifier', ['jsbeautifier']);

};