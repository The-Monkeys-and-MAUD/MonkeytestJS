registerTest ('Has a UTF-8 meta tag', function () {
    this
    .test('Do we have a UTF8 meta tag?', function($) {
        var sourceCode = this.page.source.toLowerCase();
        // do we have an utf8 metatag ?
        notEqual(sourceCode.indexOf('<meta charset="utf-8">'),-1,'Has UTF-8 meta tag');
    });
});
