module.exports = function(config) {
  config.set({
    frameworks: ['jasmine', 'karma-typescript'],
    files: [
      { pattern: 'src/**/*.ts' },
      { pattern: 'test/**/*.ts' },
      { pattern: 'test/**/*.html', included: false, served: true },
      { pattern: 'dist/message-io.umd.js', included: false, served: true },
      { pattern: 'dist/**/*.map', included: false, served: true }
    ],
    preprocessors: {
      'src/**/*.ts': ['karma-typescript'],
      'test/**/*.ts': ['karma-typescript'],
      './src/**/!(*spec).ts': ['karma-typescript', 'coverage']
    },
    reporters: ['dots', 'coverage', 'karma-typescript'],
    browsers: ['ChromeHeadless', 'Firefox'],
    coverageReporter: {
      type: 'text',
      dir: 'coverage/'
    },
    singleRun: true
  });
};
