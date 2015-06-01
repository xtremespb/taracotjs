/*
Copyright (c) 2014 Michael A. Matveev
*/
CKEDITOR.plugins.add('pages', {
    requires: 'dialog',
    lang: 'en,ru,de',
    icons: 'pages',
    hidpi: true,
    init: function(editor) {
        var command = editor.addCommand('pages', new CKEDITOR.dialogCommand('pages'));
        command.modes = {
            wysiwyg: 1,
            source: 1
        };
        command.canUndo = false;
        command.readOnly = 1;
        if (editor.ui.addButton) {
            editor.ui.addButton('pages', {
                label: editor.lang.pages.title,
                command: 'pages',
                toolbar: 'taracot'
            });
        }
        CKEDITOR.dialog.add('pages', this.path + 'dialogs/pages.js');
    }
});
