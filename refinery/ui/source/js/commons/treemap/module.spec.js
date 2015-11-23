describe('Treemap.module: unit tests', function () {
  'use strict';

  var module;

  beforeEach(function () {
    module = angular.module('treemap');
  });

  describe('Module', function () {

    it('should be registered', function () {
      expect(!!module).toEqual(true);
    });

  });

  describe('Dependencies:', function () {

    var deps,
        hasModule = function (m) {
          return deps.indexOf(m) >= 0;
        };

    beforeEach(function () {
      deps = module.value('treemap').requires;
    });

    // Example
    // it('should have templates-app as a dependency', function () {
    //   expect(hasModule('templates-app')).toEqual(true);
    // });

  });
});