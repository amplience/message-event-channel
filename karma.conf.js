module.exports = function(config) {
  config.set({
      frameworks: ["jasmine", "karma-typescript"],
      files: [
          { pattern: "src/**/*.ts" },
          { pattern: 'src/**/*.html',  included: false, served:true},
          { pattern: 'dist/message-io.umd.js', included:false, served:true},
          { pattern: 'src/**/*.map', included:false, served:true},
          { pattern: 'dist/**/*.map', included:false, served:true}
      ],
      preprocessors: {
          "src/**/*.ts": ["karma-typescript"],
          'src/**/!(*spec).ts': 'coverage'
      },
      reporters: ["dots", "coverage", "karma-typescript"],
      browsers: ["ChromeHeadless", "Firefox"],
      coverageReporter: {
        type : 'text',
        dir : 'coverage/'
      } ,
      singleRun: true
  });
};