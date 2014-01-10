registerTest ('Is not a server error page', function () {
  if (!this.config.loadSources) {
    console.warn('Not configured to load sources via AJAX so skipping the server error test.');
  } else {
    this
      .test("Do we have a Server Error message in the page?", function( $ ) {
        equal(this.page.status, 200, 'Response status 200');
      });
  }
});
