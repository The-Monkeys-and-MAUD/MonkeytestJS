registerTest ('Is not a server error page', function () {
  if (this.runner.baseUrl.substr(0, 4) === 'file') {
    console.warn('Running from local filesystem so skipping the server error test.');
  } else {
    this
      .test("Do we have a Server Error message in the page?", function( $ ) {
        equal(this.page.status, 200, 'Response status 200');
      });
  }
});
