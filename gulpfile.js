var gulp = require('gulp');
var tsc = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var shell = require("gulp-shell");
var tslint = require("gulp-tslint");
var merge = require("merge-stream");
var del = require("del");
var glob = require("glob");

var allJsFilter = function(file) {
  return file.replace(/.ts$/, ".js");
};

var allJsMapFilter = function(file) {
  return file.replace(/.ts$/, ".js.map");
};

gulp.task("clean", function() {
  return glob("src/**/*.ts", function(err, files) {
      del(files.map(allJsFilter));
      del(files.map(allJsMapFilter));
  });
});

var typescriptCompiler = tsc.createProject("tsconfig.json", {
  "typescript": require("typescript")
});
gulp.task("build", function() {
  return gulp.src(typescriptCompiler.config.filesGlob)
      .pipe(sourcemaps.init())
      .pipe(typescriptCompiler())
      .pipe(sourcemaps.write(".", {
          includeContent: false,
          sourceRoot: function(file) {
              return file.cwd + "/src";
          }
      }))
      .pipe(gulp.dest("src"));
});

gulp.task("lint", function() {
  return gulp.src(["src/**/*.ts"])
      .pipe(tslint({
          formatter: "prose"
      }))
      .pipe(tslint.report({
          emitError: true,
          reportLimit: 0,
          summarizeFailureOutput: true
      }));

});

gulp.task("run", ["build"], shell.task([
  "node ./src/app.js"
]));

gulp.task("default", ["run"]);

gulp.task("watch", function() {
  gulp.watch("src/**/*.ts", ["build"]);
});

gulp.task("deploy-with-config", ["build"], function () {
  del.sync("dist");
  var srcFiles = gulp.src(["src/**/*.js", "package.json", "startup.json"])
      .pipe(gulp.dest("dist"));

  var config = gulp.src("config/*.*", {
          base: "./"
      })
      .pipe(gulp.dest("dist"));

  var swagger = gulp.src("./api/swagger/swagger.yaml")
      .pipe(gulp.dest("dist/api/swagger"));

  return merge(srcFiles, config, swagger);
});

gulp.task("deploy-without-config", ["build"], function () {
  del.sync("dist");
  var srcFiles = gulp.src(["src/**/*.js", "package.json", "startup.json"])
      .pipe(gulp.dest("dist"));

  var swagger = gulp.src("./api/swagger/swagger.yaml")
      .pipe(gulp.dest("dist/api/swagger"));

  return merge(srcFiles, swagger);
});