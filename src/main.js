require.config({
    //baseUrl: 'src',
    paths: {
        jquery: '../bower_components/jquery/dist/jquery.min',
        lodash: '../bower_components/lodash/lodash.min',
        text: '../bower_components/text/text',
        bootstrap: '../bower_components/bootstrap/dist/js/bootstrap.min'
    },
    shim: {
        'jquery': {
            exports: '$'
        },
        'lodash': {
            exports: '_'
        },
        'text': {
            exports: 'text'
        }
        //'bootstrap' : {
        //    "deps" :['jquery']
        //}
    }
});

require(['app']);