registerTest ('Has a UTF-8 meta tag', function () {
    this
    .test('Do we have a UTF8 meta tag?', function($) {
        // do we have an utf8 metatag ?
        var meta = $('meta[charset]');
        equal(1, meta.length, 'Has a meta charset tag');
        if (meta.length) {
            var charset = meta.attr('charset');
            ok(!!charset, 'Has a meta charset tag with a non-empty charset');
            if (charset) {
                equal('utf-8', charset.toLowerCase(),'Has UTF-8 meta tag');
            }
        }
    });
});
