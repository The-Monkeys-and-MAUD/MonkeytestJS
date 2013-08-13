registerTest ('Is not a server error page', function () {
  this
    .test("Do we have a Server Error message in the page?", function( $ ) {
      equal(this.page.status, 200, 'Response status 200');
    });
});
