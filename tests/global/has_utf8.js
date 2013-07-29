registerTest ('Has a UTF-8 meta tag', {
    setup: function() {
        this.utf8MatchString = '<meta charset="utf-8">';
    },
    load : function () {
        this
        .test('Do we have a UTF8 meta tag?', function() {
            var sourceCode = this.page.source.toLowerCase();

            // do we have an utf8 metatag ?
            notEqual(sourceCode.indexOf(this.utf8MatchString),-1,'Has UTF-8 meta tag');
        })
        .start();
    }
});
