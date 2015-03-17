module.exports = function(config) {
  config.set({
    basePath: '',
    baseUrl: '/base',
    frameworks: ['jasmine', 'requirejs'],
    files: [
      {pattern: 'bower_components/jquery/dist/jquery.min.js', included: false},
      {pattern: 'bower_components/lodash/lodash.min.js', included: false},
      {pattern: 'bower_components/text/text', included: false},
      {pattern: 'src/SQL_Engine/*.js', included: true},
      {pattern: 'test/spec/**/*Spec.coffee', included: false},
      'test-main.js'
    ],
    exclude: [],
    preprocessors: {
      'src/**/*.js': ['coverage'],
      '**/*.coffee': ['coffee']
    },
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    coffeePreprocessor: {
      options: {
        bare: true,
        sourceMap: true
      },
      transformPath: function(path) {
        return path.replace(/\.coffee$/, '.js');
      }
    }
  });
};
