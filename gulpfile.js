'use strict';

var gulp = require('gulp');
var wrench = require('wrench');
var babel = require('gulp-babel');
var runSequence = require('run-sequence');
var exec = require('child_process').exec;
var fs = require('fs');
var argv = require('yargs').argv;
var dateFormat = require('dateformat');

/**
 *  This will load all js or coffee files in the gulp directory
 *  in order to load all gulp tasks
 */
wrench.readdirSyncRecursive('./build').filter(function (file) {
    return (/\.(js)$/i).test(file);
}).map(function (file) {
    require('./build/' + file);
});

/**
 *  Default task clean temporaries directories and launch the
 *  main optimization build task
 */
gulp.task('default', ['clean'], function () {
    gulp.start('build');
});

gulp.task('jenkins:build', function (done) {
    runSequence('clean', 'build', 'version', 'test:jenkins', 'report:plato', done);
});

gulp.task('travis:build', function (done) {
    runSequence('clean', 'build', 'test:jenkins', done);
});

gulp.task('version', function () {
    var pkg = JSON.parse(fs.readFileSync('./package.json'));
    var data = '';

    data += 'Project Name: ' + pkg.name + '\r\n';
    data += 'Build Date: ' + dateFormat(new Date(), 'dddd, mmmm dS, yyyy, h:MM:ss TT') + '\r\n';

    if (argv.ji) {
        data += 'Jenkins Build Number: ' + argv.ji + '\r\n';
    }

    if (argv.gi) {
        data += 'Git Info: ' + argv.gi + '\r\n';
    }

    fs.writeFileSync('dist/version.txt', data);
});

// Temporary babel for plato, until plato supports ES6 (better then nothing for now)
gulp.task('babel', function () {
    gulp.src('src/app/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('.tmp/plato'));
});

gulp.task('report:plato', ['babel'], function (done) {
    exec('node_modules/plato/bin/plato -r -d reports/plato .tmp/plato/**/*.js', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        done(err);
    });
});