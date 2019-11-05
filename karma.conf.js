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
      'test/**/*.ts': ['karma-typescript']
    },
    reporters: ['dots', 'karma-typescript'],
    browsers: ['ChromeHeadless', 'Firefox'],
    karmaTypescriptConfig: {
      reports: {
        text: null,
        'text-summary': null,
        html: 'coverage/'
      }
    },
    singleRun: false
  });
};
