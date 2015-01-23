/*global -$ */
'use strict';
// generated on <%= (new Date).toISOString().split('T')[0] %> using <%= pkg.name %> <%= pkg.version %>
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var reload = browserSync.reload;

var styles = function(destination) {<% if (includeSass) { %>
  return gulp.src('app/styles/main.scss')
    .pipe($.sass({
      outputStyle: 'nested', // libsass doesn't support expanded yet
      precision: 10,
      includePaths: ['.'],
      onError: console.error.bind(console, 'Sass error:')
    }))<% } else { %>
  return gulp.src('app/styles/main.css')<% } %>
    .pipe($.postcss([
      require('autoprefixer-core')({browsers: ['last 1 version']})
    ]))
    .pipe(gulp.dest(destination));
}

gulp.task('devStyles', function () {
  styles('.tmp/styles');
});

gulp.task('distStyles', function () {
  styles('<%= buildPath %>');
});

gulp.task('jshint', function () {
  return gulp.src('app/scripts/**/*.js')
    .pipe(reload({stream: true, once: true}))
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

gulp.task('html', ['devStyles'], function () {
  var assets = $.useref.assets({searchPath: ['.tmp', 'app', '.']});

  return gulp.src('app/*.html')
    .pipe(assets)
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.csso()))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
    .pipe(gulp.dest('<%= buildPath %>'));
});

// gulp.task('images', function () {
//   return gulp.src('app/images/**/*')
//     .pipe($.cache($.imagemin({
//       progressive: true,
//       interlaced: true
//     })))
//     .pipe(gulp.dest('<%= buildPath %>/images'));
// });

gulp.task('fonts', function () {
  return gulp.src(require('main-bower-files')().concat('app/fonts/**/*'))
    .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
    .pipe($.flatten())
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(gulp.dest('<%= buildPath %>/fonts'));
});

gulp.task('extras', function () {
  return gulp.src([
    'app/*.*',
    '!app/*.html',
    'node_modules/apache-server-configs/dist/.htaccess'
  ], {
    dot: true
  }).pipe(gulp.dest('<%= buildPath %>'));
});

gulp.task('clean', require('del').bind(null, ['.tmp', '<%= buildPath %>']));

gulp.task('serve', <% if (includeSass) { %> ['devStyles'],<% } %>function () {
  browserSync({
    notify: false,
    port: <%= defaultPort %>,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  // watch for changes
  gulp.watch([
    'app/*.html',
    '.tmp/styles/**/*.css',
    'app/scripts/**/*.js',
    'app/images/**/*'
  ]).on('change', reload);

  gulp.watch('app/styles/**/*.<%= includeSass ? 'scss' : 'css' %>', ['devStyles', reload]);
  gulp.watch('bower.json', ['wiredep', 'fonts', reload]);  
});

// inject bower components
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;
<% if (includeSass) { %>
  gulp.src('app/styles/*.scss')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'));
<% } %>
  gulp.src('app/*.html')
    .pipe(wiredep({<% if (includeSass && includeBootstrap) { %>
      exclude: ['bootstrap-sass-official'],<% } %>
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('build', ['jshint', 'html', /*'images',*/ 'fonts', 'extras', 'distStyles'], function () {
  return gulp.src('<%= buildPath %>/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], function () {
  gulp.start('build');
});
